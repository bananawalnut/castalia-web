import type { View } from "./dom.js";
import { ALL_RFC_FIXTURES } from "./rfcFixtures.js";

type RfcFixture = (typeof ALL_RFC_FIXTURES)[number];
type RailTab = "Contents" | "Details" | "Comments" | "Updates";
type FormatTab = "MD" | "PDF" | "TXT";
type DisabledCommentDraft = {
  rfcId: string;
  revision: string;
  context: string;
  body: null;
  state: "submission-disabled";
};

const railTabs: readonly RailTab[] = [
  "Contents",
  "Details",
  "Comments",
  "Updates",
];
const formatTabs: readonly FormatTab[] = ["MD", "PDF", "TXT"];
const sectionOutline = [
  ["rfc-section-abstract", "Abstract"],
  ["rfc-section-status", "Status"],
  ["rfc-section-scope", "Scope"],
  ["rfc-section-limitation", "Known limitation"],
  ["rfc-section-maintenance", "Maintenance"],
  ["rfc-section-references", "References"],
] as const;

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

function slug(rfc: RfcFixture): string {
  return rfc.id.toLowerCase();
}

function formatPath(rfc: RfcFixture, extension: "md" | "pdf" | "txt") {
  return `/rfcs/${slug(rfc)}.${extension}`;
}

function downloadLink(
  rfc: RfcFixture,
  label: string,
  extension: "md" | "pdf" | "txt",
): HTMLAnchorElement {
  const link = textElement("a", label, "rfc-document__download");
  link.href = formatPath(rfc, extension);
  link.download = `${slug(rfc)}.${extension}`;
  return link;
}

function plainText(rfc: RfcFixture): string {
  return `${rfc.title}

Castalia RFC: ${rfc.id}
Exact revision: ${rfc.revision}
Author: ${rfc.author}
Authorship proof: Unavailable in fixture
Date published: Not recorded
Domain: Unspecified
Status: ${rfc.status}
Assessment: ${rfc.assessment}

ABSTRACT
${rfc.summary}

SCOPE
Claim coverage: ${rfc.coverage}

KNOWN LIMITATION
${rfc.limitation}

MAINTENANCE
This is a checked-in synthetic fixture. No publication action, repository lookup, or remote request occurs.

REFERENCES
No wikilinked references are recorded in this fixture.`;
}

function documentSection(
  id: string,
  heading: string,
  paragraphs: readonly string[],
): HTMLElement {
  const section = document.createElement("section");
  section.id = id;
  section.dataset.commentAnchor = id;
  section.append(textElement("h2", heading));
  for (const paragraph of paragraphs)
    section.append(textElement("p", paragraph));
  return section;
}

function markdownDocument(rfc: RfcFixture): HTMLElement {
  const documentBody = document.createElement("article");
  documentBody.className =
    "rfc-document__rendered rfc-document__rendered--markdown";
  documentBody.append(
    documentSection("rfc-section-abstract", "Abstract", [rfc.summary]),
    documentSection("rfc-section-status", "Status", [
      `${rfc.status}. Assessment: ${rfc.assessment}.`,
    ]),
    documentSection("rfc-section-scope", "Scope", [
      `Claim coverage: ${rfc.coverage}.`,
    ]),
    documentSection("rfc-section-limitation", "Known limitation", [
      rfc.limitation,
    ]),
    documentSection("rfc-section-maintenance", "Maintenance", [
      "This is a checked-in synthetic fixture. No publication action, repository lookup, or remote request occurs.",
      "The author reference is recorded, but a ZK-verifiable authorship proof is unavailable in this fixture.",
    ]),
    documentSection("rfc-section-references", "References", [
      "No wikilinked references are recorded in this fixture.",
    ]),
  );
  return documentBody;
}

function pdfDocument(rfc: RfcFixture): HTMLElement {
  const frame = document.createElement("iframe");
  frame.className = "rfc-document__pdf";
  frame.src = formatPath(rfc, "pdf");
  frame.title = `${rfc.id} PDF`;
  return frame;
}

function textDocument(rfc: RfcFixture): HTMLElement {
  const pre = textElement("pre", plainText(rfc));
  pre.className = "rfc-document__rendered rfc-document__rendered--text";
  pre.dataset.commentAnchor = "plain-text";
  return pre;
}

