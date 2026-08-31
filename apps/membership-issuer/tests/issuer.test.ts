import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ZENITH_MEMBERSHIP_REQUEST_SCHEMA,
  ZENITH_MEMBERSHIP_VERSION,
  base64urlFromBytes,
  verifyZenithMembershipCredential,
  zenithMembershipJoinTranscript,
  type ZenithMembershipTrustPolicyV1,
} from "@castalia/membership-contract";
import { createZenithMembershipIssuer } from "../src/issuer.js";

const PKCS8_PREFIX = "302e020100300506032b657004220420";
const SPKI_PREFIX_BYTES = 12;
const OWNER_SEED = "4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb";
const ISSUER_SEED = "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60";
const ISSUER_KEY_ID = "zenith-membership-issuer-fixture-ed25519-1";

function privateKey(seed: string) {
  return createPrivateKey({
    key: Buffer.from(`${PKCS8_PREFIX}${seed}`, "hex"),
    format: "der",
    type: "pkcs8",
  });
}

function rawPublicHex(seed: string): string {
  const spki = createPublicKey(privateKey(seed)).export({
    format: "der",
    type: "spki",
  });
  return spki.subarray(SPKI_PREFIX_BYTES).toString("hex");
}

function issuanceRequest() {
  const ownerPublicKey = rawPublicHex(OWNER_SEED);
  return {
    schema: ZENITH_MEMBERSHIP_REQUEST_SCHEMA,
    version: ZENITH_MEMBERSHIP_VERSION,
    ownerPublicKey,
    signatureSuite: "Ed25519",
    signature: base64urlFromBytes(
      sign(
        null,
        zenithMembershipJoinTranscript(ownerPublicKey),
        privateKey(OWNER_SEED),
      ),
    ),
  } as const;
}

function issuer() {
  return createZenithMembershipIssuer({
    issuerKeyId: ISSUER_KEY_ID,
    privateKeyPkcs8Base64url: Buffer.from(
      `${PKCS8_PREFIX}${ISSUER_SEED}`,
      "hex",
    ).toString("base64url"),
  });
}

describe("Zenith membership issuer", () => {
  it("verifies Member Key possession and deterministically signs Active membership", async () => {
    const service = issuer();
    const first = await service.issue(issuanceRequest());
    const retry = await service.issue(issuanceRequest());
    expect(retry).toEqual(first);
    const policy = {
      schema: "castalia.zenith-membership-trust-policy.v1",
      version: 1,
      roots: [
        {
          issuerId: service.issuerId,
          keyId: service.issuerKeyId,
          signatureSuite: "Ed25519",
          publicKey: service.issuerPublicKey,
        },
      ],
    } satisfies ZenithMembershipTrustPolicyV1;
    await expect(
      verifyZenithMembershipCredential(
        first,
        policy,
        issuanceRequest().ownerPublicKey,
      ),
    ).resolves.toEqual(first);
  });

  it("rejects a substituted owner and malformed requests", async () => {
    const request = issuanceRequest();
    await expect(
      issuer().issue({ ...request, ownerPublicKey: "44".repeat(32) }),
    ).rejects.toThrow("signature is invalid");
    await expect(issuer().issue({ ...request, invented: true })).rejects.toThrow(
      "fields are not canonical v3",
    );
  });

  it("rejects a non-Ed25519 or malformed issuer secret", () => {
    expect(() =>
      createZenithMembershipIssuer({
        issuerKeyId: ISSUER_KEY_ID,
        privateKeyPkcs8Base64url: "not-a-key",
      }),
    ).toThrow();
  });
});
