import { Link } from "react-router";
import "./docs.css";

const surfaces = [
  {
    name: "Spaces",
    route: "/spaces",
    purpose: "Browse community-like Spaces and the rooms they contain.",
  },
  {
    name: "RFC Board",
    route: "/rfcs",
    purpose: "Browse RFC submissions and open exact fixture revisions.",
  },
  {
    name: "Problem Board",
    route: "/problems",
    purpose: "Browse problems with explicit Open or Closed disposition.",
  },
  {
    name: "Proposal Board",
    route: "/proposals",
    purpose: "Browse an unranked gallery of proposals.",
  },
  {
    name: "The Commons",
    route: "/room/zenith",
    purpose: "Open the fixture room inside the Zenith Space.",
  },
] as const;

export function Docs() {
  return (
    <article className="docs-hub">
      <header className="docs-hub__header">
        <p className="docs-hub__eyebrow">Castalia reference</p>
        <h1>Documentation</h1>
        <p>
          A compact map of the current fixture surfaces, their intended roles,
          and the boundaries they do not cross.
        </p>
      </header>

      <nav className="docs-hub__jump" aria-label="Documentation sections">
        <a href="#story">Story</a>
        <a href="#surfaces">Surfaces</a>
        <a href="#model">Product model</a>
        <a href="#boundaries">Boundaries</a>
      </nav>

      <section
        id="story"
        className="docs-hub__section docs-hub__story"
        aria-labelledby="story-heading"
      >
        <div className="docs-hub__section-heading">
          <h2 id="story-heading">Story</h2>
        </div>
        <p>
          Castalia is imagined as an open spring for independent worlds: Spaces
          gather rooms and shared activity, while RFCs remain a separate public
          record for submissions that need exact review.
        </p>
      </section>

      <section
        id="surfaces"
        className="docs-hub__section"
        aria-labelledby="surfaces-heading"
      >
        <div className="docs-hub__section-heading">
          <h2 id="surfaces-heading">Current surfaces</h2>
          <span>{surfaces.length} routes</span>
        </div>
        <div
          className="docs-hub__table"
          role="table"
          aria-label="Current surfaces"
        >
          <div className="docs-hub__table-head" role="row">
            <span role="columnheader">Surface</span>
            <span role="columnheader">Route</span>
            <span role="columnheader">Purpose</span>
          </div>
          {surfaces.map((surface) => (
            <Link key={surface.route} to={surface.route} role="row">
              <strong role="cell">{surface.name}</strong>
              <code role="cell">{surface.route}</code>
              <span role="cell">{surface.purpose}</span>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="model"
        className="docs-hub__section"
        aria-labelledby="model-heading"
      >
        <div className="docs-hub__section-heading">
          <h2 id="model-heading">Product model</h2>
        </div>
        <dl className="docs-hub__definitions">
          <div>
            <dt>Spaces</dt>
            <dd>
              Community-like containers for rooms and shared activity. Spaces
              are not an umbrella for RFCs, problems, or proposals.
            </dd>
          </div>
          <div>
            <dt>RFCs</dt>
            <dd>
              Independent submissions listed on the RFC Board and opened in
              exact revision viewers. An RFC is not a Space.
            </dd>
          </div>
          <div>
            <dt>Problems</dt>
            <dd>
              Standalone problem records with Open or Closed disposition. Closed
              does not mean solved.
            </dd>
          </div>
          <div>
            <dt>Proposals</dt>
            <dd>
              A plain proposal gallery without type taxonomy, score, or ranking.
            </dd>
          </div>
          <div>
            <dt>Rooms</dt>
            <dd>
              Conversation surfaces contained by Spaces. The Commons is the
              current fixture room inside Zenith.
            </dd>
          </div>
        </dl>
      </section>

      <section
        id="boundaries"
        className="docs-hub__section"
        aria-labelledby="boundaries-heading"
      >
        <div className="docs-hub__section-heading">
          <h2 id="boundaries-heading">Fixture boundaries</h2>
        </div>
        <ul className="docs-hub__boundaries">
          <li>
            No live directory, room membership, messages, sign-in, or posting.
          </li>
          <li>
            No submission, publication, assignment, notification, or ranking.
          </li>
          <li>
            No repository lookup, Matrix operation, credential use, or
            persistence.
          </li>
          <li>Create-space and create-room paths accept and store no input.</li>
        </ul>
      </section>
    </article>
  );
}
