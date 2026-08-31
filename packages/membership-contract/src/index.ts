export const ZENITH_MEMBERSHIP_PROTOCOL =
  "castalia.zenith-membership.v3" as const;
export const ZENITH_MEMBERSHIP_REQUEST_SCHEMA =
  "castalia.zenith-membership-issuance-request.v3" as const;
export const ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA =
  "castalia.zenith-membership-credential.v3" as const;
export const ZENITH_MEMBERSHIP_VERSION = 3 as const;
export const ZENITH_MEMBERSHIP_ISSUER_ID = "zenith-research" as const;
export const ZENITH_MEMBERSHIP_ENDPOINT_PATH = "/v3/memberships" as const;
export const ZENITH_MEMBERSHIP_JOIN_DOMAIN =
  "castalia/zenith-membership-join/v3\0" as const;
export const ZENITH_MEMBERSHIP_ID_DOMAIN =
  "castalia/zenith-membership-id/v3\0" as const;
export const ZENITH_MEMBERSHIP_CREDENTIAL_DOMAIN =
  "castalia/zenith-membership-credential/v3\0" as const;

const HEX_32 = /^[0-9a-f]{64}$/u;
const BASE64URL_64 = /^[A-Za-z0-9_-]{86}$/u;
const IDENTIFIER = /^[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/u;
const textEncoder = new TextEncoder();

export type ZenithMembershipIssuanceRequestV3 = {
  schema: typeof ZENITH_MEMBERSHIP_REQUEST_SCHEMA;
  version: typeof ZENITH_MEMBERSHIP_VERSION;
  ownerPublicKey: string;
  signatureSuite: "Ed25519";
  signature: string;
};

export type ZenithMembershipCredentialV3 = {
  schema: typeof ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA;
  version: typeof ZENITH_MEMBERSHIP_VERSION;
  membershipId: string;
  ownerPublicKey: string;
  status: "active";
  issuerId: string;
  issuerKeyId: string;
  signatureSuite: "Ed25519";
  issuerSignature: string;
};

export type ZenithMembershipTrustRootV1 = {
  issuerId: string;
  keyId: string;
  signatureSuite: "Ed25519";
  publicKey: string;
};

export type ZenithMembershipTrustPolicyV1 = {
  schema: "castalia.zenith-membership-trust-policy.v1";
  version: 1;
  roots: readonly ZenithMembershipTrustRootV1[];
};

function exactKeys(value: object, expected: readonly string[]): boolean {
  return Object.keys(value).sort().join(",") === [...expected].sort().join(",");
}

export function bytesFromHex32(value: unknown, label: string): Uint8Array {
  if (typeof value !== "string" || !HEX_32.test(value))
    throw new Error(`${label} must be 32-byte lowercase hex`);
  return Uint8Array.from(
    value.match(/../gu) ?? [],
    (pair) => Number.parseInt(pair, 16),
  );
}

export function hexFromBytes(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function bytesFromBase64url64(
  value: unknown,
  label: string,
): Uint8Array {
  if (typeof value !== "string" || !BASE64URL_64.test(value))
    throw new Error(`${label} must be a 64-byte unpadded base64url value`);
  const binary = atob(`${value.replace(/-/gu, "+").replace(/_/gu, "/")}==`);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (bytes.length !== 64)
    throw new Error(`${label} must be a 64-byte unpadded base64url value`);
  return bytes;
}

export function base64urlFromBytes(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(/=+$/u, "");
}

function concatBytes(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(
    parts.reduce((length, part) => length + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function u64le(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, value, true);
  return bytes;
}

function framedUtf8(value: string, label: string): Uint8Array {
  if (!IDENTIFIER.test(value)) throw new Error(`${label} is not canonical`);
  const encoded = textEncoder.encode(value);
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, encoded.length, true);
  return concatBytes(length, encoded);
}

export function zenithMembershipJoinTranscript(
  ownerPublicKey: string,
): Uint8Array {
  return concatBytes(
    textEncoder.encode(ZENITH_MEMBERSHIP_JOIN_DOMAIN),
    bytesFromHex32(ownerPublicKey, "Member Key"),
  );
}

export async function deriveZenithMembershipId(
  ownerPublicKey: string,
): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    concatBytes(
      textEncoder.encode(ZENITH_MEMBERSHIP_ID_DOMAIN),
      bytesFromHex32(ownerPublicKey, "Member Key"),
    ),
  );
  return hexFromBytes(new Uint8Array(digest));
}

export function parseZenithMembershipRequest(
  input: unknown,
): ZenithMembershipIssuanceRequestV3 {
  if (typeof input !== "object" || input === null || Array.isArray(input))
    throw new Error("membership request must be an object");
  if (
    !exactKeys(input, [
      "ownerPublicKey",
      "schema",
      "signature",
      "signatureSuite",
      "version",
    ])
  )
    throw new Error("membership request fields are not canonical v3");
  const value = input as Partial<ZenithMembershipIssuanceRequestV3>;
  if (
    value.schema !== ZENITH_MEMBERSHIP_REQUEST_SCHEMA ||
    value.version !== ZENITH_MEMBERSHIP_VERSION ||
    value.signatureSuite !== "Ed25519"
  )
    throw new Error("membership request protocol is not canonical v3");
  bytesFromHex32(value.ownerPublicKey, "Member Key");
  bytesFromBase64url64(value.signature, "membership request signature");
  return structuredClone(value as ZenithMembershipIssuanceRequestV3);
}

export function parseZenithMembershipCredential(
  input: unknown,
): ZenithMembershipCredentialV3 {
  if (typeof input !== "object" || input === null || Array.isArray(input))
    throw new Error("membership credential must be an object");
  if (
    !exactKeys(input, [
      "issuerId",
      "issuerKeyId",
      "issuerSignature",
      "membershipId",
      "ownerPublicKey",
      "schema",
      "signatureSuite",
      "status",
      "version",
    ])
  )
    throw new Error("membership credential fields are not canonical v3");
  const value = input as Partial<ZenithMembershipCredentialV3>;
  if (
    value.schema !== ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA ||
    value.version !== ZENITH_MEMBERSHIP_VERSION ||
    value.status !== "active" ||
    value.signatureSuite !== "Ed25519"
  )
    throw new Error("membership credential protocol is not canonical v3");
  bytesFromHex32(value.membershipId, "membership ID");
  bytesFromHex32(value.ownerPublicKey, "Member Key");
  framedUtf8(value.issuerId ?? "", "membership issuer ID");
  framedUtf8(value.issuerKeyId ?? "", "membership issuer key ID");
  bytesFromBase64url64(
    value.issuerSignature,
    "membership issuer signature",
  );
  return structuredClone(value as ZenithMembershipCredentialV3);
}

export function zenithMembershipCredentialTranscript(
  input: Omit<ZenithMembershipCredentialV3, "issuerSignature">,
): Uint8Array {
  bytesFromHex32(input.membershipId, "membership ID");
  bytesFromHex32(input.ownerPublicKey, "Member Key");
  if (
    input.schema !== ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA ||
    input.version !== ZENITH_MEMBERSHIP_VERSION ||
    input.status !== "active" ||
    input.signatureSuite !== "Ed25519"
  )
    throw new Error("membership credential payload is not canonical v3");
  return concatBytes(
    textEncoder.encode(ZENITH_MEMBERSHIP_CREDENTIAL_DOMAIN),
    u64le(BigInt(input.version)),
    bytesFromHex32(input.membershipId, "membership ID"),
    bytesFromHex32(input.ownerPublicKey, "Member Key"),
    framedUtf8(input.status, "membership status"),
    framedUtf8(input.issuerId, "membership issuer ID"),
    framedUtf8(input.issuerKeyId, "membership issuer key ID"),
    framedUtf8(input.signatureSuite.toLowerCase(), "signature suite"),
  );
}

export function validateZenithTrustPolicy(
  policy: ZenithMembershipTrustPolicyV1,
): void {
  if (
    policy.schema !== "castalia.zenith-membership-trust-policy.v1" ||
    policy.version !== 1 ||
    !Array.isArray(policy.roots) ||
    policy.roots.length === 0
  )
    throw new Error("Zenith membership trust policy is not canonical v1");
  const identities = new Set<string>();
  for (const root of policy.roots) {
    if (
      root.signatureSuite !== "Ed25519" ||
      !IDENTIFIER.test(root.issuerId) ||
      !IDENTIFIER.test(root.keyId)
    )
      throw new Error("Zenith membership trust root is not canonical");
    bytesFromHex32(root.publicKey, "issuer public key");
    const identity = `${root.issuerId}\0${root.keyId}`;
    if (identities.has(identity))
      throw new Error("Zenith membership trust policy contains a duplicate root");
    identities.add(identity);
  }
}

export async function verifyZenithMembershipCredential(
  input: unknown,
  policy: ZenithMembershipTrustPolicyV1,
  expectedOwnerPublicKey?: string,
): Promise<ZenithMembershipCredentialV3> {
  validateZenithTrustPolicy(policy);
  const credential = parseZenithMembershipCredential(input);
  if (
    expectedOwnerPublicKey !== undefined &&
    credential.ownerPublicKey !== expectedOwnerPublicKey
  )
    throw new Error("membership credential owner does not match this Member Key");
  if (
    credential.membershipId !==
    (await deriveZenithMembershipId(credential.ownerPublicKey))
  )
    throw new Error("membership credential ID is not deterministic for its owner");
  const root = policy.roots.find(
    (candidate) =>
      candidate.issuerId === credential.issuerId &&
      candidate.keyId === credential.issuerKeyId &&
      candidate.signatureSuite === credential.signatureSuite,
  );
  if (!root) throw new Error("membership credential issuer is not trusted");
  const publicKey = await globalThis.crypto.subtle.importKey(
    "raw",
    bytesFromHex32(root.publicKey, "issuer public key"),
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  const { issuerSignature: _signature, ...payload } = credential;
  const valid = await globalThis.crypto.subtle.verify(
    { name: "Ed25519" },
    publicKey,
    bytesFromBase64url64(
      credential.issuerSignature,
      "membership issuer signature",
    ),
    zenithMembershipCredentialTranscript(payload),
  );
  if (!valid) throw new Error("membership credential signature is invalid");
  return credential;
}
