import { ALL_RFC_FIXTURES } from "./rfcFixtures.js";
import type { View } from "./dom.js";

const columns = ["ID", "Name", "Type", "Publish Date"] as const;

function cell(
  tagName: "th" | "td",
  text: string,
  className?: string,
): HTMLTableCellElement {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) element.className = className;
  if (tagName === "th") element.scope = "col";
  return element;
}

function linkedCell(text: string, className: string, href: string) {
  const tableCell = document.createElement("td");
  tableCell.className = className;
  const link = document.createElement("a");
  link.href = href;
  link.textContent = text;
  tableCell.append(link);
  return tableCell;
}

export function rfcCatalogView(): View {
  const article = document.createElement("article");
  article.className = "rfc-catalog";

  const header = document.createElement("header");
  header.className = "rfc-catalog__header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "rfc-catalog__eyebrow";
  eyebrow.textContent = "Castalia registry";
  const title = document.createElement("h1");
  title.textContent = "RFCs";
  const introduction = document.createElement("p");
  introduction.className = "rfc-catalog__introduction";
  introduction.textContent =
    "Checked-in RFC fixtures, ordered by immutable identifier.";
  const boundary = document.createElement("p");
  boundary.className = "rfc-catalog__boundary";
  boundary.textContent =
    "Catalog UI draft. No publication action, repository lookup, or remote request occurs.";
  header.append(eyebrow, title, introduction, boundary);

  const section = document.createElement("section");
  section.className = "rfc-catalog__section";
  section.setAttribute("aria-labelledby", "rfc-index-heading");
  const sectionHeading = document.createElement("div");
  sectionHeading.className = "rfc-catalog__section-heading";
  const heading = document.createElement("h2");
  heading.id = "rfc-index-heading";
  heading.textContent = "RFC index";
  const count = document.createElement("span");
  count.textContent = `${String(ALL_RFC_FIXTURES.length)} records`;
  sectionHeading.append(heading, count);

  const scrollHint = document.createElement("p");
  scrollHint.className = "rfc-catalog__scroll-hint";
  scrollHint.textContent = "Scroll horizontally to view all four columns →";

  const tableViewport = document.createElement("div");
  tableViewport.className = "rfc-catalog__table-viewport";
  tableViewport.tabIndex = 0;
  tableViewport.setAttribute("aria-label", "Scrollable RFC table");
  const table = document.createElement("table");
  table.className = "rfc-catalog__table";
  table.setAttribute("aria-label", "RFC catalog");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const column of columns) headRow.append(cell("th", column));
  head.append(headRow);
  const body = document.createElement("tbody");
  for (const rfc of ALL_RFC_FIXTURES) {
    const row = document.createElement("tr");
    const href = `/rfcs/${rfc.id.toLowerCase()}`;
    row.append(
      linkedCell(rfc.id, "rfc-catalog__id", href),
      linkedCell(rfc.title, "rfc-catalog__name", href),
      cell("td", rfc.kind, "rfc-catalog__metadata"),
      cell("td", "Not recorded", "rfc-catalog__metadata"),
    );
    body.append(row);
  }
  table.append(head, body);
  tableViewport.append(table);
  section.append(sectionHeading, scrollHint, tableViewport);
  article.append(header, section);

  return { element: article };
}
