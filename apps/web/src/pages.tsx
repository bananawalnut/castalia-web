import { Link, useParams } from "react-router";
import {
  Badge,
  Card,
  SectionLabel,
  StatusBadge,
  type ButtonSize,
  type ButtonVariant,
} from "@castalia/ui";

// Fixture rooms data
const rooms = [
  {
    slug: "zenith",
    name: "Zenith",
    description:
      "Fixture shell for the Zenith group chat. Live room metadata is unavailable.",
  },
];

function ActionLink({
  to,
  children,
  variant = "secondary",
  size = "md",
}: {
  to: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <Link
      className={`zn-button zn-button--${variant} zn-button--${size}`}
      to={to}
    >
      {children}
    </Link>
  );
}

export function Rooms() {
  return (
    <div className="bitmap-scene bitmap-landing">
      <img
        className="bitmap-figure bitmap-angel"
        src="/bitmap/angel.png"
        alt=""
        aria-hidden="true"
      />
      <img
        className="bitmap-figure bitmap-merlin"
        src="/bitmap/merlin.png"
        alt=""
        aria-hidden="true"
      />

      <header className="bitmap-title">
        <h1>Castalia</h1>
      </header>
    </div>
  );
}

export function Room() {
  const { slug } = useParams();
  const room = rooms.find((r) => r.slug === slug);

  if (!room) {
    return (
      <>
        <header className="page-header">
          <h1>Room not found</h1>
          <p>No fixture matches this room. No Matrix lookup occurred.</p>
        </header>
        <div className="actions">
          <ActionLink to="/">Back to rooms</ActionLink>
          <ActionLink to="/docs" variant="ghost">
            Read documentation
          </ActionLink>
        </div>
      </>
    );
  }

  return (
    <div className="room-detail">
      <header className="room-header">
        <div>
          <SectionLabel variant="eyebrow">Group chat</SectionLabel>
          <h1>{room.name}</h1>
        </div>
        <StatusBadge label="Fixture" meta="no connection" tone="warning" />
      </header>

      <Card variant="elevated">
        <p
          style={{
            color: "var(--color-base-content)",
            marginBottom: "var(--space-4)",
          }}
        >
          {room.description}
        </p>
        <div
          style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}
        >
          <Badge variant="default">Members unavailable</Badge>
          <Badge variant="accent">{slug}</Badge>
        </div>
      </Card>

      <section aria-labelledby="unavailable-heading">
        <h2 id="unavailable-heading" className="sr-only">
          Room content unavailable
        </h2>
        <div className="unavailable-notice">
          <h2>Messages unavailable</h2>
          <p>
            This is a fixture preview. The live Synapse room adapter is not
            installed. Messages, membership, sign-in, and posting are
            unavailable.
          </p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <ActionLink to="/">Back to rooms</ActionLink>
            <ActionLink to="/docs" variant="ghost">
              Read documentation
            </ActionLink>
          </div>
        </div>
      </section>
    </div>
  );
}

export function Create() {
  return (
    <>
      <header className="page-header">
        <SectionLabel variant="eyebrow">Create</SectionLabel>
        <h1>Create a room</h1>
        <p>
          Room creation requires a live Matrix connection. This preview shows
          the fixture shell only.
        </p>
      </header>

      <Card variant="default" style={{ maxWidth: "480px" }}>
        <StatusBadge
          label="Unavailable"
          meta="no live connection"
          tone="error"
        />
        <p
          style={{
            color: "var(--color-base-muted)",
            marginTop: "var(--space-4)",
          }}
        >
          Castalia does not accept or store room-creation input in fixture mode.
        </p>
      </Card>
    </>
  );
}

