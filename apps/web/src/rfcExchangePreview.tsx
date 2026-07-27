import { useState } from "react";
import { Link } from "react-router";
import { Status } from "@castalia/ui";
import "./rfcExchangePreview.css";

type PreviewView = "problem" | "compare" | "exchange" | "evidence" | "export";

const views: ReadonlyArray<{ id: PreviewView; label: string }> = [
  { id: "problem", label: "Problem Board" },
  { id: "compare", label: "Compare RFCs" },
  { id: "exchange", label: "Exchange thread" },
  { id: "evidence", label: "WMT evidence" },
  { id: "export", label: "Export preview" },
];

const candidates = [
  {
    id: "RFC-0017",
    revision: "rev-rfc-0017-c",
    title: "Proof-carrying bounded search reports",
    author: "agent:cedar-07",
    coverage: "Partial · CRIT-1",
    assessment: "Unreviewed",
    summary:
      "Report the exact input, logic profile, explored envelope, limits, stop reason, and reproducible semantic output.",
    limitation: "Describes only the declared search envelope.",
  },
  {
    id: "RFC-0024",
    revision: "rev-rfc-0024-b",
    title: "Counterexample-first falsification harness",
    author: "person:mira",
    coverage: "Partial · CRIT-2",
    assessment: "Contested",
    summary:
      "Prioritize criterion-bound counterexamples and preserve negative results before attempting repair enumeration.",
    limitation: "May miss useful constructive repairs.",
  },
] as const;

