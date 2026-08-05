import { elementFromHtml, escapeHtml, type View } from "./dom.js";
import { PROBLEM_FIXTURES, RFC_FIXTURES } from "./rfcFixtures.js";

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

const spaceBoundary =
  '<p class="space-directory__boundary">Fixture only. No live directory, membership, creation, join, notification, or Matrix operation is connected.</p>';
const artifactBoundary =
  '<p class="artifact-board__boundary">Fixture only. Checked-in examples; no publication, repository lookup, assignment, notification, or upstream request occurs.</p>';
const boardNavigation =
  '<nav class="artifact-board__nav" aria-label="Artifact boards"><a href="/problems">Problem Board</a><a href="/rfcs">RFC Board</a><a href="/tenders">Tender Board</a></nav>';

function view(markup: string): View {
  return { element: elementFromHtml(markup) };
}

function spaceActions(spaceId?: string) {
  return `<nav class="space-directory__actions" aria-label="Space actions"><a href="/spaces/new">╱░▒▓█[ create a new space ]█▓▒░╲</a>${spaceId ? `<a href="/spaces/${escapeHtml(spaceId)}/rooms/new">╱░▒▓█[ create a room ]█▓▒░╲</a>` : ""}</nav>`;
}

export function spacesView(): View {
  const items = SPACE_FIXTURES.map(
    (space) =>
      `<li><a href="/spaces/${space.id}"><span class="space-directory__glyph" aria-hidden="true">╱░▒▓█</span><span><small>${space.status} · ${String(space.rooms.length)} room</small><strong>${space.name}</strong><span>${space.description}</span></span><span class="space-directory__open">Open space →</span></a></li>`,
  ).join("");
  return view(
    `<article class="space-directory"><header class="space-directory__hero"><p class="space-directory__eyebrow">Castalia</p><h1>Spaces</h1><p>Spaces hold rooms and shared activity. Browse a space, enter one of its rooms, or start a new space when creation becomes available.</p>${spaceActions()}${spaceBoundary}</header><section aria-labelledby="space-list-heading"><div class="space-directory__section-heading"><h2 id="space-list-heading">Available spaces</h2><span>${String(SPACE_FIXTURES.length)} fixture space</span></div><ul class="space-directory__list">${items}</ul></section></article>`,
  );
}

export function spaceView(spaceId: string): View {
  const normalized = spaceId.toLowerCase();
  const space = SPACE_FIXTURES.find((candidate) => candidate.id === normalized);
  if (!space) {
    return view(
      `<article class="space-directory space-directory--viewer"><p class="space-directory__eyebrow">Fixture lookup</p><h1>Space not found</h1><p>No checked-in fixture matches this space. No remote lookup occurred.</p><a href="/spaces">← Back to Spaces</a></article>`,
    );
  }
  const rooms = space.rooms
    .map(
      (room) =>
        `<li><a href="/room/${room.slug}"><span aria-hidden="true">╱░▒▓█</span><strong>${room.name}</strong><span>${room.description}</span><span>Enter room →</span></a></li>`,
    )
    .join("");
  return view(
    `<article class="space-directory space-directory--viewer"><header class="space-directory__hero"><p class="space-directory__eyebrow">Space · ${space.status}</p><h1>${space.name}</h1><p>${space.description}</p>${spaceActions(space.id)}${spaceBoundary}</header><section aria-labelledby="room-list-heading"><div class="space-directory__section-heading"><h2 id="room-list-heading">Rooms</h2><span>${String(space.rooms.length)} fixture room</span></div><ul class="space-directory__room-list">${rooms}</ul></section><footer><a href="/spaces">← Back to Spaces</a></footer></article>`,
  );
}

export function newSpaceView(): View {
  return view(
    `<article class="space-directory space-directory--viewer"><p class="space-directory__eyebrow">Space creation</p><h1>Create a new space</h1><p>Space creation is unavailable in this fixture. No creation form is installed, and no space name, membership, room, or credential input is accepted or stored.</p>${spaceBoundary}<div class="space-directory__back"><a href="/spaces">← Back to Spaces</a></div></article>`,
  );
}

export function newRoomView(spaceId: string): View {
  const safeId = escapeHtml(spaceId || "selected");
  const back = spaceId ? `/spaces/${escapeHtml(spaceId)}` : "/spaces";
  return view(
    `<article class="space-directory space-directory--viewer"><p class="space-directory__eyebrow">Room creation</p><h1>Create a room</h1><p>Room creation is unavailable in this fixture for the ${safeId} Space. No room name, membership, credential, or configuration input is accepted or stored.</p>${spaceBoundary}<div class="space-directory__back"><a href="${back}">← Back to the Space</a></div></article>`,
  );
}

