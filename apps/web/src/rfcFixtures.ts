export const RFC_FIXTURES = [
  {
    id: "RFC-0017",
    revision: "rev-rfc-0017-c",
    title: "Proof-carrying bounded search reports",
    author: "agent:cedar-07",
    kind: "Specification",
    status: "In review",
    assessment: "Unreviewed",
    coverage: "Partial · CRIT-1",
    summary:
      "Report the exact input, logic profile, explored envelope, limits, stop reason, and reproducible semantic output.",
    limitation: "Describes only the declared search envelope.",
  },
  {
    id: "RFC-0024",
    revision: "rev-rfc-0024-b",
    title: "Counterexample-first falsification harness",
    author: "person:mira",
    kind: "Experiment",
    status: "In review",
    assessment: "Contested",
    coverage: "Partial · CRIT-2",
    summary:
      "Prioritize criterion-bound counterexamples and preserve negative results before attempting repair enumeration.",
    limitation: "May miss useful constructive repairs.",
  },
] as const;

export const PROBLEM_FIXTURES = [
  {
    id: "PRB-0001",
    revision: "rev-problem-0001-a",
    title: "Search hardness in proof-system repair",
    status: "Open",
    assessment: "Unassessed",
    summary:
      "How can bounded repair search expose tractability limits without claiming that sampled search proves global hardness?",
    criteria: [
      "Reproduce a declared benchmark envelope with exact solver, profile, ceilings, and stop reason.",
      "Produce a conforming counterexample under the same declared envelope.",
    ],
  },
  {
    id: "PRB-0002",
    revision: "rev-problem-0002-a",
    title: "Portable review of admission receipts",
    status: "Closed",
    assessment: "Unassessed",
    summary:
      "How should an admission receipt remain inspectable without granting the viewer operational authority?",
    criteria: [
      "Expose receipt provenance without exposing credentials or raw capabilities.",
      "Keep closed disposition separate from any claim that the problem was solved.",
    ],
  },
] as const;

export const RFC_PROPOSAL_FIXTURES = [
  {
    id: "RFC-0031",
    revision: "rev-rfc-0031-a",
    title: "Portable admission receipt viewer",
    author: "person:ada",
    kind: "Proposal",
    status: "Draft",
    assessment: "Unreviewed",
    coverage: "Partial · PRB-0002",
    summary:
      "A read-only viewer for inspecting the provenance and scope of synthetic admission receipts.",
    limitation:
      "Does not define admission authority or grant the viewer operational capability.",
  },
  {
    id: "RFC-0032",
    revision: "rev-rfc-0032-b",
    title: "Repository-backed RFC index",
    author: "agent:cedar-07",
    kind: "Proposal",
    status: "Open for review",
    assessment: "Unreviewed",
    coverage: "Not linked to problem criteria",
    summary:
      "A generated index that links exact RFC revisions without assigning rank or recommendation.",
    limitation:
      "Defines a checked-in index shape but no publication or repository-write authority.",
  },
] as const;

export const ALL_RFC_FIXTURES = [
  ...RFC_FIXTURES,
  ...RFC_PROPOSAL_FIXTURES,
] as const;
