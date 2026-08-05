export type GridPoint = {
  row: number;
  column: number;
};

export type GridRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export type CharacterCell = {
  glyph: string;
  source?: GridPoint;
};

export type CharacterGrid = {
  columns: number;
  rows: number;
  cells: Array<CharacterCell | null>;
};

export function createCharacterGrid(
  columns: number,
  rows: number,
): CharacterGrid {
  const safeColumns = Math.max(1, Math.floor(columns));
  const safeRows = Math.max(1, Math.floor(rows));
  return {
    columns: safeColumns,
    rows: safeRows,
    cells: new Array<CharacterCell | null>(safeColumns * safeRows).fill(null),
  };
}

function indexOf(grid: CharacterGrid, row: number, column: number) {
  if (row < 0 || row >= grid.rows || column < 0 || column >= grid.columns) {
    return -1;
  }
  return row * grid.columns + column;
}

export function gridCellAt(
  grid: CharacterGrid,
  row: number,
  column: number,
): CharacterCell | null {
  const index = indexOf(grid, row, column);
  return index < 0 ? null : (grid.cells[index] ?? null);
}

export function setGridCell(
  grid: CharacterGrid,
  point: GridPoint,
  cell: CharacterCell | null,
) {
  const index = indexOf(grid, point.row, point.column);
  if (index >= 0) grid.cells[index] = cell;
}

export function writeArtToGrid(
  grid: CharacterGrid,
  art: string,
  origin: GridPoint,
): { written: number; clipped: number } {
  let written = 0;
  let clipped = 0;
  art.split("\n").forEach((line, sourceRow) => {
    Array.from(line).forEach((glyph, sourceColumn) => {
      if (glyph === " ") return;
      const row = origin.row + sourceRow;
      const column = origin.column + sourceColumn;
      const index = indexOf(grid, row, column);
      if (index < 0) {
        clipped += 1;
        return;
      }
      grid.cells[index] = {
        glyph,
        source: { row: sourceRow, column: sourceColumn },
      };
      written += 1;
    });
  });
  return { written, clipped };
}

export function wrapCellsAroundObstacle(
  grid: CharacterGrid,
  obstacle: GridRect,
): { displaced: number; wrapped: number } {
  const displaced: CharacterCell[] = [];
  for (let row = obstacle.top; row < obstacle.bottom; row += 1) {
    for (let column = obstacle.left; column < obstacle.right; column += 1) {
      const cell = gridCellAt(grid, row, column);
      if (cell) displaced.push(cell);
      setGridCell(grid, { row, column }, null);
    }
  }

  const perimeter: GridPoint[] = [];
  for (let column = obstacle.left - 1; column <= obstacle.right; column += 1) {
    perimeter.push({ row: obstacle.top - 1, column });
  }
  for (let row = obstacle.top; row < obstacle.bottom; row += 1) {
    perimeter.push({ row, column: obstacle.right });
  }
  for (let column = obstacle.right; column >= obstacle.left - 1; column -= 1) {
    perimeter.push({ row: obstacle.bottom, column });
  }
  for (let row = obstacle.bottom - 1; row >= obstacle.top; row -= 1) {
    perimeter.push({ row, column: obstacle.left - 1 });
  }

  let wrapped = 0;
  displaced.forEach((cell, index) => {
    const point = perimeter[index % perimeter.length];
    if (!point || indexOf(grid, point.row, point.column) < 0) return;
    setGridCell(grid, point, cell);
    wrapped += 1;
  });
  return { displaced: displaced.length, wrapped };
}

function rasterLine(start: GridPoint, end: GridPoint): GridPoint[] {
  const points: GridPoint[] = [];
  let column = start.column;
  let row = start.row;
  const deltaColumn = Math.abs(end.column - start.column);
  const deltaRow = Math.abs(end.row - start.row);
  const stepColumn = start.column < end.column ? 1 : -1;
  const stepRow = start.row < end.row ? 1 : -1;
  let error = deltaColumn - deltaRow;

  points.push({ row, column });
  while (column !== end.column || row !== end.row) {
    const doubled = error * 2;
    if (doubled > -deltaRow) {
      error -= deltaRow;
      column += stepColumn;
    }
    if (doubled < deltaColumn) {
      error += deltaColumn;
      row += stepRow;
    }
    points.push({ row, column });
  }
  return points;
}