function createTabset<T extends string>(options: {
  label: string;
  name: string;
  tabs: readonly T[];
  render: (tab: T, panel: HTMLElement) => void;
  onSelect?: (tab: T) => void;
}) {
  const tablist = document.createElement("div");
  tablist.className = `rfc-document__tabs rfc-document__tabs--${options.name}`;
  tablist.role = "tablist";
  tablist.setAttribute("aria-label", options.label);
  const panel = document.createElement("section");
  panel.className = `rfc-document__tabpanel rfc-document__tabpanel--${options.name}`;
  panel.role = "tabpanel";
  const buttons = options.tabs.map((tab, index) => {
    const button = textElement("button", tab);
    const tabId = `rfc-${options.name}-tab-${String(index)}`;
    const panelId = `rfc-${options.name}-panel`;
    button.type = "button";
    button.id = tabId;
    button.role = "tab";
    button.setAttribute("aria-controls", panelId);
    panel.id = panelId;
    button.addEventListener("click", () => {
      select(index);
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? buttons.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) %
              buttons.length;
      select(next, true);
    });
    tablist.append(button);
    return button;
  });

  function select(index: number, focus = false) {
    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active) panel.setAttribute("aria-labelledby", button.id);
    });
    const selectedTab = options.tabs[index];
    if (selectedTab === undefined) throw new Error("Invalid RFC tab index");
    panel.replaceChildren();
    options.render(selectedTab, panel);
    options.onSelect?.(selectedTab);
    if (focus) buttons[index]?.focus();
  }

  select(0);
  return { tablist, panel };
}

function metadataRow(label: string, value: string | Node): HTMLDivElement {
  const row = document.createElement("div");
  row.append(textElement("dt", label));
  const description = document.createElement("dd");
  description.append(value);
  row.append(description);
  return row;
}

function formatDownloads(rfc: RfcFixture): DocumentFragment {
  const formats = document.createDocumentFragment();
  const links = [
    downloadLink(rfc, "Markdown", "md"),
    downloadLink(rfc, "PDF", "pdf"),
    downloadLink(rfc, "Plain text", "txt"),
  ];
  links.forEach((link, index) => {
    formats.append(link);
    if (index < links.length - 1) formats.append(", ");
  });
  return formats;
}

function contentsPanel(panel: HTMLElement) {
  const list = document.createElement("ol");
  list.className = "rfc-document__contents";
  for (const [id, label] of sectionOutline) {
    const item = document.createElement("li");
    const link = textElement("a", label);
    link.href = `#${id}`;
    item.append(link);
    list.append(item);
  }
  panel.append(list);
}

function detailsPanel(rfc: RfcFixture, panel: HTMLElement) {
  const details = document.createElement("dl");
  details.className = "rfc-document__details";
  details.append(
    metadataRow("Date published", "Not recorded"),
    metadataRow("Author", rfc.author),
    metadataRow("Document kind", rfc.kind),
    metadataRow(
      "Authorship proof",
      "Unavailable in fixture — future maintenance requires ZK-verifiable authorship.",
    ),
    metadataRow("Domain", "Unspecified"),
    metadataRow("Formats", formatDownloads(rfc)),
    metadataRow("Exact revision", rfc.revision),
    metadataRow("Status", rfc.status),
    metadataRow("Assessment", rfc.assessment),
    metadataRow("Claim coverage", rfc.coverage),
  );
  panel.append(details);
}

function disabledCommentNotice(): HTMLElement {
  const notice = document.createElement("div");
  notice.className = "rfc-document__comment-disabled";
  notice.append(
    textElement(
      "p",
      "Comment submission is disabled. Select text in the Markdown or Plain text viewer to preview a future context-bound inline comment.",
    ),
  );
  const button = textElement("button", "Comment submission unavailable");
  button.type = "button";
  button.disabled = true;
  notice.append(button);
  return notice;
}

function commentsPanel(panel: HTMLElement) {
  panel.append(
    textElement("p", "No checked-in comments are attached to this fixture."),
    disabledCommentNotice(),
  );
}

function updatesPanel(rfc: RfcFixture, panel: HTMLElement) {
  const heading = textElement("h3", "Document version history");
  const current = document.createElement("article");
  current.className = "rfc-document__update";
  current.append(
    textElement("strong", rfc.revision),
    textElement("span", "Current checked-in fixture revision"),
    textElement("p", `Lifecycle state: ${rfc.status}.`),
  );
  panel.append(
    heading,
    current,
    textElement("p", "No earlier version history is recorded in this fixture."),
  );
}

