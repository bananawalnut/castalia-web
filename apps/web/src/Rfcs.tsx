import { Link, useParams } from "react-router";
import {
  PROBLEM_FIXTURES,
  PROPOSAL_FIXTURES,
  RFC_FIXTURES,
} from "./rfcFixtures.js";
import "./rfcs.css";

type BoardEntry = {
  id: string;
  revision: string;
  title: string;
  status: string;
  summary: string;
};

const boardLinks = [
  { to: "/problems", label: "Problem Board" },
  { to: "/rfcs", label: "RFC Board" },
  { to: "/proposals", label: "Proposal Board" },
] as const;

function BoardNavigation() {
  return (
    <nav className="artifact-board__nav" aria-label="Artifact boards">
      {boardLinks.map((item) => (
        <Link key={item.to} to={item.to}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function Boundary() {
  return (
    <p className="artifact-board__boundary">
      Fixture only. Checked-in examples; no publication, repository lookup,
      assignment, notification, or upstream request occurs.
    </p>
  );
}

function Board({
  title,
  description,
  entries,
  route,
  note,
}: {
  title: string;
  description: string;
  entries: readonly BoardEntry[];
  route: string;
  note?: string;
}) {
  return (
    <article className="artifact-board">
      <header className="artifact-board__header">
        <p className="artifact-board__eyebrow">Castalia Boards</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <Boundary />
      </header>
      <BoardNavigation />
      <ol className="artifact-board__list" aria-label={`${title} entries`}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              className="artifact-board__entry"
              to={`/${route}/${entry.id.toLowerCase()}`}
            >
              <span className="artifact-board__mark" aria-hidden="true">
                ╱░▒▓█
              </span>
              <span className="artifact-board__identity">
                <span>{entry.id}</span>
                <span>{entry.status}</span>
              </span>
              <strong>{entry.title}</strong>
              <span className="artifact-board__summary">{entry.summary}</span>
              <span className="artifact-board__open">Open viewer →</span>
            </Link>
          </li>
        ))}
      </ol>
      {note ? <p className="artifact-board__note">{note}</p> : null}
    </article>
  );
}

function Viewer({
  kind,
  entry,
  backTo,
  metadata,
  children,
}: {
  kind: string;
  entry: BoardEntry | undefined;
  backTo: string;
  metadata: readonly (readonly [string, string])[];
  children?: React.ReactNode;
}) {
  if (!entry) {
    return (
      <article className="artifact-viewer">
        <p className="artifact-board__eyebrow">Fixture lookup</p>
        <h1>{kind} not found</h1>
        <p>
          No checked-in fixture matches this identifier. No remote lookup
          occurred.
        </p>
        <Link to={backTo}>Back to {kind} Board</Link>
      </article>
    );
  }

  return (
    <article className="artifact-viewer">
      <BoardNavigation />
      <header>
        <div className="artifact-viewer__identity">
          <span>{entry.id}</span>
          <span>{entry.status}</span>
        </div>
        <h1>{entry.title}</h1>
        <p>{entry.summary}</p>
      </header>
      <Boundary />
      <dl className="artifact-viewer__metadata">
        <div>
          <dt>Exact revision</dt>
          <dd>{entry.revision}</dd>
        </div>
        {metadata.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {children}
      <footer>
        <Link to={backTo}>← Back to {kind} Board</Link>
      </footer>
    </article>
  );
}

export function Rfcs() {
  return (
    <Board
      title="RFC Board"
      description="RFC submissions, ordered by immutable fixture identifier. Open one to inspect its exact revision."
      entries={RFC_FIXTURES}
      route="rfcs"
    />
  );
}

export function RfcViewer() {
  const { rfcId } = useParams();
  const entry = RFC_FIXTURES.find(
    (item) => item.id.toLowerCase() === rfcId?.toLowerCase(),
  );
  return (
    <Viewer
      kind="RFC"
      entry={entry}
      backTo="/rfcs"
      metadata={
        entry
          ? [
              ["Author reference", entry.author],
              ["Claim coverage", entry.coverage],
              ["Known limitation", entry.limitation],
            ]
          : []
      }
    />
  );
}

export function Problems() {
  return (
    <Board
      title="Problem Board"
      description="Problems only. Disposition is Open or Closed and is never inferred from activity."
      entries={PROBLEM_FIXTURES}
      route="problems"
      note="Closed does not mean solved. A solved assessment requires its own accepted decision and exact criteria."
    />
  );
}

export function ProblemViewer() {
  const { problemId } = useParams();
  const entry = PROBLEM_FIXTURES.find(
    (item) => item.id.toLowerCase() === problemId?.toLowerCase(),
  );
  return (
    <Viewer
      kind="Problem"
      entry={entry}
      backTo="/problems"
      metadata={entry ? [["Assessment", entry.assessment]] : []}
    >
      {entry ? (
        <section
          className="artifact-viewer__criteria"
          aria-labelledby="criteria-heading"
        >
          <h2 id="criteria-heading">Criteria</h2>
          <ol>
            {entry.criteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ol>
          {entry.status === "Closed" ? (
            <p>Closed does not mean solved.</p>
          ) : null}
        </section>
      ) : null}
    </Viewer>
  );
}

export function Proposals() {
  return (
    <Board
      title="Proposal Board"
      description="A plain gallery of proposals. No types, categories, or ranking are applied."
      entries={PROPOSAL_FIXTURES}
      route="proposals"
    />
  );
}

export function ProposalViewer() {
  const { proposalId } = useParams();
  const entry = PROPOSAL_FIXTURES.find(
    (item) => item.id.toLowerCase() === proposalId?.toLowerCase(),
  );
  return (
    <Viewer
      kind="Proposal"
      entry={entry}
      backTo="/proposals"
      metadata={entry ? [["Author reference", entry.author]] : []}
    />
  );
}
