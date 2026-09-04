use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

mod custody;
pub use custody::*;

const VERSION: &str = "castalia.wallet-onboarding.v1";
const OPERATION: &str = "authenticate";
const MEMBERSHIP_PRESENTATION_SCHEMA: &str = "castalia.wallet-membership-presentation.v2";
const MEMBERSHIP_OPERATION: &str = "castalia.membership.enroll";
const MEMBERSHIP_APPLICATION_DOMAIN: &[u8] = b"castalia/member-application/v1\0";
const MEMBERSHIP_CHALLENGE_DOMAIN: &[u8] = b"castalia/wallet-membership-enrollment/v2\0";
const MAX_SAFE_INTEGER: u64 = 9_007_199_254_740_991;

#[derive(Clone, Copy, Debug)]
pub struct ValidationContext<'a> {
    pub expected_origin: &'a str,
    pub expected_audience: &'a str,
    pub now_ms: u64,
    pub maximum_lifetime_ms: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ValidationError {
    Malformed,
    UnsupportedVersion,
    WrongOrigin,
    WrongAudience,
    WrongOperation,
    MissingField,
    NotYetValid,
    Expired,
    LifetimeTooLong,
    OwnerMismatch,
    ApplicationCommitmentMismatch,
    InvalidSignature,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ValidatedEnvelope {
    pub request_id: String,
    pub nonce: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct OnboardingEnvelope {
    version: String,
    request_id: String,
    origin: String,
    audience: String,
    operation: String,
    nonce: String,
    issued_at_ms: u64,
    expires_at_ms: u64,
}

pub fn validate_onboarding_envelope_json(
    input: &str,
    context: ValidationContext<'_>,
) -> Result<ValidatedEnvelope, ValidationError> {
    let envelope: OnboardingEnvelope =
        serde_json::from_str(input).map_err(|_| ValidationError::Malformed)?;

    if envelope.version != VERSION {
        return Err(ValidationError::UnsupportedVersion);
    }
    if envelope.origin != context.expected_origin {
        return Err(ValidationError::WrongOrigin);
    }
    if envelope.audience != context.expected_audience {
        return Err(ValidationError::WrongAudience);
    }
    if envelope.operation != OPERATION {
        return Err(ValidationError::WrongOperation);
    }
    if envelope.request_id.is_empty() || envelope.nonce.is_empty() {
        return Err(ValidationError::MissingField);
    }
    if envelope.issued_at_ms > context.now_ms {
        return Err(ValidationError::NotYetValid);
    }
    if envelope.expires_at_ms <= context.now_ms {
        return Err(ValidationError::Expired);
    }
    let lifetime = envelope
        .expires_at_ms
        .checked_sub(envelope.issued_at_ms)
        .ok_or(ValidationError::Malformed)?;
    if lifetime > context.maximum_lifetime_ms {
        return Err(ValidationError::LifetimeTooLong);
    }

    Ok(ValidatedEnvelope {
        request_id: envelope.request_id,
        nonce: envelope.nonce,
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BrowserDecision {
    allowed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    reason: Option<ValidationError>,
}

#[wasm_bindgen]
pub fn validate_onboarding_envelope(
    input: &str,
    expected_origin: &str,
    expected_audience: &str,
    now_ms: f64,
) -> String {
    if !now_ms.is_finite() || now_ms < 0.0 || now_ms > u64::MAX as f64 {
        return serde_json::to_string(&BrowserDecision {
            allowed: false,
            reason: Some(ValidationError::Malformed),
        })
        .expect("serializing a fixed validation decision cannot fail");
    }

    let decision = match validate_onboarding_envelope_json(
        input,
        ValidationContext {
            expected_origin,
            expected_audience,
            now_ms: now_ms as u64,
            maximum_lifetime_ms: 60_000,
        },
    ) {
        Ok(_) => BrowserDecision {
            allowed: true,
            reason: None,
        },
        Err(reason) => BrowserDecision {
            allowed: false,
            reason: Some(reason),
        },
    };

    serde_json::to_string(&decision).expect("serializing a fixed validation decision cannot fail")
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct MemberApplicationV1 {
    factory_id: String,
    program_id: String,
    applicant_official_dregg_cell_id: String,
    owner_public_key: String,
    application_kind: u64,
    application_version: u64,
    application_nonce: u64,
    membership_class: u64,
    jurisdiction_code: u64,
    application_flags: u64,
    created_at: u64,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct MembershipChallengeV2 {
    version: u64,
    challenge_id: String,
    nonce: String,
    origin: String,
    audience: String,
    operation: String,
    owner_public_key: String,
    application_commitment: String,
    signature_suite: u64,
    issued_at: u64,
    expires_at: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct MembershipPresentationV2 {
    schema: String,
    owner_public_key: String,
    challenge: MembershipChallengeV2,
    signature_suite: String,
    signature: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PreparedMembershipVerification {
    allowed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    reason: Option<ValidationError>,
    #[serde(skip_serializing_if = "Option::is_none")]
    owner_public_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    transcript_hex: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    signature_hex: Option<String>,
}

struct PreparedMembershipBytes {
    owner_public_key: [u8; 32],
    transcript: Vec<u8>,
    signature: [u8; 64],
}

fn denied_membership(reason: ValidationError) -> String {
    serde_json::to_string(&PreparedMembershipVerification {
        allowed: false,
        reason: Some(reason),
        owner_public_key: None,
        transcript_hex: None,
        signature_hex: None,
    })
    .expect("serializing a fixed membership decision cannot fail")
}

/// Validate the complete v2 membership presentation and return the exact bytes
/// that browser WebCrypto must verify. This is an independent browser-side
/// check; the authority service must repeat it before consuming the challenge.
#[wasm_bindgen]
pub fn prepare_membership_presentation_verification(
    application_json: &str,
    presentation_json: &str,
    expected_origin: &str,
    expected_audience: &str,
    expected_owner_public_key: &str,
    now_ms: f64,
) -> String {
    if !now_ms.is_finite() || now_ms < 0.0 || now_ms > MAX_SAFE_INTEGER as f64 {
        return denied_membership(ValidationError::Malformed);
    }

    let application: MemberApplicationV1 = match serde_json::from_str(application_json) {
        Ok(value) => value,
        Err(_) => return denied_membership(ValidationError::Malformed),
    };
    let presentation: MembershipPresentationV2 = match serde_json::from_str(presentation_json) {
        Ok(value) => value,
        Err(_) => return denied_membership(ValidationError::Malformed),
    };

    let prepared = prepare_membership_verification(
        &application,
        &presentation,
        expected_origin,
        expected_audience,
        expected_owner_public_key,
        now_ms as u64,
    );
    match prepared {
        Ok(prepared) => serde_json::to_string(&PreparedMembershipVerification {
            allowed: true,
            reason: None,
            owner_public_key: Some(hex_encode(&prepared.owner_public_key)),
            transcript_hex: Some(hex_encode(&prepared.transcript)),
            signature_hex: Some(hex_encode(&prepared.signature)),
        })
        .expect("serializing a fixed membership decision cannot fail"),
        Err(reason) => denied_membership(reason),
    }
}

fn prepare_membership_verification(
    application: &MemberApplicationV1,
    presentation: &MembershipPresentationV2,
    expected_origin: &str,
    expected_audience: &str,
    expected_owner_public_key: &str,
    now_ms: u64,
) -> Result<PreparedMembershipBytes, ValidationError> {
    let owner_public_key =
        decode_hex::<32>(&application.owner_public_key).ok_or(ValidationError::Malformed)?;
    let expected_owner =
        decode_hex::<32>(expected_owner_public_key).ok_or(ValidationError::Malformed)?;
    let presentation_owner =
        decode_hex::<32>(&presentation.owner_public_key).ok_or(ValidationError::Malformed)?;
    let challenge_owner = decode_hex::<32>(&presentation.challenge.owner_public_key)
        .ok_or(ValidationError::Malformed)?;
    if owner_public_key != expected_owner
        || presentation_owner != expected_owner
        || challenge_owner != expected_owner
    {
        return Err(ValidationError::OwnerMismatch);
    }

    if presentation.schema != MEMBERSHIP_PRESENTATION_SCHEMA
        || presentation.signature_suite != "Ed25519"
        || presentation.challenge.version != 2
        || presentation.challenge.signature_suite != 1
    {
        return Err(ValidationError::UnsupportedVersion);
    }
    if presentation.challenge.operation != MEMBERSHIP_OPERATION {
        return Err(ValidationError::WrongOperation);
    }
    if presentation.challenge.origin != expected_origin {
        return Err(ValidationError::WrongOrigin);
    }
    if presentation.challenge.audience != expected_audience {
        return Err(ValidationError::WrongAudience);
    }

    let numeric_fields = [
        application.application_kind,
        application.application_version,
        application.application_nonce,
        application.membership_class,
        application.jurisdiction_code,
        application.application_flags,
        application.created_at,
        presentation.challenge.version,
        presentation.challenge.signature_suite,
        presentation.challenge.issued_at,
        presentation.challenge.expires_at,
    ];
    if numeric_fields
        .into_iter()
        .any(|value| value > MAX_SAFE_INTEGER)
        || application.application_kind != 7
        || application.application_version != 1
        || application.application_nonce == 0
        || !matches!(application.membership_class, 1 | 2)
        || application.application_flags != 0
    {
        return Err(ValidationError::Malformed);
    }

    if presentation.challenge.issued_at > now_ms.saturating_add(5_000) {
        return Err(ValidationError::NotYetValid);
    }
    if now_ms > presentation.challenge.expires_at {
        return Err(ValidationError::Expired);
    }
    let lifetime = presentation
        .challenge
        .expires_at
        .checked_sub(presentation.challenge.issued_at)
        .ok_or(ValidationError::Malformed)?;
    if lifetime == 0 || lifetime > 300_000 {
        return Err(ValidationError::LifetimeTooLong);
    }

    let application_bytes = canonical_application_bytes(application, &owner_public_key)?;
    let application_commitment = *blake3::hash(&application_bytes).as_bytes();
    let claimed_commitment = decode_hex::<32>(&presentation.challenge.application_commitment)
        .ok_or(ValidationError::Malformed)?;
    if claimed_commitment != application_commitment {
        return Err(ValidationError::ApplicationCommitmentMismatch);
    }

    let challenge_id = decode_base64url::<16>(&presentation.challenge.challenge_id)
        .ok_or(ValidationError::Malformed)?;
    let nonce =
        decode_base64url::<16>(&presentation.challenge.nonce).ok_or(ValidationError::Malformed)?;
    let signature =
        decode_base64url::<64>(&presentation.signature).ok_or(ValidationError::InvalidSignature)?;

    let mut transcript = Vec::new();
    transcript.extend_from_slice(MEMBERSHIP_CHALLENGE_DOMAIN);
    transcript.extend_from_slice(&presentation.challenge.version.to_le_bytes());
    append_framed(&mut transcript, &challenge_id)?;
    append_framed(&mut transcript, &nonce)?;
    append_framed(&mut transcript, presentation.challenge.origin.as_bytes())?;
    append_framed(&mut transcript, presentation.challenge.audience.as_bytes())?;
    append_framed(&mut transcript, presentation.challenge.operation.as_bytes())?;
    append_framed(&mut transcript, &owner_public_key)?;
    append_framed(&mut transcript, &application_commitment)?;
    transcript.extend_from_slice(&presentation.challenge.signature_suite.to_le_bytes());
    transcript.extend_from_slice(&presentation.challenge.issued_at.to_le_bytes());
    transcript.extend_from_slice(&presentation.challenge.expires_at.to_le_bytes());

    Ok(PreparedMembershipBytes {
        owner_public_key,
        transcript,
        signature,
    })
}

fn canonical_application_bytes(
    application: &MemberApplicationV1,
    owner_public_key: &[u8; 32],
) -> Result<Vec<u8>, ValidationError> {
    let factory_id = decode_hex::<32>(&application.factory_id).ok_or(ValidationError::Malformed)?;
    let program_id = decode_hex::<32>(&application.program_id).ok_or(ValidationError::Malformed)?;
    let official_cell = decode_hex::<32>(&application.applicant_official_dregg_cell_id)
        .ok_or(ValidationError::Malformed)?;
    let mut bytes = Vec::with_capacity(MEMBERSHIP_APPLICATION_DOMAIN.len() + 4 * 32 + 7 * 8);
    bytes.extend_from_slice(MEMBERSHIP_APPLICATION_DOMAIN);
    bytes.extend_from_slice(&factory_id);
    bytes.extend_from_slice(&program_id);
    bytes.extend_from_slice(&official_cell);
    bytes.extend_from_slice(owner_public_key);
    for value in [
        application.application_kind,
        application.application_version,
        application.application_nonce,
        application.membership_class,
        application.jurisdiction_code,
        application.application_flags,
        application.created_at,
    ] {
        bytes.extend_from_slice(&value.to_le_bytes());
    }
    Ok(bytes)
}

fn append_framed(output: &mut Vec<u8>, value: &[u8]) -> Result<(), ValidationError> {
    let length = u32::try_from(value.len()).map_err(|_| ValidationError::Malformed)?;
    output.extend_from_slice(&length.to_le_bytes());
    output.extend_from_slice(value);
    Ok(())
}

fn decode_hex<const N: usize>(encoded: &str) -> Option<[u8; N]> {
    if encoded.len() != N * 2 {
        return None;
    }
    let mut output = [0_u8; N];
    let (pairs, remainder) = encoded.as_bytes().as_chunks::<2>();
    debug_assert!(remainder.is_empty());
    for (slot, pair) in output.iter_mut().zip(pairs) {
        *slot = (hex_nibble(pair[0])? << 4) | hex_nibble(pair[1])?;
    }
    Some(output)
}

fn hex_nibble(byte: u8) -> Option<u8> {
    match byte {
        b'0'..=b'9' => Some(byte - b'0'),
        b'a'..=b'f' => Some(byte - b'a' + 10),
        _ => None,
    }
}

fn hex_encode(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut encoded = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        encoded.push(HEX[(byte >> 4) as usize] as char);
        encoded.push(HEX[(byte & 0x0f) as usize] as char);
    }
    encoded
}

fn decode_base64url<const N: usize>(encoded: &str) -> Option<[u8; N]> {
    if encoded.contains('=') {
        return None;
    }
    let expected_length = (N * 8).div_ceil(6);
    if encoded.len() != expected_length {
        return None;
    }
    let mut output = [0_u8; N];
    let mut accumulator = 0_u32;
    let mut bits = 0_u8;
    let mut at = 0_usize;
    for byte in encoded.bytes() {
        let value = match byte {
            b'A'..=b'Z' => byte - b'A',
            b'a'..=b'z' => byte - b'a' + 26,
            b'0'..=b'9' => byte - b'0' + 52,
            b'-' => 62,
            b'_' => 63,
            _ => return None,
        };
        accumulator = (accumulator << 6) | u32::from(value);
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            if at >= N {
                return None;
            }
            output[at] = (accumulator >> bits) as u8;
            at += 1;
            accumulator &= (1_u32 << bits).saturating_sub(1);
        }
    }
    if at != N || accumulator != 0 {
        return None;
    }
    Some(output)
}
