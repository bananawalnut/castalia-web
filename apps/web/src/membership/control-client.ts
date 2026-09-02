import {
  parseIssuedCastaliaMembership,
  parseMembershipChallengeResponse,
  type IssuedCastaliaMembership,
  type MembershipChallengeResponseV2,
  type MembershipPresentationV2,
} from "./contracts.js";

export type MembershipControlClient = {
  issueChallenge(input: {
    ownerPublicKey: string;
    origin: string;
    nowMs: number;
  }): Promise<MembershipChallengeResponseV2>;
  issueMembership(input: {
    challenge: MembershipChallengeResponseV2;
    presentation: MembershipPresentationV2;
  }): Promise<IssuedCastaliaMembership>;
};

export class MembershipControlError extends Error {
  constructor(
    readonly kind:
      | "service-unavailable"
      | "challenge-rejected"
      | "invalid-response"
      | "membership-rejected",
  ) {
    super(kind);
  }
}

function endpoint(baseUrl: string, path: string): string {
  return new URL(path, `${baseUrl}/`).toString();
}

async function responseText(response: Response): Promise<string> {
  const type = response.headers.get("content-type")?.split(";", 1)[0];
  if (type !== "application/json")
    throw new MembershipControlError("invalid-response");
  return response.text();
}

export function createMembershipControlClient(options: {
  baseUrl: string;
  audience: string;
  fetch?: typeof fetch;
}): MembershipControlClient {
  const fetchRequest = options.fetch ?? globalThis.fetch;
  return {
    async issueChallenge(input) {
      let response: Response;
      try {
        response = await fetchRequest(
          endpoint(options.baseUrl, "/v1/membership/challenges"),
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ownerPublicKey: input.ownerPublicKey }),
            credentials: "omit",
            cache: "no-store",
            redirect: "error",
          },
        );
      } catch {
        throw new MembershipControlError("service-unavailable");
      }
      if (response.status !== 201)
        throw new MembershipControlError("challenge-rejected");
      try {
        return parseMembershipChallengeResponse(await responseText(response), {
          origin: input.origin,
          audience: options.audience,
          ownerPublicKey: input.ownerPublicKey,
          nowMs: input.nowMs,
        });
      } catch (error) {
        if (error instanceof MembershipControlError) throw error;
        throw new MembershipControlError("invalid-response");
      }
    },

    async issueMembership(input) {
      let response: Response;
      try {
        response = await fetchRequest(
          endpoint(options.baseUrl, "/v1/memberships"),
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              challengeId: input.challenge.challengeId,
              application: input.challenge.application,
              presentation: input.presentation,
            }),
            credentials: "omit",
            cache: "no-store",
            redirect: "error",
          },
        );
      } catch {
        throw new MembershipControlError("service-unavailable");
      }
      if (response.status !== 201)
        throw new MembershipControlError("membership-rejected");
      try {
        const membership = parseIssuedCastaliaMembership(
          await responseText(response),
        );
        if (
          membership.ownerPublicKey !==
          input.challenge.application.ownerPublicKey
        )
          throw new MembershipControlError("invalid-response");
        return membership;
      } catch (error) {
        if (error instanceof MembershipControlError) throw error;
        throw new MembershipControlError("invalid-response");
      }
    },
  };
}