export function commonsRoomView(): View {
  return view(
    `<article class="space-directory space-directory--viewer commons-room"><header class="space-directory__hero"><p class="space-directory__eyebrow">Zenith Space · fixture room</p><h1>The Commons</h1><p>The shared fixture room for the Zenith Space. Live messages, membership, sign-in, and posting are unavailable.</p>${spaceBoundary}</header><section class="commons-room__status" aria-labelledby="room-status-heading"><h2 id="room-status-heading">Room unavailable</h2><dl><div><dt>Messages</dt><dd>Unavailable</dd></div><div><dt>Membership</dt><dd>Unavailable</dd></div><div><dt>Connection</dt><dd>Fixture only</dd></div></dl></section><footer><a href="/spaces/zenith">← Back to Zenith Space</a></footer></article>`,
  );
}

type BoardEntry = {
  id: string;
  revision: string;
  title: string;
  status: string;
  summary: string;
};

function boardView(
  title: string,
  description: string,
  entries: readonly BoardEntry[],
  route: string,
  note = "",
): View {
  const items = entries
    .map(
      (entry) =>
        `<li><a class="artifact-board__entry" href="/${route}/${entry.id.toLowerCase()}"><span class="artifact-board__mark" aria-hidden="true">╱░▒▓█</span><span class="artifact-board__identity"><span>${escapeHtml(entry.id)}</span><span>${escapeHtml(entry.status)}</span></span><strong>${escapeHtml(entry.title)}</strong><span class="artifact-board__summary">${escapeHtml(entry.summary)}</span><span class="artifact-board__open">Open viewer →</span></a></li>`,
    )
    .join("");
  return view(
    `<article class="artifact-board"><header class="artifact-board__header"><p class="artifact-board__eyebrow">Castalia Boards</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${artifactBoundary}</header>${boardNavigation}<ol class="artifact-board__list" aria-label="${escapeHtml(title)} entries">${items}</ol>${note ? `<p class="artifact-board__note">${escapeHtml(note)}</p>` : ""}</article>`,
  );
}

export const rfcsView = () =>
  boardView(
    "RFC Board",
    "RFC submissions, ordered by immutable fixture identifier. Open one to inspect its exact revision.",
    RFC_FIXTURES,
    "rfcs",
  );
export const problemsView = () =>
  boardView(
    "Problem Board",
    "Problems only. Disposition is Open or Closed and is never inferred from activity.",
    PROBLEM_FIXTURES,
    "problems",
    "Closed does not mean solved. A solved assessment requires its own accepted decision and exact criteria.",
  );
function viewerNotFound(kind: string, backTo: string): View {
  return view(
    `<article class="artifact-viewer"><p class="artifact-board__eyebrow">Fixture lookup</p><h1>${kind} not found</h1><p>No checked-in fixture matches this identifier. No remote lookup occurred.</p><a href="${backTo}">Back to ${kind} Board</a></article>`,
  );
}