export function buildHeadwaterPath({
  columns,
  rows,
  source,
  entryTangent = { row: 1, column: 1 },
}: {
  columns: number;
  rows: number;
  source: GridPoint;
  entryTangent?: GridPoint;
}): GridPoint[] {
  const end = {
    row: Math.min(rows - 1, source.row),
    column: Math.min(columns - 1, source.column),
  };
  const start = {
    row: -Math.max(3, Math.round(end.row * 0.25)),
    column: -Math.max(6, Math.round(end.column * 0.12)),
  };
  const terminalGuide = {
    row: Math.max(0, end.row - Math.max(1, entryTangent.row) * 3),
    column: end.column - entryTangent.column * 3,
  };
  const path = [start];
  let previous = start;
  const appendSegment = (target: GridPoint) => {
    const segment = rasterLine(previous, target);
    for (const point of segment.slice(1)) {
      const last = path.at(-1);
      if (!last || last.row !== point.row || last.column !== point.column) {
        path.push(point);
      }
    }
    previous = target;
  };

  appendSegment({ row: 0, column: 0 });
  const guideRows = Math.max(1, terminalGuide.row);
  for (let row = 1; row <= terminalGuide.row; row += 1) {
    const progress = row / guideRows;
    const envelope = Math.sin(Math.PI * progress);
    const column = Math.round(
      terminalGuide.column * progress +
        terminalGuide.column *
          0.18 *
          Math.sin(2 * Math.PI * progress) *
          envelope,
    );
    appendSegment({ row, column });
  }
  for (let row = terminalGuide.row + 1; row <= end.row; row += 1) {
    const rowsToSeam = end.row - row;
    appendSegment({
      row,
      column: end.column - entryTangent.column * rowsToSeam,
    });
  }
  return path;
}

export type BraidedHeadwaterPaths = {
  left: GridPoint[];
  right: GridPoint[];
  spiral: GridPoint[];
  merged: GridPoint[];
  mergePoint: GridPoint;
};

const UPPER_BANK = [
  [0, -0.08],
  [0.41, -0.08],
  [0.5, 0.03],
  [0.6, 0.1],
  [0.7, 0.22],
  [0.8, 0.4],
  [0.9, 0.68],
  [1, 1],
] as const;
const LOWER_BANK = [
  [0, 0],
  [0.17, 0.08],
  [0.28, 0.1],
  [0.45, 0.33],
  [0.55, 0.38],
  [0.67, 0.58],
  [0.76, 0.9],
  [0.84, 1.25],
  [1, 1.7],
] as const;

function interpolateBank(
  controls: ReadonlyArray<readonly [number, number]>,
  progress: number,
) {
  const bounded = Math.max(0, Math.min(1, progress));
  for (let index = 1; index < controls.length; index += 1) {
    const previous = controls[index - 1];
    const next = controls[index];
    if (!previous || !next || bounded > next[0]) continue;
    const span = Math.max(Number.EPSILON, next[0] - previous[0]);
    const local = (bounded - previous[0]) / span;
    return previous[1] + (next[1] - previous[1]) * local;
  }
  return controls.at(-1)?.[1] ?? 0;
}

export function braidedCorridorRows(column: number, source: GridPoint) {
  const progress = column / Math.max(1, source.column);
  const scale = Math.max(1, source.row);
  const upper = Math.round(interpolateBank(UPPER_BANK, progress) * scale);
  const lower = Math.round(interpolateBank(LOWER_BANK, progress) * scale);
  return { upper: Math.min(upper, lower), lower: Math.max(upper, lower) };
}

export function isInsideBraidedCorridor(point: GridPoint, source: GridPoint) {
  if (point.column / Math.max(1, source.column) < 0.17) return false;
  const { upper, lower } = braidedCorridorRows(point.column, source);
  return point.row >= upper && point.row <= lower;
}

