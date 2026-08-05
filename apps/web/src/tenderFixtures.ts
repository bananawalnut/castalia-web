export const TENDER_FIXTURES = [
  {
    id: "TND-0001",
    revision: "rev-tender-0001-a",
    title: "Implement content-addressed RFC manifests",
    issuer: "fixture:castalia",
    status: "Open for bids",
    summary:
      "A bounded implementation contract for generating immutable RFC manifests with exact revision, digest, media type, and viewer metadata.",
    bidDeadline: "Not scheduled in fixture",
    compensation: "Not specified in fixture",
    bidVisibility: "Not specified in fixture",
    awardStatus: "No accepted award decision recorded",
    contractStatus: "No contract recorded",
    deliverables: [
      "Define and validate one deterministic manifest shape for checked-in RFC fixtures.",
      "Generate an RFC index from exact manifest identifiers without ranking or recommendation.",
    ],
    acceptanceCriteria: [
      "The same source revision produces the same manifest digest.",
      "Unknown, malformed, or mismatched manifests fail closed without publication.",
    ],
  },
  {
    id: "TND-0002",
    revision: "rev-tender-0002-a",
    title: "Produce a portable RFC review packet",
    issuer: "fixture:castalia",
    status: "Draft",
    summary:
      "A proposed contract for packaging one exact RFC revision, references, comment context, provenance, and checksums for local review.",
    bidDeadline: "Not scheduled in fixture",
    compensation: "Not specified in fixture",
    bidVisibility: "Not specified in fixture",
    awardStatus: "No accepted award decision recorded",
    contractStatus: "No contract recorded",
    deliverables: [
      "Specify a read-only review packet bound to one exact RFC revision and digest.",
      "Provide deterministic local validation with no credential or publication path.",
    ],
    acceptanceCriteria: [
      "Every included artifact is digest-addressed and traceable to the packet manifest.",
      "Opening or validating a packet performs no remote request or state mutation.",
    ],
  },
] as const;

export type TenderFixture = (typeof TENDER_FIXTURES)[number];
