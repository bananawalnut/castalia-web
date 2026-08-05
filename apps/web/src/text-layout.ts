import {
  measureNaturalWidth,
  prepareWithSegments,
  type PrepareOptions,
} from "@chenglou/pretext";

export type TextLayoutEngine = "pretext" | "fixed-cells";

export type InlineCenterResult = {
  column: number;
  engine: TextLayoutEngine;
};

const widthCache = new Map<string, number>();

export function supportsPretextMeasurement(): boolean {
  return (
    typeof globalThis.CanvasRenderingContext2D === "function" &&
    typeof Intl.Segmenter === "function"
  );
}

export function measureText(
  text: string,
  font: string,
  options: PrepareOptions = { whiteSpace: "pre-wrap" },
): number {
  const key = `${font}\u0000${options.whiteSpace ?? "normal"}\u0000${options.wordBreak ?? "normal"}\u0000${String(options.letterSpacing ?? 0)}\u0000${text}`;
  const cached = widthCache.get(key);
  if (cached !== undefined) return cached;
  const width = measureNaturalWidth(prepareWithSegments(text, font, options));
  widthCache.set(key, width);
  return width;
}

export function centerInlineTextInOccupiedRun(
  line: string,
  inlineText: string,
  fallbackColumn: number,
  font: string,
): InlineCenterResult {
  if (!supportsPretextMeasurement()) {
    return { column: fallbackColumn, engine: "fixed-cells" };
  }

  try {
    const occupiedStart = line.search(/\S/u);
    const occupiedEnd = line.trimEnd().length;
    if (occupiedStart < 0 || occupiedEnd - occupiedStart < inlineText.length) {
      return { column: fallbackColumn, engine: "fixed-cells" };
    }

    let bestColumn = fallbackColumn;
    let bestImbalance = Number.POSITIVE_INFINITY;
    const finalColumn = occupiedEnd - inlineText.length;
    for (let column = occupiedStart; column <= finalColumn; column += 1) {
      const before = line.slice(occupiedStart, column);
      const after = line.slice(column + inlineText.length, occupiedEnd);
      const imbalance = Math.abs(
        measureText(before, font) - measureText(after, font),
      );
      if (imbalance < bestImbalance) {
        bestColumn = column;
        bestImbalance = imbalance;
      }
    }
    return { column: bestColumn, engine: "pretext" };
  } catch {
    return { column: fallbackColumn, engine: "fixed-cells" };
  }
}
