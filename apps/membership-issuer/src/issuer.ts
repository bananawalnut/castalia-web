import {
  ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA,
  ZENITH_MEMBERSHIP_ISSUER_ID,
  ZENITH_MEMBERSHIP_VERSION,
  base64urlFromBytes,
  bytesFromBase64url64,
  bytesFromHex32,
  deriveZenithMembershipId,
  parseZenithMembershipRequest,
  zenithMembershipCredentialTranscript,
  zenithMembershipJoinTranscript,
} from "@castalia/membership-contract";
import type {
  ZenithMembershipCredentialV3,
  ZenithMembershipIssuanceRequestV3,
} from "@castalia/membership-contract";
import {
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";

const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const BASE64URL = /^[A-Za-z0-9_-]+$/u;
const KEY_ID = /^[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/u;

export type ZenithMembershipIssuer = {
  readonly issuerId: typeof ZENITH_MEMBERSHIP_ISSUER_ID;
  readonly issuerKeyId: string;
  readonly issuerPublicKey: string;
  issue(input: unknown): Promise<ZenithMembershipCredentialV3>;
};

function privateKeyFromBase64url(value: string): KeyObject {
  if (!BASE64URL.test(value))
    throw new Error("issuer private key must be unpadded base64url PKCS#8");
  const key = createPrivateKey({
    key: Buffer.from(value, "base64url"),
    format: "der",
    type: "pkcs8",
  });
  if (key.asymmetricKeyType !== "ed25519")
    throw new Error("issuer private key must be Ed25519 PKCS#8");
  return key;
}

function rawPublicKey(privateKey: KeyObject): Uint8Array {
  const spki = createPublicKey(privateKey).export({ format: "der", type: "spki" });
  if (
    spki.length !== ED25519_SPKI_PREFIX.length + 32 ||
    !spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
  )
    throw new Error("issuer key did not derive canonical Ed25519 SPKI");
  return new Uint8Array(spki.subarray(ED25519_SPKI_PREFIX.length));
}

function memberPublicKey(ownerPublicKey: string): KeyObject {
  return createPublicKey({
    key: Buffer.concat([
      ED25519_SPKI_PREFIX,
      Buffer.from(bytesFromHex32(ownerPublicKey, "Member Key")),
    ]),
    format: "der",
    type: "spki",
  });
}

export function createZenithMembershipIssuer(config: {
  issuerKeyId: string;
  privateKeyPkcs8Base64url: string;
}): ZenithMembershipIssuer {
  if (!KEY_ID.test(config.issuerKeyId))
    throw new Error("issuer key ID is not canonical");
  const privateKey = privateKeyFromBase64url(config.privateKeyPkcs8Base64url);
  const publicKey = rawPublicKey(privateKey);
  const issuerPublicKey = Buffer.from(publicKey).toString("hex");

  return {
    issuerId: ZENITH_MEMBERSHIP_ISSUER_ID,
    issuerKeyId: config.issuerKeyId,
    issuerPublicKey,
    async issue(input: unknown) {
      const request: ZenithMembershipIssuanceRequestV3 =
        parseZenithMembershipRequest(input);
      const memberSignature = bytesFromBase64url64(
        request.signature,
        "membership request signature",
      );
      if (
        !verify(
          null,
          zenithMembershipJoinTranscript(request.ownerPublicKey),
          memberPublicKey(request.ownerPublicKey),
          memberSignature,
        )
      )
        throw new Error("membership request signature is invalid");

      const payload: Omit<ZenithMembershipCredentialV3, "issuerSignature"> = {
        schema: ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA,
        version: ZENITH_MEMBERSHIP_VERSION,
        membershipId: await deriveZenithMembershipId(request.ownerPublicKey),
        ownerPublicKey: request.ownerPublicKey,
        status: "active",
        issuerId: ZENITH_MEMBERSHIP_ISSUER_ID,
        issuerKeyId: config.issuerKeyId,
        signatureSuite: "Ed25519",
      };
      return {
        ...payload,
        issuerSignature: base64urlFromBytes(
          sign(null, zenithMembershipCredentialTranscript(payload), privateKey),
        ),
      };
    },
  };
}
