import { measureNaturalWidth, prepareWithSegments } from "@chenglou/pretext";
import { DESKTOP_ASCII_RIVER } from "../../../apps/web/src/asciiRiverArt.js";
import "./style.css";

const FONT = '400 16px Menlo, "Courier New", monospace';
type Stone = { label: string; text: string; href: string };
const STONES = new Map<number, Stone>([
  [
    16,
    {
      label: "The Commons",
      text: "╱░▒▓█[ the commons ]█▓▒░╲",
      href: "http://localhost:5173/room/zenith",
    },
  ],
  [
    26,
    {
      label: "RFC",
      text: "╱░▒▓█[ rfc ]█▓▒░╲",
      href: "http://localhost:5173/rfcs",
    },
  ],
  [
    39,
    {
      label: "Spaces",
      text: "╱░▒▓█[ spaces ]█▓▒░╲",
      href: "http://localhost:5173/spaces",
    },
  ],
] as const);

type Metric = {
  label: string;
  row: number;
  before: number;
  after: number;
  imbalance: number;
};

const widthCache = new Map<string, number>();
function measure(text: string): number {
  const cached = widthCache.get(text);
  if (cached !== undefined) return cached;
  const width = measureNaturalWidth(
    prepareWithSegments(text, FONT, { whiteSpace: "pre-wrap" }),
  );
  widthCache.set(text, width);
  return width;
}

function nearestSplit(text: string, targetWidth: number): number {
  let bestIndex = 0;
  let bestError = Number.POSITIVE_INFINITY;
  for (let index = 0; index <= text.length; index += 1) {
    const error = Math.abs(measure(text.slice(0, index)) - targetWidth);
    if (error < bestError) {
      bestError = error;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function measuredStoneRow(
  line: string,
  row: number,
  stone: Stone,
): { element: HTMLDivElement; metric: Metric } {
  const leading = line.length - line.trimStart().length;
  const run = line.trim();
  const runWidth = measure(run);
  const stoneWidth = measure(stone.text);
  const targetStart = Math.max(0, (runWidth - stoneWidth) / 2);
  const start = nearestSplit(run, targetStart);
  const end = Math.max(start, nearestSplit(run, targetStart + stoneWidth));
  const beforeText = run.slice(0, start);
  const afterText = run.slice(end);

  const element = document.createElement("div");
  element.className = "river-row river-row--stone";
  element.style.paddingLeft = `${String(measure(" ".repeat(leading)))}px`;
  element.dataset.row = String(row);

  const before = document.createElement("span");
  before.textContent = beforeText;
  const link = document.createElement("a");
  link.href = stone.href;
  link.setAttribute("aria-label", stone.label);
  link.textContent = stone.text;
  const after = document.createElement("span");
  after.textContent = afterText;
  element.append(before, link, after);

  const beforeWidth = measure(beforeText);
  const afterWidth = measure(afterText);
  return {
    element,
    metric: {
      label: stone.label,
      row,
      before: beforeWidth,
      after: afterWidth,
      imbalance: Math.abs(beforeWidth - afterWidth),
    },
  };
}

const river = document.querySelector<HTMLDivElement>("#river");
const metricsOutput = document.querySelector<HTMLOutputElement>("#metrics");
const guides = document.querySelector<HTMLInputElement>("#guides");
if (!river || !metricsOutput || !guides) throw new Error("Spike shell missing");

const metrics: Metric[] = [];
DESKTOP_ASCII_RIVER.split("\n").forEach((line, row) => {
  const stone = STONES.get(row);
  if (stone) {
    const measured = measuredStoneRow(line, row, stone);
    river.append(measured.element);
    metrics.push(measured.metric);
    return;
  }
  const element = document.createElement("div");
  element.className = "river-row";
  element.textContent = line;
  element.dataset.row = String(row);
  river.append(element);
});

metricsOutput.textContent = metrics
  .map(
    ({ label, row, before, after, imbalance }) =>
      `${label}: row ${String(row)}, left ${before.toFixed(2)}px, right ${after.toFixed(2)}px, imbalance ${imbalance.toFixed(2)}px`,
  )
  .join("\n");

guides.addEventListener("change", () => {
  river.classList.toggle("river--guided", guides.checked);
});
river.classList.add("river--guided");
