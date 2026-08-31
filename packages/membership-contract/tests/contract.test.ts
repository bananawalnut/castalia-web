import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA,
  ZENITH_MEMBERSHIP_VERSION,
  deriveZenithMembershipId,
  hexFromBytes,
  parseZenithMembershipCredential,
  verifyZenithMembershipCredential,
  zenithMembershipCredentialTranscript,
  zenithMembershipJoinTranscript,
  type ZenithMembershipCredentialV3,
  type ZenithMembershipTrustPolicyV1,
} from "../src/index.js";

const OWNER =
  "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c";
const ISSUER =
  "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";
const SIGNATURE = "A".repeat(86);

function credential(overrides: Partial<ZenithMembershipCredentialV3> = {}) {
  return {
    schema: ZENITH_MEMBERSHIP_CREDENTIAL_SCHEMA,
    version: ZENITH_MEMBERSHIP_VERSION,
    membershipId: "11".repeat(32),
    ownerPublicKey: OWNER,
    status: "active",
    issuerId: "zenith-research",
    issuerKeyId: "zenith-membership-issuer-fixture-ed25519-1",
    signatureSuite: "Ed25519",
    issuerSignature: SIGNATURE,
    ...overrides,
  } satisfies ZenithMembershipCredentialV3;
}

const policy = {
  schema: "castalia.zenith-membership-trust-policy.v1",
  version: 1,
  roots: [
    {
      issuerId: "zenith-research",
      keyId: "zenith-membership-issuer-fixture-ed25519-1",
      signatureSuite: "Ed25519",
      publicKey: ISSUER,
    },
  ],
} satisfies ZenithMembershipTrustPolicyV1;

describe("Zenith membership v3 contract", () => {
  it("pins and independently verifies the canonical producer vector", async () => {
    const vectorPath = join(
      import.meta.dirname,
      "../../../docs/vectors/castalia-zenith-membership-v3.vector.json",
    );
    const checksumPath = `${vectorPath.slice(0, -5)}.sha256`;
    const bytes = await readFile(vectorPath);
    const checksum = (await readFile(checksumPath, "utf8")).split(/\s+/u)[0];
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(checksum);
    const vector = JSON.parse(bytes.toString("utf8")) as {
      ownerPublicKey: string;
      issuerPublicKey: string;
      issuerKeyId: string;
      membershipId: string;
      credential: ZenithMembershipCredentialV3;
      transcripts: { joinHex: string; credentialHex: string };
    };
    expect(await deriveZenithMembershipId(vector.ownerPublicKey)).toBe(
      vector.membershipId,
    );
    expect(
      hexFromBytes(zenithMembershipJoinTranscript(vector.ownerPublicKey)),
    ).toBe(vector.transcripts.joinHex);
    const { issuerSignature: _signature, ...payload } = vector.credential;
    expect(hexFromBytes(zenithMembershipCredentialTranscript(payload))).toBe(
      vector.transcripts.credentialHex,
    );
    await expect(
      verifyZenithMembershipCredential(vector.credential, {
        schema: "castalia.zenith-membership-trust-policy.v1",
        version: 1,
        roots: [
          {
            issuerId: "zenith-research",
            keyId: vector.issuerKeyId,
            signatureSuite: "Ed25519",
            publicKey: vector.issuerPublicKey,
          },
        ],
      }),
    ).resolves.toEqual(vector.credential);
  });

  it("derives one stable issuer-independent membership ID per Member Key", async () => {
    expect(await deriveZenithMembershipId(OWNER)).toMatch(/^[0-9a-f]{64}$/u);
    expect(await deriveZenithMembershipId(OWNER)).toBe(
      await deriveZenithMembershipId(OWNER),
    );
  });

  it("rejects unknown fields before cryptographic verification", () => {
    expect(() =>
      parseZenithMembershipCredential({ ...credential(), invented: true }),
    ).toThrow("fields are not canonical v3");
  });

  it("rejects an untrusted issuer before accepting membership", async () => {
    const value = credential({
      membershipId: await deriveZenithMembershipId(OWNER),
      issuerKeyId: "unknown-issuer-key",
    });
    await expect(
      verifyZenithMembershipCredential(value, policy),
    ).rejects.toThrow("issuer is not trusted");
  });

  it("rejects a credential bound to the wrong expected Member Key", async () => {
    const value = credential({
      membershipId: await deriveZenithMembershipId(OWNER),
    });
    await expect(
      verifyZenithMembershipCredential(value, policy, "44".repeat(32)),
    ).rejects.toThrow("owner does not match");
  });
});
