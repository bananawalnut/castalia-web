import { describe, expect, it } from "vitest";
import { DESKTOP_ASCII_RIVER } from "../src/asciiRiverArt.js";
import {
  braidedCorridorRows,
  buildBraidedHeadwaterPaths,
  buildHeadwaterPath,
  createCharacterGrid,
  gridCellAt,
  isInsideBraidedCorridor,
  wrapCellsAroundObstacle,
  writeArtToGrid,
} from "../src/character-grid.js";

describe("fixed character-cell river grid", () => {
  it("places every glyph at one literal row and column coordinate", () => {
    const grid = createCharacterGrid(12, 6);
    writeArtToGrid(grid, "αβ\n γ", { row: 2, column: 3 });

    expect(grid.columns).toBe(12);
    expect(grid.rows).toBe(6);
    expect(gridCellAt(grid, 2, 3)?.glyph).toBe("α");
    expect(gridCellAt(grid, 2, 4)?.glyph).toBe("β");
    expect(gridCellAt(grid, 3, 3)).toBeNull();
    expect(gridCellAt(grid, 3, 4)?.glyph).toBe("γ");
  });

  it("clips only at screen-grid boundaries without changing source coordinates", () => {
    const grid = createCharacterGrid(4, 3);
    const result = writeArtToGrid(grid, "ABCDE\nFGHIJ", {
      row: 1,
      column: 2,
    });

    expect(result.written).toBe(4);
    expect(result.clipped).toBe(6);
    expect(gridCellAt(grid, 1, 2)?.source).toEqual({ row: 0, column: 0 });
    expect(gridCellAt(grid, 2, 3)?.source).toEqual({ row: 1, column: 1 });
  });

  it("routes a continuous headwater independently of title geometry", () => {
    const source = { row: 16, column: 26 };
    const path = buildHeadwaterPath({
      columns: 40,
      rows: 24,
      source,
      entryTangent: { row: 1, column: 3 },
    });

    expect(path[0]?.row).toBeLessThan(0);
    expect(path[0]?.column).toBeLessThan(0);
    const firstVisible = path.find(
      (point) => point.row >= 0 && point.column >= 0,
    );
    expect(firstVisible).toBeDefined();
    expect(
      Math.min(firstVisible?.row ?? 99, firstVisible?.column ?? 99),
    ).toBeLessThanOrEqual(1);
    expect(path.at(-1)).toEqual(source);
    expect(path).toContainEqual({ row: 13, column: 17 });
    let diagonalSteps = 0;
    let horizontalDirection = 0;
    let horizontalTurns = 0;
    for (let index = 1; index < path.length; index += 1) {
      const previous = path[index - 1];
      const current = path[index];
      if (!previous || !current)
        throw new Error("Headwater path is incomplete");
      if (previous.row !== current.row && previous.column !== current.column) {
        diagonalSteps += 1;
      }
      expect(current.row).toBeGreaterThanOrEqual(previous.row);
      const nextDirection = Math.sign(current.column - previous.column);
      if (
        nextDirection !== 0 &&
        horizontalDirection !== 0 &&
        nextDirection !== horizontalDirection
      ) {
        horizontalTurns += 1;
      }
      if (nextDirection !== 0) horizontalDirection = nextDirection;
      expect(
        Math.max(
          Math.abs(current.row - previous.row),
          Math.abs(current.column - previous.column),
        ),
      ).toBe(1);
    }
    expect(diagonalSteps).toBeGreaterThan(4);
    expect(horizontalTurns).toBeGreaterThanOrEqual(2);
  });

  it("builds two continuous tributaries that share one confluence and seam", () => {
    const source = { row: 16, column: 80 };
    const braid = buildBraidedHeadwaterPaths({
      columns: 112,
      rows: 30,
      source,
      entryTangent: { row: 1, column: 1 },
      sourceWidth: 24,
      sourceGrowth: 6,
    });
    const assertContinuous = (path: typeof braid.left) => {
      for (let index = 1; index < path.length; index += 1) {
        const previous = path[index - 1];
        const current = path[index];
        if (!previous || !current) throw new Error("Incomplete tributary path");
        expect(current.row).toBeGreaterThanOrEqual(previous.row);
        expect(
          Math.max(
            Math.abs(current.row - previous.row),
            Math.abs(current.column - previous.column),
          ),
        ).toBe(1);
      }
    };

    assertContinuous(braid.left);
    assertContinuous(braid.right);
    assertContinuous(braid.merged);
    expect(braid.left[0]?.row).toBeLessThan(0);
    expect(braid.right[0]?.row).toBeLessThan(0);
    expect(braid.left[0]).toEqual(braid.right[0]);
    expect(
      braid.left.filter(
        (point) =>
          point.row >= 0 &&
          point.column >= 0 &&
          braid.right.some(
            (other) => other.row === point.row && other.column === point.column,
          ),
      ).length,
    ).toBeGreaterThanOrEqual(3);
    expect(braid.left.at(-1)).toEqual(braid.mergePoint);
    expect(braid.right.at(-1)).toEqual(braid.mergePoint);
    expect(braid.merged[0]).toEqual(braid.mergePoint);
    expect(braid.merged.at(-1)).toEqual(source);
    expect(braid.mergePoint.row).toBeLessThan(source.row);
    expect(
      braid.left.some(
        (point) =>
          point.row >= 0 &&
          !braid.right.some(
            (other) => other.row === point.row && other.column === point.column,
          ),
      ),
    ).toBe(true);

    const rowBoundsByColumn = (path: typeof braid.left) => {
      const bounds = new Map<number, { minimum: number; maximum: number }>();
      for (const point of path) {
        const current = bounds.get(point.column);
        bounds.set(point.column, {
          minimum: Math.min(current?.minimum ?? point.row, point.row),
          maximum: Math.max(current?.maximum ?? point.row, point.row),
        });
      }
      return bounds;
    };
    const leftBounds = rowBoundsByColumn(braid.left);
    const rightBounds = rowBoundsByColumn(braid.right);
    const lensGaps = [...leftBounds]
      .filter(
        ([column]) =>
          column >= Math.round(braid.mergePoint.column * 0.2) &&
          column <= braid.mergePoint.column - 5 &&
          rightBounds.has(column),
      )
      .map(([column, leftBound]) => {
        const rightBound = rightBounds.get(column);
        if (!rightBound) return -1;
        return rightBound.minimum - leftBound.maximum - 1;
      });
    const maximumCorridorGap = Math.max(
      ...Array.from(
        { length: Math.max(0, braid.mergePoint.column - 4) },
        (_, column) => {
          const { upper, lower } = braidedCorridorRows(column, source);
          return Math.max(0, Math.min(lower, braid.mergePoint.row) - upper - 3);
        },
      ),
    );
    expect(Math.max(...lensGaps)).toBeGreaterThanOrEqual(
      Math.min(6, maximumCorridorGap),
    );
    const braidEligibleColumns = Array.from(
      { length: Math.max(0, braid.mergePoint.column - 4) },
      (_, column) => braidedCorridorRows(column, source),
    ).filter(({ upper, lower }) => lower - upper >= 4).length;
    expect(lensGaps.filter((gap) => gap >= 2).length).toBeGreaterThanOrEqual(
      Math.round(braidEligibleColumns * 0.5),
    );

    const paintedApproach = [...braid.left, ...braid.right].filter(
      (point) =>
        point.column < braid.mergePoint.column - 3 &&
        isInsideBraidedCorridor(point, source),
    );
    expect(Math.min(...paintedApproach.map(({ column }) => column))).toBe(
      Math.ceil(source.column * 0.17),
    );
    for (const point of paintedApproach) {
      const bank = braidedCorridorRows(point.column, source);
      expect(point.row).toBeGreaterThanOrEqual(bank.upper);
      expect(point.row).toBeLessThanOrEqual(bank.lower);
    }

    for (let index = 1; index < braid.spiral.length; index += 1) {
      const previous = braid.spiral[index - 1];
      const current = braid.spiral[index];
      if (!previous || !current) throw new Error("Incomplete spiral offshoot");
      expect(
        Math.max(
          Math.abs(current.row - previous.row),
          Math.abs(current.column - previous.column),
        ),
      ).toBe(1);
    }
    const spiralCenter = {
      row: Math.round(source.row * 0.67),
      column: Math.round(source.column * 0.19),
    };
    const distanceFromSpiralCenter = (point: (typeof braid.spiral)[number]) =>
      Math.hypot(
        point.row - spiralCenter.row,
        point.column - spiralCenter.column,
      );
    const spiralStart = braid.spiral[0];
    const spiralEnd = braid.spiral.at(-1);
    if (!spiralStart || !spiralEnd) throw new Error("Missing spiral endpoints");
    expect(distanceFromSpiralCenter(spiralStart)).toBeGreaterThan(
      distanceFromSpiralCenter(spiralEnd) * 5,
    );
  });

  it("retains the dense lower-river character vocabulary", () => {
    const lowerRiver = DESKTOP_ASCII_RIVER.split("\n").slice(-40).join("");
    expect(lowerRiver).toMatch(/[α-ω]/u);
    expect(lowerRiver).toMatch(/[⊕⊗⊙⊚⊘]/u);
    expect(lowerRiver).toMatch(/[△▽✦✧⍟⌖⌬]/u);
    expect(lowerRiver.length).toBeGreaterThan(2_000);
  });

  it("redistributes displaced glyphs around a multi-row stone button mask", () => {
    const grid = createCharacterGrid(24, 9);
    writeArtToGrid(
      grid,
      Array.from({ length: 9 }, () => "α".repeat(24)).join("\n"),
      { row: 0, column: 0 },
    );
    const result = wrapCellsAroundObstacle(grid, {
      top: 3,
      left: 7,
      right: 17,
      bottom: 6,
    });

    expect(result.displaced).toBe(30);
    for (let row = 3; row < 6; row += 1) {
      for (let column = 7; column < 17; column += 1) {
        expect(gridCellAt(grid, row, column)).toBeNull();
      }
    }
    expect(result.wrapped).toBeGreaterThan(0);
    expect(gridCellAt(grid, 2, 10)).not.toBeNull();
    expect(gridCellAt(grid, 6, 10)).not.toBeNull();
  });
});
