export type View = {
  element: HTMLElement;
  destroy?: () => void;
};

export function elementFromHtml(markup: string): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  const element = template.content.firstElementChild;
  if (!(element instanceof HTMLElement))
    throw new Error("View markup has no root element");
  return element;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
