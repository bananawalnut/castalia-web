#!/usr/bin/env node
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
} from "node:crypto";
import {
  ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA,
  ZENITH_MEMBERSHIP_CREDENTIAL_DOMAIN,
  ZENITH_MEMBERSHIP_ID_DOMAIN,
  ZENITH_MEMBERSHIP_JOIN_DOMAIN,
  ZENITH_MEMBERSHIP_PROTOCOL,
  ZENITH_MEMBERSHIP_REQUEST_SCHEMA,
  ZENITH_MEMBERSHIP_VERSION,
  base64urlFromBytes,
  deriveZenithMembershipId,
  hexFromBytes,
  zenithMembershipCredentialTranscript,
  zenithMembershipJoinTranscript,
} from "../packages/membership-contract/src/index.ts";

const PKCS8_PREFIX = "302e020100300506032b657004220420";
const OWNER_SEED =
  "4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb";
const ISSUER_SEED =
  "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60";
const issuerKeyId = "zenith-membership-issuer-fixture-ed25519-1";

function privateKey(seed) {
  return createPrivateKey({
    key: Buffer.from(`${PKCS8_PREFIX}${seed}`, "hex"),
    format: "der",
    type: "pkcs8",
  });
}

function publicKey(seed) {
  const spki = createPublicKey(privateKey(seed)).export({
    format: "der",
    type: "spki",
  });
  return spki.subarray(12).toString("hex");
}

const ownerPublicKey = publicKey(OWNER_SEED);
const issuerPublicKey = publicKey(ISSUER_SEED);
const joinTranscript = zenithMembershipJoinTranscript(ownerPublicKey);
const request = {
  schema: ZENITH_MEMBERSHIP_REQUEST_SCHEMA,
  version: ZENITH_MEMBERSHIP_VERSION,
  ownerPublicKey,
  signatureSuite: "Ed25519",
  signature: base64urlFromBytes(
    sign(null, joinTranscript, privateKey(OWNER_SEED)),
  ),
};
const payload = {
  schema: ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA,
  version: ZENITH_MEMBERSHIP_VERSION,
  membershipId: await deriveZenithMembershipId(ownerPublicKey),
  ownerPublicKey,
  status: "active",
  issuerId: "zenith-research",
  issuerKeyId,
  signatureSuite: "Ed25519",
};
const credentialTranscript = zenithMembershipCredentialTranscript(payload);
const credential = {
  ...payload,
  issuerSignature: base64urlFromBytes(
    sign(null, credentialTranscript, privateKey(ISSUER_SEED)),
  ),
};
const vector = {
  schema: "castalia.zenith-membership.v3.vector",
  protocol: ZENITH_MEMBERSHIP_PROTOCOL,
  hashSuite: "SHA-256",
  signatureSuite: "Ed25519",
  domains: {
    join: ZENITH_MEMBERSHIP_JOIN_DOMAIN,
    membershipId: ZENITH_MEMBERSHIP_ID_DOMAIN,
    credential: ZENITH_MEMBERSHIP_CREDENTIAL_DOMAIN,
  },
  ownerPublicKey,
  issuerPublicKey,
  issuerKeyId,
  request,
  membershipId: payload.membershipId,
  credential,
  transcripts: {
    joinHex: hexFromBytes(joinTranscript),
    credentialHex: hexFromBytes(credentialTranscript),
  },
};
const json = `${JSON.stringify(vector, null, 2)}\n`;
process.stdout.write(json);
process.stderr.write(
  `${createHash("sha256").update(json).digest("hex")}  castalia-zenith-membership-v3.vector.json\n`,
);
