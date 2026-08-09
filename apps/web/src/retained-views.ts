import { elementFromHtml, type View } from "./dom.js";

const navigationDestinations = [
  [
    "Start",
    "/start",
    "Wallet detection and extension-owned membership request start flow.",
  ],
  [
    "Chronicle",
    "/chronicle",
    "Primary navigation placeholder; page intentionally unimplemented.",
  ],
  [
    "Tenders",
    "/tenders",
    "Implemented fixture catalog and read-only exact viewers; bid submission, awards, and contracts remain unavailable.",
  ],
  [
    "RFC",
    "/rfcs",
    "Implemented fixture catalog and read-only exact viewers; no publication action or repository lookup.",
  ],
  [
    "Merch",
    "/merch",
    "Primary navigation placeholder; page intentionally unimplemented.",
  ],
  ["Docs", "/docs", "Implemented reference page."],
] as const;

function view(markup: string): View {
  return { element: elementFromHtml(markup) };
}

export function docsView(): View {
  const rows = navigationDestinations
    .map(
      ([name, route, status]) =>
        `<span role="row"><strong role="cell">${name}</strong><code role="cell">${route}</code><span role="cell">${status}</span></span>`,
    )
    .join("");

  return view(
    `<article class="docs-hub"><header class="docs-hub__header"><p class="docs-hub__eyebrow">Castalia reference</p><h1>Documentation</h1><p>Landing, Tenders, RFCs, and Docs are implemented fixture surfaces.</p></header><section id="surfaces" class="docs-hub__section" aria-labelledby="surfaces-heading"><div class="docs-hub__section-heading"><h2 id="surfaces-heading">Navigation map</h2><span>${String(navigationDestinations.length)} destinations</span></div><div class="docs-hub__table" role="table" aria-label="Navigation destinations"><div class="docs-hub__table-head" role="row"><span role="columnheader">Label</span><span role="columnheader">Route</span><span role="columnheader">Status</span></div>${rows}</div></section><section id="boundaries" class="docs-hub__section" aria-labelledby="boundaries-heading"><div class="docs-hub__section-heading"><h2 id="boundaries-heading">Current boundary</h2></div><ul class="docs-hub__boundaries"><li>Chronicle, Merch, and Start remain navigation placeholders only; the standalone Proposals route is removed.</li><li>Proposal documents use RFC identifiers, revisions, viewers, and a Proposal kind in the RFC catalog.</li><li>Tenders are read-only contract opportunities. A bid is an offer; no bid submission, award decision, contract, payment, or remote operation is connected.</li><li>The RFC and Tender registries read checked-in fixtures only; publication and comment submission remain unavailable.</li><li>Unknown, removed, and placeholder routes use the retained not-found surface.</li></ul></section></article>`,
  );
}

export function notFoundView(): View {
  return view(
    '<article class="retained-not-found"><h1>Page not found</h1><p>This navigation destination has not been implemented yet.</p><nav aria-label="Not found actions"><a href="/">Back to Castalia</a><a href="/docs">Documentation</a></nav></article>',
  );
}