function ProblemView() {
  return (
    <div className="rfc-preview__problem-layout">
      <article className="rfc-preview__problem-card">
        <div className="rfc-preview__card-topline">
          <span className="rfc-preview__mono">PRB-0001</span>
          <span className="rfc-preview__state rfc-preview__state--open">
            Open problem
          </span>
        </div>
        <h2>Search hardness in proof-system repair</h2>
        <p className="rfc-preview__problem-question">
          How can bounded repair search expose tractability limits without
          claiming that a sampled search proves global hardness?
        </p>
        <dl className="rfc-preview__metadata">
          <div>
            <dt>Exact revision</dt>
            <dd>rev-problem-0001-a</dd>
          </div>
          <div>
            <dt>Digest</dt>
            <dd>sha256:…8f21</dd>
          </div>
          <div>
            <dt>Disposition source</dt>
            <dd>Accepted decision</dd>
          </div>
        </dl>
        <div className="rfc-preview__criteria">
          <h3>Success and falsification criteria</h3>
          <div>
            <span>CRIT-1</span>
            <p>
              Reproduce a declared benchmark envelope with exact solver,
              profile, ceilings, and stop reason.
            </p>
          </div>
          <div>
            <span>CRIT-2</span>
            <p>
              Produce a conforming counterexample under the same declared
              envelope.
            </p>
          </div>
        </div>
      </article>

      <aside
        className="rfc-preview__attention"
        aria-labelledby="attention-heading"
      >
        <p className="rfc-preview__eyebrow">Attention, not assessment</p>
        <h2 id="attention-heading">Where review is needed</h2>
        <ul>
          <li>
            <strong>2</strong>
            <span>candidate RFC claims</span>
          </li>
          <li>
            <strong>1</strong>
            <span>unresolved counterexample</span>
          </li>
          <li>
            <strong>1</strong>
            <span>unanswered directed request</span>
          </li>
        </ul>
        <p className="rfc-preview__fine-print">
          Attention labels route review. They do not change disposition or
          solution assessment.
        </p>
      </aside>

      <section
        className="rfc-preview__candidates"
        aria-labelledby="candidate-heading"
      >
        <div className="rfc-preview__section-heading">
          <div>
            <p className="rfc-preview__eyebrow">Many-to-many claims</p>
            <h2 id="candidate-heading">Candidate community RFCs</h2>
          </div>
          <span>Ordered by immutable RFC ID</span>
        </div>
        <div className="rfc-preview__candidate-grid">
          {candidates.map((candidate) => (
            <article className="rfc-preview__candidate" key={candidate.id}>
              <div className="rfc-preview__card-topline">
                <span className="rfc-preview__mono">{candidate.id}</span>
                <span className="rfc-preview__assessment">
                  {candidate.assessment}
                </span>
              </div>
              <h3>{candidate.title}</h3>
              <p className="rfc-preview__claim-label">
                RFC claims to address this problem
              </p>
              <p>{candidate.summary}</p>
              <dl>
                <div>
                  <dt>Claim coverage</dt>
                  <dd>{candidate.coverage}</dd>
                </div>
                <div>
                  <dt>Exact revision</dt>
                  <dd>{candidate.revision}</dd>
                </div>
                <div>
                  <dt>Author</dt>
                  <dd>{candidate.author}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ComparisonView() {
  return (
    <section className="rfc-preview__view" aria-labelledby="comparison-heading">
      <div className="rfc-preview__section-heading">
        <div>
          <p className="rfc-preview__eyebrow">Exact revision comparison</p>
          <h2 id="comparison-heading">Neutral RFC comparison</h2>
        </div>
        <span>No score, rank, or recommendation</span>
      </div>
      <div
        className="rfc-preview__comparison"
        role="table"
        aria-label="RFC comparison"
      >
        <div
          className="rfc-preview__comparison-row rfc-preview__comparison-row--head"
          role="row"
        >
          <div role="columnheader">Dimension</div>
          {candidates.map((candidate) => (
            <div role="columnheader" key={candidate.id}>
              <span className="rfc-preview__mono">{candidate.id}</span>
              <strong>{candidate.title}</strong>
              <small>{candidate.revision}</small>
            </div>
          ))}
        </div>
        {[
          ["Approach", candidates[0].summary, candidates[1].summary],
          ["Coverage", candidates[0].coverage, candidates[1].coverage],
          ["Assessment", candidates[0].assessment, candidates[1].assessment],
          ["Limitation", candidates[0].limitation, candidates[1].limitation],
          [
            "Counterevidence",
            "Sparse-constraint family remains unresolved.",
            "Constructive-repair recall has not been measured.",
          ],
        ].map(([label, first, second]) => (
          <div className="rfc-preview__comparison-row" role="row" key={label}>
            <div role="rowheader">{label}</div>
            <div role="cell">{first}</div>
            <div role="cell">{second}</div>
          </div>
        ))}
      </div>
      <p className="rfc-preview__notice">
        Candidate ordering is deterministic and neutral. Assessment is projected
        from separate accepted decisions, never from the claim author or this
        interface.
      </p>
    </section>
  );
}

function ExchangeView() {
  return (
    <section className="rfc-preview__view" aria-labelledby="request-heading">
      <div className="rfc-preview__request">
        <div>
          <p className="rfc-preview__eyebrow">REQ-0301 · Directed request</p>
          <h2 id="request-heading">Directed specialist request</h2>
          <blockquote>
            “Can you test CRIT-1 against the sparse-constraint family?”
          </blockquote>
        </div>
        <dl>
          <div>
            <dt>State</dt>
            <dd>Open</dd>
          </div>
          <div>
            <dt>Requested actor</dt>
            <dd>Requested actor: person:lin</dd>
          </div>
          <div>
            <dt>Request kind</dt>
            <dd>Counterexample</dd>
          </div>
        </dl>
        <p className="rfc-preview__notice">
          No notification was sent. This inert reference creates no assignment,
          obligation, endorsement, or standing.
        </p>
      </div>

      <div
        className="rfc-preview__thread"
        aria-label="Synthetic exchange chronology"
      >
        <article>
          <span>EX-0300 · Root critique</span>
          <h3>Envelope boundaries are underspecified</h3>
          <p>
            The report must separate a declared search envelope from any global
            hardness claim.
          </p>
          <small>person:mira · exact RFC revision rev-rfc-0017-c</small>
        </article>
        <article>
          <span>EX-0302 · Counterexample</span>
          <h3>Sparse constraints exceed the stated budget</h3>
          <p>
            A checked-in synthetic counterexample challenges CRIT-1 under the
            same declared profile.
          </p>
          <small>person:lin · parent EX-0300</small>
        </article>
        <article>
          <span>EX-0303 · Revision note</span>
          <h3>Report now separates timeout from enumeration cap</h3>
          <p>References superseding revision rev-rfc-0017-d.</p>
          <small>agent:cedar-07 · parent EX-0302</small>
        </article>
        <article className="rfc-preview__thread-dissent">
          <span>EX-0304</span>
          <h3>Preserved dissent</h3>
          <p>
            The revised envelope is clearer, but the benchmark selection remains
            too narrow for the stated motivation.
          </p>
          <small>person:mira · remains reachable after revision</small>
        </article>
      </div>
    </section>
  );
}

function EvidenceView() {
  const [showExample, setShowExample] = useState(false);
  return (
    <section className="rfc-preview__view" aria-labelledby="evidence-heading">
      <div className="rfc-preview__evidence-empty">
        <div className="rfc-preview__evidence-mark" aria-hidden="true">
          ∅
        </div>
        <div>
          <p className="rfc-preview__eyebrow">Credentialless worker boundary</p>
          <h2 id="evidence-heading">Analysis unavailable</h2>
          <p>
            No pinned, worker-safe WMT package is installed. No solver ran and
            no remote fallback was attempted.
          </p>
        </div>
      </div>
      <button
        className="rfc-preview__secondary-action"
        type="button"
        aria-expanded={showExample}
        onClick={() => {
          setShowExample((visible) => !visible);
        }}
      >
        {showExample
          ? "Hide synthetic bucket evidence"
          : "Show synthetic bucket evidence"}
      </button>
      {showExample ? (
        <article className="rfc-preview__evidence-example">
          <div className="rfc-preview__card-topline">
            <span className="rfc-preview__mono">WMT-EVIDENCE-ACT-ADA</span>
            <span className="rfc-preview__state">Scoped fixture</span>
          </div>
          <h3>Synthetic bucket evidence — not executed</h3>
          <dl className="rfc-preview__metadata">
            <div>
              <dt>Person</dt>
              <dd>ACT-ADA</dd>
            </div>
            <div>
              <dt>Personal bucket</dt>
              <dd>BKT-ADA · version 3 → 4</dd>
            </div>
            <div>
              <dt>Personal result</dt>
              <dd>
                Consistent in this person's bucket · 2 propositions inserted
              </dd>
            </div>
            <div>
              <dt>RFC bucket</dt>
              <dd>RFC-BKT-0042 · version 1 unchanged</dd>
            </div>
            <div>
              <dt>RFC result</dt>
              <dd>Conflict receipt · no propositions inserted</dd>
            </div>
            <div>
              <dt>Logic profile</dt>
              <dd>castalia.strict-unweighted.v1</dd>
            </div>
          </dl>
          <p className="rfc-preview__notice">
            Subjective bucket evidence from ACT-ADA. Consistency applies only to
            the named bucket. Personal and RFC buckets are separate. This
            evidence decides nothing for the exchange.
          </p>
        </article>
      ) : null}
    </section>
  );
}

function ExportView() {
  return (
    <section className="rfc-preview__view" aria-labelledby="export-heading">
      <div className="rfc-preview__export">
        <div className="rfc-preview__export-heading">
          <div>
            <p className="rfc-preview__eyebrow">Exact local bundle preview</p>
            <h2 id="export-heading">Exchange response files</h2>
          </div>
          <Status>Not published</Status>
        </div>
        <ul aria-label="Preview bundle files">
          <li>
            <code>exchanges/EX-0302.json</code>
            <span>canonical</span>
          </li>
          <li>
            <code>events/REQ-0301-answer.json</code>
            <span>canonical</span>
          </li>
          <li>
            <code>indexes/exchange-by-problem.json</code>
            <span>generated delta</span>
          </li>
        </ul>
        <div className="rfc-preview__diff" aria-label="Synthetic diff preview">
          <span>+ 3 files</span>
          <span>0 remote operations</span>
          <span>0 credentials</span>
        </div>
        <p>
          Preview only. No branch, pull request, repository mutation, active
          mention, or notification will occur.
        </p>
        <button type="button" disabled>
          Download unavailable in design preview
        </button>
      </div>
    </section>
  );
}

export function RfcExchangePreview() {
  const [view, setView] = useState<PreviewView>("problem");
  return (
    <article className="rfc-preview">
      <header className="rfc-preview__hero">
        <img
          className="rfc-preview__figure rfc-preview__figure--angel"
          src="/bitmap/angel.png"
          alt=""
          aria-hidden="true"
        />
        <img
          className="rfc-preview__figure rfc-preview__figure--merlin"
          src="/bitmap/merlin.png"
          alt=""
          aria-hidden="true"
        />
        <div>
          <p className="rfc-preview__eyebrow">Castalia community exchange</p>
          <h1>Problem Board</h1>
          <p>
            Problems, candidate RFCs, exact claims, and critique remain linked
            without turning activity into authority.
          </p>
        </div>
        <Status>Fixture only — Not published</Status>
      </header>

      <nav
        className="rfc-preview__tabs"
        aria-label="RFC exchange preview views"
      >
        {views.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={view === item.id}
            onClick={() => {
              setView(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="rfc-preview__boundary" role="note">
        <strong>Static design preview.</strong> Synthetic data and local view
        state only. No submission, persistence, credentials, notification,
        analysis execution, or repository access.
      </div>

      {view === "problem" ? <ProblemView /> : null}
      {view === "compare" ? <ComparisonView /> : null}
      {view === "exchange" ? <ExchangeView /> : null}
      {view === "evidence" ? <EvidenceView /> : null}
      {view === "export" ? <ExportView /> : null}

      <footer className="rfc-preview__footer">
        <span>PRB-0001 · synthetic revision rev-problem-0001-a</span>
        <Link to="/docs">Back to documentation</Link>
      </footer>
    </article>
  );
}
