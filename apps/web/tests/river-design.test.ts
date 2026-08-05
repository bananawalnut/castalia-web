import { describe, expect, it } from "vitest";
import {
  DESKTOP_ASCII_RIVER,
  MOBILE_ASCII_RIVER,
} from "../src/asciiRiverArt.js";
import { DESKTOP_RIVER_ROCKS, MOBILE_RIVER_ROCKS } from "../src/river.js";

function waterMargins(
  art: string,
  rock: { row: number; column: number; text: string },
) {
  const line = art.split("\n")[rock.row];
  if (line === undefined)
    throw new Error(`missing river row ${String(rock.row)}`);
  const first = line.search(/\S/u);
  const last = line.trimEnd().length;
  return {
    before: rock.column - first,
    after: last - (rock.column + Array.from(rock.text).length),
  };
}

describe("ASCII river design invariants", () => {
  it("preserves the intended source prefix without changing its glyph vocabulary", () => {
    expect(DESKTOP_ASCII_RIVER.split("\n")[0]).toBe("·γβ✦⊛⌖⍟✦⊛⌖✦◯⊗πδγβα·γβα·γ");
  });

  it("centers every desktop stone in the occupied run for its row", () => {
    expect(DESKTOP_RIVER_ROCKS.map(({ row, column }) => [row, column])).toEqual(
      [
        [16, 38],
        [26, 44],
        [39, 73],
      ],
    );
    for (const rock of DESKTOP_RIVER_ROCKS) {
      const margins = waterMargins(DESKTOP_ASCII_RIVER, rock);
      expect(margins.before).toBeGreaterThanOrEqual(8);
      expect(margins.after).toBeGreaterThanOrEqual(8);
      expect(Math.abs(margins.before - margins.after)).toBeLessThanOrEqual(1);
    }
  });

  it("uses compact mobile stones that do not widen their river rows", () => {
    expect(MOBILE_RIVER_ROCKS.map(({ row, column }) => [row, column])).toEqual([
      [30, 10],
      [44, 24],
      [61, 28],
    ]);
    for (const rock of MOBILE_RIVER_ROCKS) {
      const margins = waterMargins(MOBILE_ASCII_RIVER, rock);
      expect(margins.before).toBeGreaterThanOrEqual(2);
      expect(margins.after).toBeGreaterThanOrEqual(2);
      expect(Math.abs(margins.before - margins.after)).toBeLessThanOrEqual(1);
    }
  });
});
