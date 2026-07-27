import { Link } from "react-router";
import { Status } from "@castalia/ui";
import "./rfcArchitectureDocs.css";

const boundaries = [
  {
    name: "Browser",
    owns: "Accessible read views and future local draft, validation, preview, and download flows.",
    excludes:
      "Credentials, publication, repository mutation, notifications, and governance.",
  },
  {
    name: "Community repository",
    owns: "Accepted canonical artifacts, authority evidence, events, decisions, policies, and generated projections.",
    excludes: "Runtime secrets, duplicated backlinks, and WMT verdicts.",
  },
  {
    name: "WMT package",
    owns: "Bounded computation over a confirmed, typed formalization after external Gate 0.",
    excludes:
      "Truth, ranking, natural-language interpretation, review, lifecycle, or decision authority.",
  },
] as const;

const flow = [
  [
    "1",
    "Author",
    "Drafts a public artifact against exact immutable revisions.",
  ],
  [
    "2",
    "Validator",
    "Checks schema, graph, attribution, policy, canonical bytes, and limits.",
  ],
  [
    "3",
    "Preview",
    "Shows the exact dependency-complete diff with Not published disclosure.",
  ],
  [
    "4",
    "Repository",
    "Accepts artifacts and decisions only through its protected external workflow.",
  ],
  [
    "5",
    "Projection",
    "Regenerates lifecycle, assessment, attention, thread, and backlink views.",
  ],
] as const;

const artifacts = [
  "Problem revision",
  "Community RFC revision",
  "ProblemSolutionClaimV1",
  "ExchangeEntryV1",
  "ExchangeRequestEventV1",
  "Review and decision records",
  "Moderation tombstone overlay",
] as const;

export function RfcArchitectureDocs() {
  return (
    <article className="architecture-docs">
      <header className="architecture-docs__hero">
        <div>
          <p className="architecture-docs__eyebrow">Castalia architecture</p>
          <h1>RFC exchange architecture</h1>
          <p className="architecture-docs__lede">
            One repository-backed exchange graph powers a paired Problem Board
            and community RFC view. An RFC may claim to address a problem, but
            that claim cannot mark the problem solved.
          </p>
        </div>
        <Status>Design documentation only</Status>
      </header>

      <aside
        className="architecture-docs__notice"
        aria-label="Current boundary"
      >
        This page renders the approved design. It has no live data, mutation,
        credentials, notifications, or analysis runtime.
      </aside>

      <section aria-labelledby="authority-boundaries">
        <h2 id="authority-boundaries">Authority boundaries</h2>
        <div className="architecture-docs__grid">
          {boundaries.map((boundary) => (
            <article className="architecture-docs__card" key={boundary.name}>
              <h3>{boundary.name}</h3>
              <p>{boundary.owns}</p>
              <p className="architecture-docs__exclusion">
                <strong>Does not own:</strong> {boundary.excludes}
              </p>
            </article>
          ))}
        </div>
        <p>
          WMT output is evidence about the supplied formalization only. It
          cannot accept an RFC, assess a solution, rank candidates, establish
          truth, or exercise governance.
        </p>
      </section>

      <section aria-labelledby="artifact-graph">
        <h2 id="artifact-graph">Canonical artifact graph</h2>
        <p>
          Authored revisions are immutable and stored once. Events and decisions
          are separate authority artifacts. Backlinks, status, and attention
          labels are reproducible projections.
        </p>
        <ul className="architecture-docs__artifact-list">
          {artifacts.map((artifact) => (
            <li key={artifact}>{artifact}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="review-flow">
        <h2 id="review-flow">Local-to-repository review flow</h2>
        <ol className="architecture-docs__flow">
          {flow.map(([step, actor, description]) => (
            <li key={step}>
              <span aria-hidden="true">{step}</span>
              <div>
                <h3>{actor}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="decision-model">
        <h2 id="decision-model">Decision and moderation model</h2>
        <div className="architecture-docs__split">
          <div>
            <h3>Lifecycle</h3>
            <p>
              Only an accepted decision bound to an exact revision, source
              state, authority snapshot, and idempotency key changes disposition
              or assessment. Closing never means solved.
            </p>
          </div>
          <div>
            <h3>Moderation</h3>
            <p>
              A tombstone is a terminal overlay, not a lifecycle disposition. It
              hides unsafe payloads while retaining safe provenance and graph
              identity.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="source-material">
        <h2 id="source-material">Source material</h2>
        <p>
          The complete version-controlled Mermaid diagrams, text alternatives,
          failure semantics, and decision map live in{" "}
          <code>docs/architecture/rfc-exchange.md</code>.
        </p>
        <p>
          <Link to="/docs">Back to documentation</Link>
        </p>
      </section>
    </article>
  );
}
