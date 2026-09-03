use aes_gcm::{
    Aes256Gcm, KeyInit,
    aead::{Aead, Payload},
};
use argon2::{Algorithm, Argon2, Params, Version};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use ed25519_dalek::{Signer, SigningKey, pkcs8::DecodePrivateKey};
use fips204::{
    ml_dsa_65,
    traits::{KeyGen as _, SerDes as _, Signer as _},
};
use rand_core::{OsRng, RngCore};
use serde::{Deserialize, Serialize};
use subtle::ConstantTimeEq;
use unicode_normalization::UnicodeNormalization;
use wasm_bindgen::prelude::*;
use zeroize::{Zeroize, Zeroizing};

const OUTER_SCHEMA: &str = "castalia.wallet-custody.v1";
const SECRET_SCHEMA: &str = "castalia.wallet-secret.v1";
const RECOVERY_KEY_PREFIX: &str = "castalia-recovery-key-v1";
const RECOVERY_CHECKSUM_DOMAIN: &[u8] = b"castalia/recovery-key/v1\0";
const ZENITH_MEMBERSHIP_JOIN_DOMAIN: &[u8] = b"castalia/zenith-membership-join/v3\0";
const MAX_WALLET_BYTES: usize = 1_048_576;
const DREGG_HYBRID_TURN_PQ_CONTEXT: &[u8] = b"dregg-hybrid-turn-v1";
const DREGG_ML_DSA_KEY_COMMITMENT_DOMAIN: &str = "dregg-cell-ml-dsa-key-v1";
const ED25519_PKCS8_PREFIX: [u8; 16] = [
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum CustodyError {
    #[error("invalid_wallet_file")]
    InvalidWalletFile,
}

type Result<T> = core::result::Result<T, CustodyError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct KdfHeader {
    name: String,
    version: u32,
    salt: String,
    #[serde(rename = "memoryKiB")]
    memory_kib: u32,
    iterations: u32,
    parallelism: u32,
    derived_key_bytes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct AeadHeader {
    name: String,
    nonce: String,
    tag_bits: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Header {
    schema: String,
    key_suite: String,
    public_key: String,
    created_at: u64,
    kdf: KdfHeader,
    aead: AeadHeader,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Container {
    schema: String,
    key_suite: String,
    public_key: String,
    created_at: u64,
    kdf: KdfHeader,
    aead: AeadHeader,
    ciphertext: String,
}

impl Container {
    fn header(&self) -> Header {
        Header {
            schema: self.schema.clone(),
            key_suite: self.key_suite.clone(),
            public_key: self.public_key.clone(),
            created_at: self.created_at,
            kdf: self.kdf.clone(),
            aead: self.aead.clone(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct SecretPlaintext {
    schema: String,
    key_id: String,
    private_key_pkcs8: String,
    created_at: u64,
}

pub struct OpenedWallet {
    signing_key: SigningKey,
    ml_dsa_signing_key: ml_dsa_65::PrivateKey,
    ml_dsa_public_key: [u8; ml_dsa_65::PK_LEN],
    created_at: u64,
}

impl OpenedWallet {
    fn from_seed(seed: &[u8; 32], created_at: u64) -> Self {
        let signing_key = SigningKey::from_bytes(seed);
        let (ml_dsa_public_key, ml_dsa_signing_key) = ml_dsa_65::KG::keygen_from_seed(seed);
        Self {
            signing_key,
            ml_dsa_signing_key,
            ml_dsa_public_key: ml_dsa_public_key.into_bytes(),
            created_at,
        }
    }

    pub fn public_key_hex(&self) -> String {
        hex::encode(self.signing_key.verifying_key().to_bytes())
    }

    pub fn ml_dsa_public_key_base64url(&self) -> String {
        URL_SAFE_NO_PAD.encode(self.ml_dsa_public_key)
    }

    pub fn ml_dsa_public_key_commitment_hex(&self) -> String {
        let mut hasher = blake3::Hasher::new_derive_key(DREGG_ML_DSA_KEY_COMMITMENT_DOMAIN);
        hasher.update(&(self.ml_dsa_public_key.len() as u32).to_le_bytes());
        hasher.update(&self.ml_dsa_public_key);
        hasher.finalize().to_hex().to_string()
    }

    pub fn sign_zenith_membership_join(&self) -> [u8; 64] {
        let mut transcript = Vec::with_capacity(ZENITH_MEMBERSHIP_JOIN_DOMAIN.len() + 32);
        transcript.extend_from_slice(ZENITH_MEMBERSHIP_JOIN_DOMAIN);
        transcript.extend_from_slice(&self.signing_key.verifying_key().to_bytes());
        self.signing_key.sign(&transcript).to_bytes()
    }

    pub fn sign_dregg_pq(&self, message: &[u8]) -> Result<Vec<u8>> {
        self.ml_dsa_signing_key
            .try_sign_with_seed(&[0_u8; 32], message, DREGG_HYBRID_TURN_PQ_CONTEXT)
            .map(|signature| signature.to_vec())
            .map_err(closed)
    }

    pub fn recovery_key(&self) -> Zeroizing<String> {
        encode_recovery_key(&self.signing_key.to_bytes())
    }

    pub fn export_randomized(&self, passphrase: &str) -> Result<Zeroizing<String>> {
        let mut salt = [0_u8; 16];
        let mut nonce = [0_u8; 12];
        OsRng.fill_bytes(&mut salt);
        OsRng.fill_bytes(&mut nonce);
        encrypt_wallet(
            &self.signing_key.to_bytes(),
            passphrase,
            self.created_at,
            salt,
            nonce,
        )
    }
}

pub fn create_wallet(
    passphrase: &str,
    created_at: u64,
) -> Result<(OpenedWallet, Zeroizing<String>)> {
    let mut seed = Zeroizing::new([0_u8; 32]);
    let mut salt = [0_u8; 16];
    let mut nonce = [0_u8; 12];
    OsRng.fill_bytes(seed.as_mut());
    OsRng.fill_bytes(&mut salt);
    OsRng.fill_bytes(&mut nonce);
    let encoded = encrypt_wallet(&seed, passphrase, created_at, salt, nonce)?;
    Ok((OpenedWallet::from_seed(&seed, created_at), encoded))
}

pub fn restore_wallet_from_recovery_key(
    recovery_key: &str,
    passphrase: &str,
    created_at: u64,
) -> Result<(OpenedWallet, Zeroizing<String>)> {
    let seed = decode_recovery_key(recovery_key)?;
    let mut salt = [0_u8; 16];
    let mut nonce = [0_u8; 12];
    OsRng.fill_bytes(&mut salt);
    OsRng.fill_bytes(&mut nonce);
    let encoded = encrypt_wallet(&seed, passphrase, created_at, salt, nonce)?;
    Ok((OpenedWallet::from_seed(&seed, created_at), encoded))
}

fn encrypt_wallet(
    seed: &[u8; 32],
    passphrase: &str,
    created_at: u64,
    salt: [u8; 16],
    nonce: [u8; 12],
) -> Result<Zeroizing<String>> {
    let signing_key = SigningKey::from_bytes(seed);
    let public_key = signing_key.verifying_key().to_bytes();
    let header = Header {
        schema: OUTER_SCHEMA.into(),
        key_suite: "Ed25519".into(),
        public_key: hex::encode(public_key),
        created_at,
        kdf: KdfHeader {
            name: "Argon2id".into(),
            version: 19,
            salt: URL_SAFE_NO_PAD.encode(salt),
            memory_kib: 65_536,
            iterations: 3,
            parallelism: 1,
            derived_key_bytes: 32,
        },
        aead: AeadHeader {
            name: "AES-256-GCM".into(),
            nonce: URL_SAFE_NO_PAD.encode(nonce),
            tag_bits: 128,
        },
    };
    let aad = jcs_to_vec(&header)?;
    let mut pkcs8 = Zeroizing::new(Vec::with_capacity(48));
    pkcs8.extend_from_slice(&ED25519_PKCS8_PREFIX);
    pkcs8.extend_from_slice(seed);
    let secret = SecretPlaintext {
        schema: SECRET_SCHEMA.into(),
        key_id: blake3::hash(&public_key).to_hex().to_string(),
        private_key_pkcs8: URL_SAFE_NO_PAD.encode(pkcs8.as_slice()),
        created_at,
    };
    let mut plaintext = Zeroizing::new(jcs_to_vec(&secret)?);
    let key = derive_key(passphrase, &salt)?;
    let cipher = Aes256Gcm::new_from_slice(key.as_ref()).map_err(closed)?;
    let ciphertext = cipher
        .encrypt(
            (&nonce).into(),
            Payload {
                msg: plaintext.as_ref(),
                aad: &aad,
            },
        )
        .map_err(closed)?;
    plaintext.zeroize();
    let container = Container {
        schema: header.schema,
        key_suite: header.key_suite,
        public_key: header.public_key,
        created_at: header.created_at,
        kdf: header.kdf,
        aead: header.aead,
        ciphertext: URL_SAFE_NO_PAD.encode(ciphertext),
    };
    Ok(Zeroizing::new(
        String::from_utf8(jcs_to_vec(&container)?).map_err(closed)?,
    ))
}

pub fn import_wallet(encoded: &[u8], passphrase: &str) -> Result<OpenedWallet> {
    if encoded.is_empty() || encoded.len() > MAX_WALLET_BYTES {
        return Err(CustodyError::InvalidWalletFile);
    }
    let container: Container = serde_json::from_slice(encoded).map_err(closed)?;
    validate_header(&container)?;
    let salt = decode_exact::<16>(&container.kdf.salt)?;
    let nonce = decode_exact::<12>(&container.aead.nonce)?;
    let ciphertext = URL_SAFE_NO_PAD
        .decode(container.ciphertext.as_bytes())
        .map_err(closed)?;
    if ciphertext.len() < 16 {
        return Err(CustodyError::InvalidWalletFile);
    }
    let aad = jcs_to_vec(&container.header())?;
    let key = derive_key(passphrase, &salt)?;
    let cipher = Aes256Gcm::new_from_slice(key.as_ref()).map_err(closed)?;
    let mut plaintext = Zeroizing::new(
        cipher
            .decrypt(
                (&nonce).into(),
                Payload {
                    msg: &ciphertext,
                    aad: &aad,
                },
            )
            .map_err(closed)?,
    );
    let secret: SecretPlaintext = serde_json::from_slice(&plaintext).map_err(closed)?;
    if secret.schema != SECRET_SCHEMA || secret.created_at != container.created_at {
        return Err(CustodyError::InvalidWalletFile);
    }
    let mut pkcs8 = Zeroizing::new(
        URL_SAFE_NO_PAD
            .decode(secret.private_key_pkcs8.as_bytes())
            .map_err(closed)?,
    );
    let signing_key = SigningKey::from_pkcs8_der(&pkcs8).map_err(closed)?;
    let derived_public = signing_key.verifying_key().to_bytes();
    let outer_public = decode_hex_32(&container.public_key)?;
    let derived_key_id = blake3::hash(&derived_public);
    let claimed_key_id = decode_hex_32(&secret.key_id)?;
    if !bool::from(derived_public.ct_eq(&outer_public))
        || !bool::from(derived_key_id.as_bytes().ct_eq(&claimed_key_id))
    {
        return Err(CustodyError::InvalidWalletFile);
    }
    let seed = signing_key.to_bytes();
    plaintext.zeroize();
    pkcs8.zeroize();
    Ok(OpenedWallet::from_seed(&seed, container.created_at))
}

fn encode_recovery_key(seed: &[u8; 32]) -> Zeroizing<String> {
    let mut hasher = blake3::Hasher::new();
    hasher.update(RECOVERY_CHECKSUM_DOMAIN);
    hasher.update(seed);
    let checksum = &hasher.finalize().as_bytes()[..4];
    Zeroizing::new(format!(
        "{RECOVERY_KEY_PREFIX}.{}.{}",
        URL_SAFE_NO_PAD.encode(seed),
        URL_SAFE_NO_PAD.encode(checksum)
    ))
}

fn decode_recovery_key(value: &str) -> Result<Zeroizing<[u8; 32]>> {
    let mut parts = value.split('.');
    let prefix = parts.next().ok_or(CustodyError::InvalidWalletFile)?;
    let seed = parts.next().ok_or(CustodyError::InvalidWalletFile)?;
    let checksum = parts.next().ok_or(CustodyError::InvalidWalletFile)?;
    if prefix != RECOVERY_KEY_PREFIX || parts.next().is_some() {
        return Err(CustodyError::InvalidWalletFile);
    }
    let seed = Zeroizing::new(decode_exact::<32>(seed)?);
    let checksum = decode_exact::<4>(checksum)?;
    let expected = encode_recovery_key(&seed);
    let expected_checksum = expected
        .rsplit('.')
        .next()
        .ok_or(CustodyError::InvalidWalletFile)?;
    let expected_checksum = decode_exact::<4>(expected_checksum)?;
    if !bool::from(checksum.ct_eq(&expected_checksum)) {
        return Err(CustodyError::InvalidWalletFile);
    }
    Ok(seed)
}

fn validate_header(container: &Container) -> Result<()> {
    if container.schema != OUTER_SCHEMA
        || container.key_suite != "Ed25519"
        || container.kdf.name != "Argon2id"
        || container.kdf.version != 19
        || container.kdf.memory_kib != 65_536
        || container.kdf.iterations != 3
        || container.kdf.parallelism != 1
        || container.kdf.derived_key_bytes != 32
        || container.aead.name != "AES-256-GCM"
        || container.aead.tag_bits != 128
    {
        return Err(CustodyError::InvalidWalletFile);
    }
    decode_hex_32(&container.public_key)?;
    Ok(())
}

fn derive_key(passphrase: &str, salt: &[u8; 16]) -> Result<Zeroizing<[u8; 32]>> {
    let normalized: Zeroizing<String> = Zeroizing::new(passphrase.nfc().collect());
    if normalized.is_empty() {
        return Err(CustodyError::InvalidWalletFile);
    }
    let params = Params::new(65_536, 3, 1, Some(32)).map_err(closed)?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut key = Zeroizing::new([0_u8; 32]);
    argon2
        .hash_password_into(normalized.as_bytes(), salt, key.as_mut())
        .map_err(closed)?;
    Ok(key)
}

fn decode_exact<const N: usize>(encoded: &str) -> Result<[u8; N]> {
    let decoded = URL_SAFE_NO_PAD.decode(encoded.as_bytes()).map_err(closed)?;
    if URL_SAFE_NO_PAD.encode(&decoded) != encoded {
        return Err(CustodyError::InvalidWalletFile);
    }
    decoded.try_into().map_err(closed)
}

fn decode_hex_32(encoded: &str) -> Result<[u8; 32]> {
    if encoded.len() != 64
        || encoded
            .bytes()
            .any(|byte| !byte.is_ascii_digit() && !(b'a'..=b'f').contains(&byte))
    {
        return Err(CustodyError::InvalidWalletFile);
    }
    hex::decode(encoded)
        .map_err(closed)?
        .try_into()
        .map_err(closed)
}

fn closed<T>(_: T) -> CustodyError {
    CustodyError::InvalidWalletFile
}

fn jcs_to_vec(value: &impl Serialize) -> Result<Vec<u8>> {
    let value = serde_json::to_value(value).map_err(closed)?;
    serde_jcs::to_vec(&value).map_err(closed)
}

#[wasm_bindgen]
pub struct WebWalletCustody {
    inner: Option<OpenedWallet>,
}

#[wasm_bindgen]
impl WebWalletCustody {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { inner: None }
    }

    #[wasm_bindgen(js_name = create)]
    pub fn create(
        &mut self,
        passphrase: &str,
        created_at: u64,
    ) -> core::result::Result<String, JsValue> {
        let (wallet, encoded) = create_wallet(passphrase, created_at).map_err(js_closed)?;
        self.inner = Some(wallet);
        Ok(encoded.to_string())
    }

    #[wasm_bindgen(js_name = restoreFromRecoveryKey)]
    pub fn restore_from_recovery_key(
        &mut self,
        recovery_key: &str,
        passphrase: &str,
        created_at: u64,
    ) -> core::result::Result<String, JsValue> {
        let (wallet, encoded) =
            restore_wallet_from_recovery_key(recovery_key, passphrase, created_at)
                .map_err(js_closed)?;
        self.inner = Some(wallet);
        Ok(encoded.to_string())
    }

    #[wasm_bindgen(js_name = unlock)]
    pub fn unlock(
        &mut self,
        encoded: &[u8],
        passphrase: &str,
    ) -> core::result::Result<String, JsValue> {
        let wallet = import_wallet(encoded, passphrase).map_err(js_closed)?;
        let public_key = wallet.public_key_hex();
        self.inner = Some(wallet);
        Ok(public_key)
    }

    #[wasm_bindgen(js_name = exportRandomized)]
    pub fn export_randomized(&self, passphrase: &str) -> core::result::Result<String, JsValue> {
        self.wallet()?
            .export_randomized(passphrase)
            .map(|value| value.to_string())
            .map_err(js_closed)
    }

    #[wasm_bindgen(js_name = recoveryKey)]
    pub fn recovery_key(&self) -> core::result::Result<String, JsValue> {
        Ok(self.wallet()?.recovery_key().to_string())
    }

    #[wasm_bindgen(js_name = publicKey)]
    pub fn public_key(&self) -> core::result::Result<String, JsValue> {
        Ok(self.wallet()?.public_key_hex())
    }

    #[wasm_bindgen(js_name = mlDsaPublicKey)]
    pub fn ml_dsa_public_key(&self) -> core::result::Result<String, JsValue> {
        Ok(self.wallet()?.ml_dsa_public_key_base64url())
    }

    #[wasm_bindgen(js_name = mlDsaPublicKeyCommitment)]
    pub fn ml_dsa_public_key_commitment(&self) -> core::result::Result<String, JsValue> {
        Ok(self.wallet()?.ml_dsa_public_key_commitment_hex())
    }

    #[wasm_bindgen(js_name = signZenithMembershipJoin)]
    pub fn sign_zenith_membership_join(&self) -> core::result::Result<Vec<u8>, JsValue> {
        Ok(self.wallet()?.sign_zenith_membership_join().to_vec())
    }

    #[wasm_bindgen(js_name = signDreggPq)]
    pub fn sign_dregg_pq(&self, message: &[u8]) -> core::result::Result<Vec<u8>, JsValue> {
        self.wallet()?.sign_dregg_pq(message).map_err(js_closed)
    }

    pub fn lock(&mut self) {
        self.inner = None;
    }
}

impl Default for WebWalletCustody {
    fn default() -> Self {
        Self::new()
    }
}

impl WebWalletCustody {
    fn wallet(&self) -> core::result::Result<&OpenedWallet, JsValue> {
        self.inner
            .as_ref()
            .ok_or_else(|| js_closed(CustodyError::InvalidWalletFile))
    }
}

fn js_closed(_: CustodyError) -> JsValue {
    JsValue::from_str("invalid_wallet_file")
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::Verifier as _;

    #[test]
    fn random_recovery_round_trip_restores_the_same_hybrid_identity() {
        let (wallet, _) = create_wallet("correct horse battery staple", 42).unwrap();
        let recovery = wallet.recovery_key();
        let (restored, _) =
            restore_wallet_from_recovery_key(&recovery, "new local passphrase", 43).unwrap();
        assert_eq!(wallet.public_key_hex(), restored.public_key_hex());
        assert_eq!(
            wallet.ml_dsa_public_key_commitment_hex(),
            restored.ml_dsa_public_key_commitment_hex()
        );
    }

    #[test]
    fn random_encrypted_export_rejects_tampering() {
        let (wallet, encrypted) = create_wallet("not a fixture", 42).unwrap();
        let mut value: serde_json::Value = serde_json::from_str(&encrypted).unwrap();
        value["publicKey"] = serde_json::Value::String("00".repeat(32));
        let tampered = serde_json::to_vec(&value).unwrap();
        assert!(matches!(
            import_wallet(&tampered, "not a fixture"),
            Err(CustodyError::InvalidWalletFile)
        ));
        assert_eq!(wallet.public_key_hex().len(), 64);
    }

    #[test]
    fn random_encrypted_export_restores_identity_and_membership_signer() {
        let (wallet, encrypted) = create_wallet("generated at runtime", 42).unwrap();
        let imported = import_wallet(encrypted.as_bytes(), "generated at runtime").unwrap();
        assert_eq!(wallet.public_key_hex(), imported.public_key_hex());
        assert_eq!(
            wallet.ml_dsa_public_key_base64url(),
            imported.ml_dsa_public_key_base64url()
        );

        let mut transcript = Vec::from(ZENITH_MEMBERSHIP_JOIN_DOMAIN);
        transcript.extend_from_slice(&imported.signing_key.verifying_key().to_bytes());
        let signature =
            ed25519_dalek::Signature::from_bytes(&imported.sign_zenith_membership_join());
        imported
            .signing_key
            .verifying_key()
            .verify(&transcript, &signature)
            .unwrap();
    }
}
