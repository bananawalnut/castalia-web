import { describe, expect, it, vi } from "vitest";
import { createMembershipControlClient } from "../src/membership/control-client.js";
import type {
  CastaliaMemberApplicationV1,
  MembershipEnrollmentChallengeV2,
} from "../src/membership/contracts.js";

const OWNER = "52".repeat(32);
const COMMITMENT = "ab".repeat(32);
const APPLICATION = {
  factoryId: "11".repeat(32),
  programId: "22".repeat(32),
  applicantOfficialDreggCellId: "33".repeat(32),
  ownerPublicKey: OWNER,
  applicationKind: 7,
  applicationVersion: 1,
  applicationNonce: 7,
  membershipClass: 1,
  jurisdictionCode: 0,
  applicationFlags: 0,
  createdAt: 1,
} satisfies CastaliaMemberApplicationV1;
const CHALLENGE = {
  version: 2,
  challengeId: "AAECAwQFBgcICQoLDA0ODw",
  nonce: "EBESExQVFhcYGRobHB0eHw",
  origin: "https://castalia.example",
  audience: "castalia-control-local",
  operation: "castalia.membership.enroll",
  ownerPublicKey: OWNER,
  applicationCommitment: COMMITMENT,
  signatureSuite: 1,
  issuedAt: 1_000,
  expiresAt: 61_000,
} satisfies MembershipEnrollmentChallengeV2;

function jsonResponse(status: number, value: unknown) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Castalia Control membership client", () => {
  it("requests the exact v2 challenge and submits the verified presentation", async () => {
    const fetchRequest = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(201, {
          challengeId: CHALLENGE.challengeId,
          application: APPLICATION,
          applicationCommitment: COMMITMENT,
          challenge: CHALLENGE,
          expiresAt: CHALLENGE.expiresAt,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(201, {
          cellId: "44".repeat(32),
          ownerPublicKey: OWNER,
          state: "active",
          generation: 1,
          changedAt: 2_000,
          lastReceiptHash: "55".repeat(32),
        }),
      );
    const client = createMembershipControlClient({
      baseUrl: "https://control.castalia.example",
      audience: "castalia-control-local",
      fetch: fetchRequest,
    });

    const challenge = await client.issueChallenge({
      ownerPublicKey: OWNER,
      origin: "https://castalia.example",
      nowMs: 2_000,
    });
    expect(challenge.challenge).toEqual(CHALLENGE);
    expect(fetchRequest.mock.calls[0]?.[0]).toBe(
      "https://control.castalia.example/v1/membership/challenges",
    );
    expect(fetchRequest.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      body: JSON.stringify({ ownerPublicKey: OWNER }),
    });

    const presentation = {
      schema: "castalia.wallet-membership-presentation.v2" as const,
      ownerPublicKey: OWNER,
      challenge: CHALLENGE,
      signatureSuite: "Ed25519" as const,
      signature: "signature-placeholder",
    };
    await expect(
      client.issueMembership({ challenge, presentation }),
    ).resolves.toEqual({
      cellId: "44".repeat(32),
      ownerPublicKey: OWNER,
      state: "active",
      generation: 1,
      changedAt: 2_000,
      lastReceiptHash: "55".repeat(32),
    });
    expect(fetchRequest.mock.calls[1]?.[0]).toBe(
      "https://control.castalia.example/v1/memberships",
    );
    const issuanceBody = fetchRequest.mock.calls[1]?.[1]?.body;
    expect(typeof issuanceBody).toBe("string");
    if (typeof issuanceBody !== "string")
      throw new Error("missing membership issuance request body");
    expect(JSON.parse(issuanceBody)).toEqual({
      challengeId: CHALLENGE.challengeId,
      application: APPLICATION,
      presentation,
    });
  });

  it("rejects a response that rebinds the challenged owner", async () => {
    const fetchRequest = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(201, {
        challengeId: CHALLENGE.challengeId,
        application: { ...APPLICATION, ownerPublicKey: "53".repeat(32) },
        applicationCommitment: COMMITMENT,
        challenge: CHALLENGE,
        expiresAt: CHALLENGE.expiresAt,
      }),
    );
    const client = createMembershipControlClient({
      baseUrl: "https://control.castalia.example",
      audience: "castalia-control-local",
      fetch: fetchRequest,
    });
    await expect(
      client.issueChallenge({
        ownerPublicKey: OWNER,
        origin: "https://castalia.example",
        nowMs: 2_000,
      }),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });
});
