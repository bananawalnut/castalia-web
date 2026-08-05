import type { View } from "./dom.js";
import { TENDER_FIXTURES, type TenderFixture } from "./tenderFixtures.js";

function textElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  text: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function boundary(): HTMLParagraphElement {
  return textElement(
    "p",
    "Checked-in tender fixture only. No bid submission, award decision, contract formation, payment, notification, credential, or remote request is connected.",
    "artifact-board__boundary",
  );
}

function metadataRow(label: string, value: string): HTMLDivElement {
  const row = document.createElement("div");
  row.append(textElement("dt", label), textElement("dd", value));
  return row;
}

function listSection(
  headingId: string,
  heading: string,
  entries: readonly string[],
): HTMLElement {
  const section = document.createElement("section");
  section.className = "artifact-viewer__criteria";
  section.setAttribute("aria-labelledby", headingId);
  const title = textElement("h2", heading);
  title.id = headingId;
  const list = document.createElement("ol");
  for (const entry of entries) {
    list.append(textElement("li", entry));
  }
  section.append(title, list);
  return section;
}

export function tenderCatalogView(): View {
  const article = document.createElement("article");
  article.className = "artifact-board tender-catalog";

  const header = document.createElement("header");
  header.className = "artifact-board__header";
  header.append(
    textElement("p", "Castalia procurement", "artifact-board__eyebrow"),
    textElement("h1", "Tenders"),
    textElement(
      "p",
      "Read-only contract opportunities. A bid is an offer to perform the tendered work; it is not an award or a contract.",
    ),
    boundary(),
  );

  const list = document.createElement("ol");
  list.className = "artifact-board__list tender-catalog__list";
  list.setAttribute("aria-label", "Tender entries");
  for (const tender of TENDER_FIXTURES) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "artifact-board__entry tender-catalog__entry";
    link.href = `/tenders/${tender.id.toLowerCase()}`;
    const identity = document.createElement("span");
    identity.className = "artifact-board__identity";
    identity.append(
      textElement("span", tender.id),
      textElement("span", tender.status),
    );
    link.append(
      textElement("span", "╱░▒▓█", "artifact-board__mark"),
      identity,
      textElement("strong", tender.title),
      textElement("span", tender.summary, "artifact-board__summary"),
      textElement("span", "Open tender →", "artifact-board__open"),
    );
    item.append(link);
    list.append(item);
  }

  article.append(header, list);
  return { element: article };
}

function tenderNotFoundView(): View {
  const article = document.createElement("article");
  article.className = "artifact-viewer tender-viewer";
  article.append(
    textElement("p", "Fixture lookup", "artifact-board__eyebrow"),
    textElement("h1", "Tender not found"),
    textElement(
      "p",
      "No checked-in fixture matches this tender identifier. No remote lookup occurred.",
    ),
  );
  const back = textElement("a", "← Back to Tenders");
  back.href = "/tenders";
  article.append(back);
  return { element: article };
}

export function tenderViewerView(identifier: string): View {
  const tender = TENDER_FIXTURES.find(
    (fixture) => fixture.id.toLowerCase() === identifier.toLowerCase(),
  );
  if (!tender) return tenderNotFoundView();
  return renderTender(tender);
}

function renderTender(tender: TenderFixture): View {
  const article = document.createElement("article");
  article.className = "artifact-viewer tender-viewer";

  const back = textElement("a", "← Back to Tenders");
  back.href = "/tenders";
  back.className = "tender-viewer__back";

  const header = document.createElement("header");
  const identity = document.createElement("div");
  identity.className = "artifact-viewer__identity";
  identity.append(
    textElement("span", tender.id),
    textElement("span", tender.status),
  );
  header.append(
    identity,
    textElement("h1", tender.title),
    textElement("p", tender.summary),
  );

  const metadata = document.createElement("dl");
  metadata.className = "artifact-viewer__metadata";
  metadata.append(
    metadataRow("Exact revision", tender.revision),
    metadataRow("Issuer reference", tender.issuer),
    metadataRow("Bid deadline", tender.bidDeadline),
    metadataRow("Compensation", tender.compensation),
    metadataRow("Bid visibility", tender.bidVisibility),
    metadataRow("Award status", tender.awardStatus),
    metadataRow("Contract status", tender.contractStatus),
  );

  const contractPath = document.createElement("section");
  contractPath.className =
    "artifact-viewer__criteria tender-viewer__contract-path";
  contractPath.setAttribute("aria-labelledby", "contract-path-heading");
  const contractHeading = textElement("h2", "Contract path");
  contractHeading.id = "contract-path-heading";
  contractPath.append(
    contractHeading,
    textElement(
      "p",
      "Tender → Bid → Award decision → Contract",
      "tender-viewer__sequence",
    ),
    textElement(
      "p",
      "A bid is an offer for the contract. Submitting or evaluating a bid does not itself create an award, acceptance, obligation, or contract.",
    ),
  );

  const bidBoundary = document.createElement("section");
  bidBoundary.className = "tender-viewer__bid-boundary";
  bidBoundary.setAttribute("aria-labelledby", "bid-boundary-heading");
  const bidHeading = textElement("h2", "Bidding");
  bidHeading.id = "bid-boundary-heading";
  const bidButton = textElement("button", "Bid submission unavailable");
  bidButton.className = "tender-viewer__bid";
  bidButton.type = "button";
  bidButton.disabled = true;
  bidBoundary.append(
    bidHeading,
    textElement(
      "p",
      "Frontend fixture only. No bid, award decision, or contract was created. No bid details or credentials are accepted or stored.",
    ),
    bidButton,
  );

  article.append(
    back,
    header,
    boundary(),
    metadata,
    listSection("deliverables-heading", "Deliverables", tender.deliverables),
    listSection(
      "acceptance-criteria-heading",
      "Acceptance criteria",
      tender.acceptanceCriteria,
    ),
    contractPath,
    bidBoundary,
  );
  return { element: article };
}