export function buildBraidedHeadwaterPaths({
  columns,
  rows,
  source,
  entryTangent = { row: 1, column: 1 },
  sourceWidth,
  sourceGrowth,
}: {
  columns: number;
  rows: number;
  source: GridPoint;
  entryTangent?: GridPoint;
  sourceWidth: number;
  sourceGrowth: number;
}): BraidedHeadwaterPaths {
  const end = {
    row: Math.min(rows - 1, source.row),
    column: Math.min(columns - 1, source.column),
  };
  const tangentRow = Math.max(1, entryTangent.row);
  const growth = Math.max(1, Math.abs(sourceGrowth));
  const derivativeRows = Math.max(
    3,
    Math.ceil(Math.max(0, sourceWidth - 1) / growth),
  );
  const mergeRows = Math.min(
    Math.max(1, Math.floor((end.row - 1) / tangentRow)),
    derivativeRows,
  );
  const mergePoint = {
    row: Math.max(0, end.row - tangentRow * mergeRows),
    column: end.column - entryTangent.column * mergeRows,
  };
  const startRow = -Math.max(3, Math.round(end.row * 0.25));
  const start = { row: startRow, column: -8 };
  const left: GridPoint[] = [start];
  const right: GridPoint[] = [start];

  const append = (path: GridPoint[], target: GridPoint) => {
    const previous = path.at(-1);
    if (!previous) return;
    for (const point of rasterLine(previous, target).slice(1)) {
      const last = path.at(-1);
      if (!last || last.row !== point.row || last.column !== point.column) {
        path.push(point);
      }
    }
  };

  const branchColumns = Math.max(1, mergePoint.column + 1);
  let leftRow = startRow;
  let rightRow = startRow;
  for (let column = 0; column <= mergePoint.column; column += 1) {
    const progress = (column + 1) / branchColumns;
    const braidProgress = Math.max(0, (progress - 0.32) / 0.68);
    const opening = Math.min(1, braidProgress * 3);
    const remaining = mergePoint.column - column;
    const corridor = braidedCorridorRows(column, end);
    const upperInterior = Math.min(corridor.lower, corridor.upper + 1);
    const lowerInterior = Math.max(corridor.upper, corridor.lower - 1);
    const sharedRow = Math.round((upperInterior + lowerInterior) / 2);
    const leftTarget =
      remaining <= 3
        ? mergePoint.row - remaining
        : Math.round(sharedRow * (1 - opening) + upperInterior * opening);
    const rightTarget =
      remaining <= 3
        ? mergePoint.row
        : Math.round(
            sharedRow * (1 - opening) +
              Math.min(mergePoint.row, lowerInterior) * opening,
          );
    leftRow = Math.max(leftRow, Math.min(mergePoint.row, leftTarget));
    rightRow = Math.max(rightRow, Math.min(mergePoint.row, rightTarget));
    append(left, {
      row: leftRow,
      column,
    });
    append(right, {
      row: rightRow,
      column,
    });
  }

  const spiralCenter = {
    row: Math.round(end.row * 0.67),
    column: Math.round(end.column * 0.19),
  };
  const spiralRadius = {
    row: Math.max(3, Math.round(end.row * 0.67)),
    column: Math.max(3, Math.round(end.column * 0.17)),
  };
  const spiral: GridPoint[] = [];
  const phi = (1 + Math.sqrt(5)) / 2;
  for (let step = 0; step <= 40; step += 1) {
    const quarterTurns = step / 8;
    const scale = phi ** -quarterTurns;
    const angle = -Math.PI / 2 - quarterTurns * (Math.PI / 2);
    const target = {
      row: Math.round(
        spiralCenter.row + spiralRadius.row * scale * Math.sin(angle),
      ),
      column: Math.round(
        spiralCenter.column + spiralRadius.column * scale * Math.cos(angle),
      ),
    };
    if (spiral.length === 0) spiral.push(target);
    else append(spiral, target);
  }

  const merged = rasterLine(mergePoint, end);
  return { left, right, spiral, merged, mergePoint };
}