export function Request() {
  const { requestId } = useParams();
  const isExample = requestId === "example-request";

  return (
    <>
      <header className="page-header">
        <SectionLabel variant="eyebrow">Request</SectionLabel>
        <h1>Room request</h1>
      </header>

      {isExample ? (
        <Card variant="default">
          <h2
            style={{
              marginBottom: "var(--space-3)",
              fontSize: "var(--text-lg)",
            }}
          >
            Example request
          </h2>
          <StatusBadge label="Fixture" meta="not submitted" tone="warning" />
          <p
            style={{
              color: "var(--color-base-muted)",
              marginTop: "var(--space-4)",
            }}
          >
            This is a fixture preview. No registry lookup or submission
            occurred.
          </p>
        </Card>
      ) : (
        <>
          <h2>Request not found</h2>
          <p style={{ color: "var(--color-base-muted)" }}>
            No registry lookup occurred.
          </p>
          <div className="actions" style={{ marginTop: "var(--space-4)" }}>
            <ActionLink to="/">Back to rooms</ActionLink>
          </div>
        </>
      )}
    </>
  );
}

export function Docs() {
  return (
    <>
      <header className="page-header">
        <SectionLabel variant="eyebrow">Documentation</SectionLabel>
        <h1>Documentation</h1>
        <p>Reference materials for the Castalia fixture preview.</p>
      </header>

      <div className="docs-grid">
        <Card variant="interactive" className="docs-card">
          <h3>API Reference</h3>
          <p>
            Contract schemas and fixture endpoints. No live API is available.
          </p>
          <div style={{ marginTop: "var(--space-3)" }}>
            <ActionLink to="/docs/api" size="sm">
              View API docs
            </ActionLink>
          </div>
        </Card>

        <Card variant="interactive" className="docs-card">
          <h3>Specifications</h3>
          <p>Data models and contract specifications for rooms and members.</p>
          <div style={{ marginTop: "var(--space-3)" }}>
            <ActionLink to="/docs/specs" size="sm">
              View specs
            </ActionLink>
          </div>
        </Card>

        <Card variant="interactive" className="docs-card">
          <h3>RFC exchange architecture</h3>
          <p>
            Authority boundaries, canonical artifacts, lifecycle flows, and the
            subjective personal / RFC bucket evidence boundary.
          </p>
          <div style={{ marginTop: "var(--space-3)" }}>
            <ActionLink to="/docs/architecture/rfc-exchange" size="sm">
              View architecture
            </ActionLink>
          </div>
        </Card>

        <Card variant="interactive" className="docs-card">
          <h3>Problem Board / RFC exchange</h3>
          <p>
            Fixture-only visual draft for problems, competing RFC claims,
            critique, evidence, and local export preview.
          </p>
          <div style={{ marginTop: "var(--space-3)" }}>
            <ActionLink to="/docs/rfc-exchange/preview" size="sm">
              Review UI draft
            </ActionLink>
          </div>
        </Card>
      </div>
    </>
  );
}

export function ApiDocs() {
  return (
    <>
      <header className="page-header">
        <SectionLabel variant="eyebrow">API</SectionLabel>
        <h1>API reference</h1>
      </header>

      <Card variant="default">
        <h2
          style={{ marginBottom: "var(--space-3)", fontSize: "var(--text-lg)" }}
        >
          Contract source only
        </h2>
        <p style={{ color: "var(--color-base-muted)" }}>
          Local fixture contract documentation; no live API or authentication
          flow.
        </p>
      </Card>
    </>
  );
}

export function Specs() {
  return (
    <>
      <header className="page-header">
        <SectionLabel variant="eyebrow">Specifications</SectionLabel>
        <h1>Contract specifications</h1>
      </header>

      <Card variant="default">
        <h2
          style={{ marginBottom: "var(--space-3)", fontSize: "var(--text-lg)" }}
        >
          Fixture schemas
        </h2>
        <p style={{ color: "var(--color-base-muted)" }}>
          Schemas describe fixtures, not runtime behavior.
        </p>
      </Card>
    </>
  );
}

export function NotFound() {
  return (
    <>
      <header className="page-header">
        <h1>Page not found</h1>
        <p>The requested page does not exist.</p>
      </header>
      <div className="actions">
        <ActionLink to="/">Back to rooms</ActionLink>
        <ActionLink to="/docs" variant="ghost">
          Documentation
        </ActionLink>
      </div>
    </>
  );
}