function inlineCommentDraft(draft: DisabledCommentDraft): HTMLElement {
  const aside = document.createElement("aside");
  aside.className = "rfc-comment-draft";
  aside.dataset.commentContext = draft.context;
  aside.append(
    textElement("span", "Comment context preview"),
    textElement("blockquote", draft.context),
    textElement(
      "p",
      "This selection would populate the comment object's context field. Nothing is stored or submitted.",
    ),
  );
  const button = textElement("button", "Comment submission unavailable");
  button.type = "button";
  button.disabled = true;
  aside.append(button);
  return aside;
}

function notFoundView(): View {
  const article = document.createElement("article");
  article.className = "rfc-document-not-found";
  article.append(
    textElement("p", "Fixture lookup", "rfc-document__eyebrow"),
    textElement("h1", "RFC not found"),
    textElement(
      "p",
      "No checked-in RFC fixture matches this identifier. No remote lookup occurred.",
    ),
  );
  const back = textElement("a", "← Back to RFCs");
  back.href = "/rfcs";
  article.append(back);
  return { element: article };
}

export function rfcDocumentView(identifier: string): View {
  const rfc = ALL_RFC_FIXTURES.find(
    (fixture) => fixture.id.toLowerCase() === identifier.toLowerCase(),
  );
  if (!rfc) return notFoundView();

  const page = document.createElement("article");
  page.className = "rfc-document";
  const back = textElement("a", "← RFC index", "rfc-document__back");
  back.href = "/rfcs";
  page.append(back);

  const layout = document.createElement("div");
  layout.className = "rfc-document__layout";
  const paper = document.createElement("section");
  paper.className = "rfc-document__paper";
  paper.setAttribute("aria-label", "RFC document");
  const masthead = document.createElement("header");
  masthead.className = "rfc-document__masthead";
  const overline = textElement(
    "p",
    "Castalia / Request for Comments",
    "rfc-document__overline",
  );
  const title = textElement("h1", rfc.title);
  const byline = document.createElement("p");
  byline.className = "rfc-document__byline";
  byline.append(
    "By ",
    textElement("strong", rfc.author),
    " · Authorship proof unavailable",
  );
  const mastheadMetadata = document.createElement("dl");
  mastheadMetadata.className = "rfc-document__masthead-meta";
  mastheadMetadata.append(
    metadataRow("Document ID", rfc.id),
    metadataRow("Revision", rfc.revision),
    metadataRow("Status", rfc.status),
  );
  masthead.append(overline, title, byline, mastheadMetadata);

  const summary = document.createElement("section");
  summary.className = "rfc-document__summary";
  summary.append(textElement("h2", "Summary"), textElement("p", rfc.summary));
  const boundary = textElement(
    "p",
    "Read-only synthetic fixture. No publication, persistence, repository lookup, or remote request occurs.",
    "rfc-document__boundary",
  );

  let handleFormatSelect: (format: FormatTab) => void = () => {};
  const formatSet = createTabset<FormatTab>({
    label: "Document format",
    name: "format",
    tabs: formatTabs,
    render(format, panel) {
      panel.classList.add("rfc-document__viewer-panel");
      if (format === "MD") panel.append(markdownDocument(rfc));
      else if (format === "PDF") panel.append(pdfDocument(rfc));
      else panel.append(textDocument(rfc));
    },
    onSelect(format) {
      handleFormatSelect(format);
    },
  });
  const formatControls = document.createElement("div");
  formatControls.className = "rfc-document__format-controls";
  const viewerToggle = textElement("button", "View");
  viewerToggle.className = "rfc-document__viewer-toggle";
  viewerToggle.type = "button";
  viewerToggle.setAttribute("aria-pressed", "false");
  viewerToggle.title = "Open Markdown viewer";
  formatControls.append(formatSet.tablist, viewerToggle);
  const intro = document.createElement("div");
  intro.className = "rfc-document__intro";
  intro.append(masthead, summary, boundary, formatControls);
  paper.append(intro, formatSet.panel);

  const rail = document.createElement("aside");
  rail.className = "rfc-document__rail";
  const railSet = createTabset<RailTab>({
    label: "RFC metadata",
    name: "rail",
    tabs: railTabs,
    render(tab, panel) {
      if (tab === "Contents") contentsPanel(panel);
      else if (tab === "Details") detailsPanel(rfc, panel);
      else if (tab === "Comments") commentsPanel(panel);
      else updatesPanel(rfc, panel);
    },
  });
  rail.append(railSet.tablist, railSet.panel);

  const viewerSidebar = document.createElement("aside");
  viewerSidebar.className = "rfc-document__viewer-sidebar";
  viewerSidebar.dataset.viewerKind = "markdown";
  viewerSidebar.setAttribute("aria-label", "Markdown viewer navigation");
  viewerSidebar.hidden = true;
  const viewerHeader = document.createElement("header");
  viewerHeader.className = "rfc-document__viewer-header";
  viewerHeader.append(
    textElement("p", "Markdown viewer", "rfc-document__viewer-label"),
    textElement("p", rfc.title, "rfc-document__viewer-title"),
  );
  const viewerExit = textElement("button", "Exit viewer");
  viewerExit.className = "rfc-document__viewer-exit";
  viewerExit.type = "button";
  viewerHeader.append(viewerExit);
  const viewerSet = createTabset<"Contents" | "Comments">({
    label: "Viewer tools",
    name: "viewer",
    tabs: ["Contents", "Comments"],
    render(tab, panel) {
      if (tab === "Contents") contentsPanel(panel);
      else commentsPanel(panel);
    },
  });
  viewerSidebar.append(viewerHeader, viewerSet.tablist, viewerSet.panel);

  const setViewerOpen = (enabled: boolean, restoreFocus = false) => {
    const markdownSelected =
      formatSet.tablist.querySelector('[aria-selected="true"]')?.textContent ===
      "MD";
    const active = enabled && markdownSelected;
    page.classList.toggle("rfc-document--viewing", active);
    document.documentElement.classList.toggle("rfc-viewer-active", active);
    viewerSidebar.hidden = !active;
    viewerToggle.setAttribute("aria-pressed", String(active));
    if (active) {
      const contents = Array.from(
        viewerSet.tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
      ).find((tab) => tab.textContent === "Contents");
      contents?.click();
      viewerExit.focus();
    } else if (restoreFocus) {
      viewerToggle.focus();
    }
  };
  handleFormatSelect = (format) => {
    const available = format === "MD";
    viewerToggle.hidden = !available;
    if (!available) setViewerOpen(false);
  };
  viewerToggle.hidden = false;
  viewerToggle.addEventListener("click", () => {
    setViewerOpen(!page.classList.contains("rfc-document--viewing"));
  });
  viewerExit.addEventListener("click", () => {
    setViewerOpen(false, true);
  });
  const handleViewerKeydown = (event: KeyboardEvent) => {
    if (
      event.key === "Escape" &&
      page.classList.contains("rfc-document--viewing")
    ) {
      event.preventDefault();
      setViewerOpen(false, true);
    }
  };
  page.addEventListener("keydown", handleViewerKeydown);
  layout.append(paper, rail, viewerSidebar);
  page.append(layout);

  const handleSelection = () => {
    const selection = window.getSelection();
    const context = selection?.toString().trim() ?? "";
    if (!selection || selection.isCollapsed || !context) return;
    const range = selection.getRangeAt(0);
    const common =
      range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
    if (!common || !formatSet.panel.contains(common)) return;
    const rendered = common.closest<HTMLElement>(".rfc-document__rendered");
    if (!rendered) return;
    const anchor =
      common.closest<HTMLElement>("[data-comment-anchor]") ?? rendered;
    paper.querySelector(".rfc-comment-draft")?.remove();
    const draft: DisabledCommentDraft = {
      rfcId: rfc.id,
      revision: rfc.revision,
      context: context.slice(0, 500),
      body: null,
      state: "submission-disabled",
    };
    anchor.insertAdjacentElement("afterend", inlineCommentDraft(draft));
  };
  formatSet.panel.addEventListener("mouseup", handleSelection);
  formatSet.panel.addEventListener("keyup", handleSelection);

  return {
    element: page,
    destroy() {
      formatSet.panel.removeEventListener("mouseup", handleSelection);
      formatSet.panel.removeEventListener("keyup", handleSelection);
      page.removeEventListener("keydown", handleViewerKeydown);
      document.documentElement.classList.remove("rfc-viewer-active");
    },
  };
}