function viewerView(
  kind: string,
  entry: BoardEntry,
  backTo: string,
  metadata: readonly (readonly [string, string])[],
  detail = "",
): View {
  const rows = metadata
    .map(
      ([label, value]) =>
        `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("");
  return view(
    `<article class="artifact-viewer">${boardNavigation}<header><div class="artifact-viewer__identity"><span>${escapeHtml(entry.id)}</span><span>${escapeHtml(entry.status)}</span></div><h1>${escapeHtml(entry.title)}</h1><p>${escapeHtml(entry.summary)}</p></header>${artifactBoundary}<dl class="artifact-viewer__metadata"><div><dt>Exact revision</dt><dd>${escapeHtml(entry.revision)}</dd></div>${rows}</dl>${detail}<footer><a href="${backTo}">← Back to ${kind} Board</a></footer></article>`,
  );
}

export function rfcViewerView(id: string): View {
  const entry = RFC_FIXTURES.find(
    (item) => item.id.toLowerCase() === id.toLowerCase(),
  );
  return entry
    ? viewerView("RFC", entry, "/rfcs", [
        ["Author reference", entry.author],
        ["Claim coverage", entry.coverage],
        ["Known limitation", entry.limitation],
      ])
    : viewerNotFound("RFC", "/rfcs");
}

export function problemViewerView(id: string): View {
  const entry = PROBLEM_FIXTURES.find(
    (item) => item.id.toLowerCase() === id.toLowerCase(),
  );
  if (!entry) return viewerNotFound("Problem", "/problems");
  const criteria = `<section class="artifact-viewer__criteria" aria-labelledby="criteria-heading"><h2 id="criteria-heading">Criteria</h2><ol>${entry.criteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("")}</ol>${entry.status === "Closed" ? "<p>Closed does not mean solved.</p>" : ""}</section>`;
  return viewerView(
    "Problem",
    entry,
    "/problems",
    [["Assessment", entry.assessment]],
    criteria,
  );
}

const surfaces = [
  [
    "Start",
    "/start",
    "Landing call to action; destination intentionally unimplemented.",
  ],
  [
    "Chronicle",
    "/chronicle",
    "Primary navigation placeholder; page intentionally unimplemented.",
  ],
  [
    "Tenders",
    "/tenders",
    "Implemented read-only tender fixtures; bidding, awards, and contracts remain unavailable.",
  ],
  [
    "RFC",
    "/rfcs",
    "Primary navigation placeholder; page intentionally unimplemented.",
  ],
  [
    "Merch",
    "/merch",
    "Primary navigation placeholder; page intentionally unimplemented.",
  ],
  ["Docs", "/docs", "The only implemented secondary page."],
] as const;

export function docsView(): View {
  const surfaceRows = surfaces
    .map(
      ([name, route, purpose]) =>
        `<a href="${route}" role="row"><strong role="cell">${name}</strong><code role="cell">${route}</code><span role="cell">${purpose}</span></a>`,
    )
    .join("");
  return view(
    `<article class="docs-hub"><header class="docs-hub__header"><p class="docs-hub__eyebrow">Castalia reference</p><h1>Documentation</h1><p>A compact map of the current fixture surfaces, their intended roles, and the boundaries they do not cross.</p></header><nav class="docs-hub__jump" aria-label="Documentation sections"><a href="#story">Story</a><a href="#surfaces">Surfaces</a><a href="#model">Product model</a><a href="#boundaries">Boundaries</a></nav><section id="story" class="docs-hub__section docs-hub__story" aria-labelledby="story-heading"><div class="docs-hub__section-heading"><h2 id="story-heading">Story</h2></div><p>Castalia is imagined as an open spring for independent worlds: Spaces gather rooms and shared activity, while RFCs remain a separate public record for submissions that need exact review.</p></section><section id="surfaces" class="docs-hub__section" aria-labelledby="surfaces-heading"><div class="docs-hub__section-heading"><h2 id="surfaces-heading">Current surfaces</h2><span>${String(surfaces.length)} routes</span></div><div class="docs-hub__table" role="table" aria-label="Current surfaces"><div class="docs-hub__table-head" role="row"><span role="columnheader">Surface</span><span role="columnheader">Route</span><span role="columnheader">Purpose</span></div>${surfaceRows}</div></section><section id="model" class="docs-hub__section" aria-labelledby="model-heading"><div class="docs-hub__section-heading"><h2 id="model-heading">Product model</h2></div><dl class="docs-hub__definitions"><div><dt>Spaces</dt><dd>Community-like containers for rooms and shared activity. Spaces are not an umbrella for RFCs, problems, or proposals.</dd></div><div><dt>RFCs</dt><dd>Independent submissions listed on the RFC Board and opened in exact revision viewers. An RFC is not a Space.</dd></div><div><dt>Problems</dt><dd>Standalone problem records with Open or Closed disposition. Closed does not mean solved.</dd></div><div><dt>Proposals</dt><dd>A plain proposal gallery without type taxonomy, score, or ranking.</dd></div><div><dt>Rooms</dt><dd>Conversation surfaces contained by Spaces. The Commons is the current fixture room inside Zenith.</dd></div></dl></section><section id="boundaries" class="docs-hub__section" aria-labelledby="boundaries-heading"><div class="docs-hub__section-heading"><h2 id="boundaries-heading">Fixture boundaries</h2></div><ul class="docs-hub__boundaries"><li>No live directory, room membership, messages, sign-in, or posting.</li><li>No submission, publication, assignment, notification, or ranking.</li><li>No repository lookup, Matrix operation, credential use, or persistence.</li><li>Create-space and create-room paths accept and store no input.</li></ul></section></article>`,
  );
}

export function notFoundView(): View {
  return view(
    '<article class="retained-not-found"><h1>Page not found</h1><p>The requested page is not one of the retained Castalia surfaces.</p><nav aria-label="Not found actions"><a href="/">Back to Castalia</a><a href="/docs">Documentation</a></nav></article>',
  );
}
