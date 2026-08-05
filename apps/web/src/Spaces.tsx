import { Link, useParams } from "react-router";
import "./spaces.css";

const SPACE_FIXTURES = [
  {
    id: "zenith",
    name: "Zenith",
    status: "Fixture",
    description:
      "A checked-in example space for shared rooms, discussion, and collective activity.",
    rooms: [
      {
        slug: "zenith",
        name: "The Commons",
        description: "The fixture group-chat room for the Zenith space.",
      },
    ],
  },
] as const;

function SpaceBoundary() {
  return (
    <p className="space-directory__boundary">
      Fixture only. No live directory, membership, creation, join, notification,
      or Matrix operation is connected.
    </p>
  );
}

function SpaceActions({ spaceId }: { spaceId?: string }) {
  return (
    <nav className="space-directory__actions" aria-label="Space actions">
      <Link to="/spaces/new">╱░▒▓█[ create a new space ]█▓▒░╲</Link>
      {spaceId ? (
        <Link to={`/spaces/${spaceId}/rooms/new`}>
          ╱░▒▓█[ create a room ]█▓▒░╲
        </Link>
      ) : null}
    </nav>
  );
}

export function Spaces() {
  return (
    <article className="space-directory">
      <header className="space-directory__hero">
        <p className="space-directory__eyebrow">Castalia</p>
        <h1>Spaces</h1>
        <p>
          Spaces hold rooms and shared activity. Browse a space, enter one of
          its rooms, or start a new space when creation becomes available.
        </p>
        <SpaceActions />
        <SpaceBoundary />
      </header>

      <section aria-labelledby="space-list-heading">
        <div className="space-directory__section-heading">
          <h2 id="space-list-heading">Available spaces</h2>
          <span>{SPACE_FIXTURES.length} fixture space</span>
        </div>
        <ul className="space-directory__list">
          {SPACE_FIXTURES.map((space) => (
            <li key={space.id}>
              <Link to={`/spaces/${space.id}`}>
                <span className="space-directory__glyph" aria-hidden="true">
                  ╱░▒▓█
                </span>
                <span>
                  <small>
                    {space.status} · {space.rooms.length} room
                  </small>
                  <strong>{space.name}</strong>
                  <span>{space.description}</span>
                </span>
                <span className="space-directory__open">Open space →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

export function SpaceViewer() {
  const { spaceId } = useParams();
  const space = SPACE_FIXTURES.find(
    (candidate) => candidate.id === spaceId?.toLowerCase(),
  );

  if (!space) {
    return (
      <article className="space-directory space-directory--viewer">
        <p className="space-directory__eyebrow">Fixture lookup</p>
        <h1>Space not found</h1>
        <p>
          No checked-in fixture matches this space. No remote lookup occurred.
        </p>
        <Link to="/spaces">← Back to Spaces</Link>
      </article>
    );
  }

  return (
    <article className="space-directory space-directory--viewer">
      <header className="space-directory__hero">
        <p className="space-directory__eyebrow">Space · {space.status}</p>
        <h1>{space.name}</h1>
        <p>{space.description}</p>
        <SpaceActions spaceId={space.id} />
        <SpaceBoundary />
      </header>
      <section aria-labelledby="room-list-heading">
        <div className="space-directory__section-heading">
          <h2 id="room-list-heading">Rooms</h2>
          <span>{space.rooms.length} fixture room</span>
        </div>
        <ul className="space-directory__room-list">
          {space.rooms.map((room) => (
            <li key={room.slug}>
              <Link to={`/room/${room.slug}`}>
                <span aria-hidden="true">╱░▒▓█</span>
                <strong>{room.name}</strong>
                <span>{room.description}</span>
                <span>Enter room →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <footer>
        <Link to="/spaces">← Back to Spaces</Link>
      </footer>
    </article>
  );
}

export function NewSpace() {
  return (
    <article className="space-directory space-directory--viewer">
      <p className="space-directory__eyebrow">Space creation</p>
      <h1>Create a new space</h1>
      <p>
        Space creation is unavailable in this fixture. No creation form is
        installed, and no space name, membership, room, or credential input is
        accepted or stored.
      </p>
      <SpaceBoundary />
      <div className="space-directory__back">
        <Link to="/spaces">← Back to Spaces</Link>
      </div>
    </article>
  );
}

export function NewRoom() {
  const { spaceId } = useParams();
  return (
    <article className="space-directory space-directory--viewer">
      <p className="space-directory__eyebrow">Room creation</p>
      <h1>Create a room</h1>
      <p>
        Room creation is unavailable in this fixture for the{" "}
        {spaceId ?? "selected"}
        Space. No room name, membership, credential, or configuration input is
        accepted or stored.
      </p>
      <SpaceBoundary />
      <div className="space-directory__back">
        <Link to={spaceId ? `/spaces/${spaceId}` : "/spaces"}>
          ← Back to the Space
        </Link>
      </div>
    </article>
  );
}

export function CommonsRoom() {
  return (
    <article className="space-directory space-directory--viewer commons-room">
      <header className="space-directory__hero">
        <p className="space-directory__eyebrow">Zenith Space · fixture room</p>
        <h1>The Commons</h1>
        <p>
          The shared fixture room for the Zenith Space. Live messages,
          membership, sign-in, and posting are unavailable.
        </p>
        <SpaceBoundary />
      </header>
      <section
        className="commons-room__status"
        aria-labelledby="room-status-heading"
      >
        <h2 id="room-status-heading">Room unavailable</h2>
        <dl>
          <div>
            <dt>Messages</dt>
            <dd>Unavailable</dd>
          </div>
          <div>
            <dt>Membership</dt>
            <dd>Unavailable</dd>
          </div>
          <div>
            <dt>Connection</dt>
            <dd>Fixture only</dd>
          </div>
        </dl>
      </section>
      <footer>
        <Link to="/spaces/zenith">← Back to Zenith Space</Link>
      </footer>
    </article>
  );
}
