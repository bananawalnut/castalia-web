import { describe, expect, it } from "vitest";
import {
  buildAsciiRockFace,
  computeViewportGrid,
  deriveBraidedGlyph,
  deriveGlyphVisual,
  measureRiverSourceFlow,
  measureRiverSourceRun,
  splitRiverSourceWidth,
} from "../src/river-canvas.js";

describe("character-cell rendering metrics", () => {
  it("derives the screen matrix directly from measured character dimensions", () => {
    expect(
      computeViewportGrid({
        width: 1_440,
        height: 900,
        cellWidth: 7.2,
        cellHeight: 10,
      }),
    ).toEqual({ columns: 200, rows: 90, cellWidth: 7.2, cellHeight: 10 });
  });

  it("uses glyph coverage to vary opacity, weight, and color without moving the cell", () => {
    const light = deriveGlyphVisual({
      coverage: 0.08,
      boundary: false,
      hash: 10,
    });
    const heavy = deriveGlyphVisual({
      coverage: 0.62,
      boundary: false,
      hash: 10,
    });

    expect(heavy.alpha).toBeGreaterThan(light.alpha);
    expect(heavy.weight).toBeGreaterThanOrEqual(light.weight);
    expect(heavy.color).not.toBe(light.color);
    expect(light.alpha).toBeGreaterThanOrEqual(0.5);
    expect(heavy.alpha).toBeLessThanOrEqual(1);
  });

  it("keeps boundary cells more stable and legible than equally light interior cells", () => {
    const boundary = deriveGlyphVisual({
      coverage: 0.12,
      boundary: true,
      hash: 4,
    });
    const interior = deriveGlyphVisual({
      coverage: 0.12,
      boundary: false,
      hash: 4,
    });

    expect(boundary.alpha).toBeGreaterThan(interior.alpha);
  });

  it("draws transparent three-row ASCII boulders with equal cell widths", () => {
    const face = buildAsciiRockFace("The Commons");
    const rows = face.split("\n");
    const widths = rows.map((row) => Array.from(row).length);

    expect(rows).toHaveLength(3);
    expect(new Set(widths).size).toBe(1);
    expect(face).toContain("the commons");
    expect(rows[0]).toMatch(/[╭╮]/u);
    expect(rows[2]).toMatch(/[╲╱]/u);
  });

  it("animates braided interiors sparsely while banks and reduced motion stay fixed", () => {
    const base = {
      baseGlyph: "β",
      branch: "left" as const,
      confluence: false,
    };
    expect(
      deriveBraidedGlyph({ ...base, row: 4, column: 9, bank: false, tick: 0 }),
    ).toEqual({ glyph: "β", mutated: false });
    const stableBank = deriveBraidedGlyph({
      ...base,
      row: 4,
      column: 9,
      bank: true,
      tick: 81,
    });
    expect(stableBank).toEqual({ glyph: "β", mutated: false });

    const frame = Array.from({ length: 200 }, (_, column) =>
      deriveBraidedGlyph({
        ...base,
        row: 6,
        column,
        flowIndex: column,
        bank: false,
        tick: 23,
      }),
    );
    const mutationRatio =
      frame.filter(({ mutated }) => mutated).length / frame.length;
    expect(mutationRatio).toBeGreaterThanOrEqual(0.02);
    expect(mutationRatio).toBeLessThanOrEqual(0.06);
    const leftSequence = Array.from(
      { length: 53 },
      (_, tick) =>
        deriveBraidedGlyph({ ...base, row: 6, column: 11, bank: false, tick })
          .glyph,
    );
    const rightSequence = Array.from(
      { length: 53 },
      (_, tick) =>
        deriveBraidedGlyph({
          ...base,
          branch: "right",
          row: 6,
          column: 11,
          bank: false,
          tick,
        }).glyph,
    );
    expect(rightSequence).not.toEqual(leftSequence);
  });

  it("profiles the authored source run so generated banks meet its full width", () => {
    expect(measureRiverSourceRun("  αβγδε  \n    ζη")).toEqual({
      start: 2,
      end: 7,
      width: 5,
      center: 4,
    });
    expect(splitRiverSourceWidth(24)).toEqual({ left: 12, right: 11 });
    expect(splitRiverSourceWidth(9)).toEqual({ left: 4, right: 4 });
    expect(measureRiverSourceFlow("αβγ\nαβγδεζ")).toEqual({
      width: 3,
      growth: 3,
      tangent: { row: 1, column: 2 },
    });
  });
});
