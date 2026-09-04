import type { ZenithMembershipTrustPolicyV1 } from "@castalia/membership-contract";

export const ZENITH_MEMBERSHIP_TRUST_POLICY = {
  schema: "castalia.zenith-membership-trust-policy.v1",
  version: 1,
  roots: [
    {
      issuerId: "zenith-research",
      keyId: __CASTALIA_ZENITH_ISSUER_KEY_ID__,
      signatureSuite: "Ed25519",
      publicKey: __CASTALIA_ZENITH_ISSUER_PUBLIC_KEY__,
    },
  ],
} satisfies ZenithMembershipTrustPolicyV1;
