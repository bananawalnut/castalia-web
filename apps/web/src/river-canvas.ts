import {
  buildBraidedHeadwaterPaths,
  createCharacterGrid,
  gridCellAt,
  isInsideBraidedCorridor,
  setGridCell,
  wrapCellsAroundObstacle,
  writeArtToGrid,
  type CharacterGrid,
  type GridPoint,
  type GridRect,
} from "./character-grid.js";
import type { RiverRock } from "./river.js";
import { measureText } from "./text-layout.js";

export type ViewportGridMetrics = {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
};

export type GlyphVisual = {
  alpha: number;
  weight: 400 | 500 | 600;
  color: string;
};

export function buildAsciiRockFace(label: string) {
  const text = label.toLocaleLowerCase();
  const width = Array.from(text).length + 8;
  const texture = (length: number, palette: readonly string[]) =>
    Array.from(
      { length },
      (_, index) => palette[index % palette.length] ?? "─",
    ).join("");
  const crown = `   ╭${texture(width - 6, ["─", "─", "·", "─", "⌁"])}╮ `;
  const face = `╱▒[ ${text} ]▒╲`;
  const footing = `  ╲${texture(width - 6, ["░", "▄", "▓", "▒"])}╱  `;
  return [crown, face, footing].join("\n");
}

export function measureRiverSourceRun(art: string, row = 0) {
  const glyphs = Array.from(art.split("\n")[row] ?? "");
  const start = glyphs.findIndex((glyph) => glyph !== " ");
  if (start < 0) return { start: 0, end: 1, width: 1, center: 0 };
  let end = glyphs.length;
  while (end > start && glyphs[end - 1] === " ") end -= 1;
  const width = Math.max(1, end - start);
  return { start, end, width, center: start + Math.floor(width / 2) };
}

export function measureRiverSourceFlow(art: string) {
  const source = measureRiverSourceRun(art, 0);
  const downstream = measureRiverSourceRun(art, 1);
  return {
    width: source.width,
    growth: Math.max(0, downstream.width - source.width),
    tangent: {
      row: 1,
      column: downstream.center - source.center,
    },
  };
}

export function splitRiverSourceWidth(width: number) {
  const safeWidth = Math.max(1, Math.floor(width));
  const left = Math.floor(safeWidth / 2);
  return { left, right: safeWidth - left - 1 };
}

export function computeViewportGrid({
  width,
  height,
  cellWidth,
  cellHeight,
}: {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
}): ViewportGridMetrics {
  return {
    columns: Math.max(1, Math.floor(width / cellWidth)),
    rows: Math.max(1, Math.floor(height / cellHeight)),
    cellWidth,
    cellHeight,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function deriveGlyphVisual({
  coverage,
  boundary,
  hash,
}: {
  coverage: number;
  boundary: boolean;
  hash: number;
}): GlyphVisual {
  const density = clamp(coverage, 0, 1);
  const alpha = clamp(
    0.54 + density * 0.38 + (boundary ? 0.08 : 0) + (hash % 5) * 0.006,
    0.5,
    1,
  );
  const weight: GlyphVisual["weight"] =
    density >= 0.52 ? 600 : density >= 0.24 ? 500 : 400;
  const blueMix = 1 - density;
  const red = Math.round(255 - blueMix * 28);
  const green = Math.round(253 - blueMix * 18);
  const blue = Math.round(245 + blueMix * 10);
  return {
    alpha,
    weight,
    color: `rgb(${String(red)} ${String(green)} ${String(blue)})`,
  };
}

function stableHash(row: number, column: number) {
  let value = Math.imul(row + 1, 0x45d9f3b) ^ Math.imul(column + 1, 0x119de1f3);
  value ^= value >>> 16;
  return value >>> 0;
}

function isBoundaryCell(grid: CharacterGrid, row: number, column: number) {
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      if (!gridCellAt(grid, row + rowOffset, column + columnOffset))
        return true;
    }
  }
  return false;
}

const ABYSS_CORE_GLYPHS = Array.from("βγ⊛⌖⍟⊗⊙");
const ABYSS_MID_GLYPHS = Array.from("αγβα✦⊛◯⊕△▽");
const ABYSS_EDGE_GLYPHS = Array.from("···⋅∙γ∴✧");
const glyphCoverageCache = new Map<string, number>();

type BraidedBranch = "left" | "right" | "merged";

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

export function deriveBraidedGlyph({
  baseGlyph,
  row,
  column,
  branch,
  bank,
  confluence,
  tick,
  flowIndex = row,
}: {
  baseGlyph: string;
  row: number;
  column: number;
  branch: BraidedBranch;
  bank: boolean;
  confluence: boolean;
  tick: number;
  flowIndex?: number;
}) {
  if (tick <= 0 || bank) return { glyph: baseGlyph, mutated: false };
  const hash = stableHash(row, column);
  const branchPhase = confluence
    ? 31
    : branch === "left"
      ? 0
      : branch === "right"
        ? 11
        : 23;
  const cycle = confluence ? 23 : 29;
  const phaseJitter = (hash % 3) - 1;
  const localTick =
    tick - Math.round(flowIndex * 0.7) + branchPhase + phaseJitter;
  const mutated = positiveModulo(localTick, cycle) === 0;
  if (!mutated) return { glyph: baseGlyph, mutated: false };
  const glyphs = ABYSS_CORE_GLYPHS.includes(baseGlyph)
    ? ABYSS_CORE_GLYPHS
    : ABYSS_EDGE_GLYPHS.includes(baseGlyph)
      ? ABYSS_EDGE_GLYPHS
      : ABYSS_MID_GLYPHS;
  let glyph =
    glyphs[
      positiveModulo(
        hash + Math.floor(localTick / cycle) + branchPhase,
        glyphs.length,
      )
    ] ?? baseGlyph;
  if (glyph === baseGlyph) {
    const baseIndex = Math.max(0, glyphs.indexOf(baseGlyph));
    glyph = glyphs[(baseIndex + 1) % glyphs.length] ?? baseGlyph;
  }
  return { glyph, mutated: glyph !== baseGlyph };
}

function glyphCoverage(
  glyph: string,
  font: string,
  cellWidth: number,
  cellHeight: number,
) {
  const key = `${font}\u0000${glyph}\u0000${cellWidth.toFixed(2)}\u0000${cellHeight.toFixed(2)}`;
  const cached = glyphCoverageCache.get(key);
  if (cached !== undefined) return cached;

  const sample = document.createElement("canvas");
  sample.width = Math.max(2, Math.ceil(cellWidth * 2));
  sample.height = Math.max(2, Math.ceil(cellHeight * 2));
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (!context) return 0.2;
  context.clearRect(0, 0, sample.width, sample.height);
  context.font = font;
  context.fillStyle = "#fff";
  context.textBaseline = "middle";
  const width = measureText(glyph, font);
  context.fillText(glyph, (sample.width - width) / 2, sample.height / 2);
  const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
  let alpha = 0;
  for (let index = 3; index < pixels.length; index += 4)
    alpha += pixels[index] ?? 0;
  const coverage = clamp(
    (alpha / (255 * sample.width * sample.height)) * 6,
    0.04,
    1,
  );
  glyphCoverageCache.set(key, coverage);
  return coverage;
}

function rockObstacle(origin: GridPoint, rock: RiverRock): GridRect {
  const sourceWidth = Array.from(rock.text).length;
  const rockWidth = Array.from(
    buildAsciiRockFace(rock.label).split("\n")[0] ?? "",
  ).length;
  const center = origin.column + rock.column + Math.floor(sourceWidth / 2);
  const left = center - Math.floor(rockWidth / 2);
  const top = origin.row + rock.row - 1;
  return {
    top,
    left,
    right: left + rockWidth,
    bottom: top + 3,
  };
}

function wrapRockCells(
  grid: CharacterGrid,
  origin: GridPoint,
  rocks: readonly RiverRock[],
) {
  return rocks.reduce(
    (totals, rock) => {
      const result = wrapCellsAroundObstacle(grid, rockObstacle(origin, rock));
      return {
        displaced: totals.displaced + result.displaced,
        wrapped: totals.wrapped + result.wrapped,
      };
    },
    { displaced: 0, wrapped: 0 },
  );
}

function placeBraidedHeadwater(
  grid: CharacterGrid,
  source: GridPoint,
  sourceFlow: ReturnType<typeof measureRiverSourceFlow>,
  tick: number,
) {
  const braid = buildBraidedHeadwaterPaths({
    columns: grid.columns,
    rows: grid.rows,
    source,
    entryTangent: sourceFlow.tangent,
    sourceWidth: sourceFlow.width,
    sourceGrowth: sourceFlow.growth,
  });
  let cells = 0;
  let mutated = 0;
  let outsidePlaced = 0;

  const placeCell = ({
    point,
    bank,
    branch,
    confluence,
    glyphs,
    flowIndex,
    enforceCorridor = false,
  }: {
    point: GridPoint;
    bank: boolean;
    branch: BraidedBranch;
    confluence: boolean;
    glyphs: string[];
    flowIndex: number;
    enforceCorridor?: boolean;
  }) => {
    const outsideCorridor =
      enforceCorridor && !isInsideBraidedCorridor(point, source);
    if (outsideCorridor && point.column < braid.mergePoint.column - 3) return;
    outsidePlaced += Number(outsideCorridor);
    if (gridCellAt(grid, point.row, point.column)) return;
    const hash = stableHash(point.row, point.column);
    const baseGlyph = glyphs[hash % glyphs.length] ?? "·";
    const frame = deriveBraidedGlyph({
      baseGlyph,
      row: point.row,
      column: point.column,
      branch,
      bank,
      confluence,
      tick,
      flowIndex,
    });
    setGridCell(grid, point, { glyph: frame.glyph });
    cells += 1;
    mutated += Number(frame.mutated);
  };

  const centerByRow = (path: GridPoint[]) => {
    const bounds = new Map<
      number,
      { minimum: number; maximum: number; flowIndex: number }
    >();
    path.forEach(({ row, column }, flowIndex) => {
      const current = bounds.get(row);
      bounds.set(row, {
        minimum: Math.min(current?.minimum ?? column, column),
        maximum: Math.max(current?.maximum ?? column, column),
        flowIndex: Math.max(current?.flowIndex ?? flowIndex, flowIndex),
      });
    });
    return new Map(
      [...bounds].map(([row, { minimum, maximum, flowIndex }]) => [
        row,
        { column: Math.round((minimum + maximum) / 2), flowIndex },
      ]),
    );
  };

  const paintPathCore = (
    path: GridPoint[],
    branch: BraidedBranch,
    flowBase = 0,
    enforceCorridor = false,
  ) => {
    path.forEach((point, flowIndex) => {
      placeCell({
        point,
        bank: false,
        branch,
        confluence: point.row >= braid.mergePoint.row - 1,
        glyphs: ABYSS_CORE_GLYPHS,
        flowIndex: flowBase + flowIndex,
        enforceCorridor,
      });
    });
  };

  const paintCrossSections = (
    path: GridPoint[],
    branch: BraidedBranch,
    widthAtRow: (row: number) => number,
    flowBase = 0,
  ) => {
    centerByRow(path).forEach(({ column, flowIndex }, row) => {
      const width = Math.max(1, widthAtRow(row));
      const bankWidths = splitRiverSourceWidth(width);
      for (
        let offset = -bankWidths.left;
        offset <= bankWidths.right;
        offset += 1
      ) {
        const bank =
          width > 2 &&
          (offset === -bankWidths.left || offset === bankWidths.right);
        const confluence = row >= braid.mergePoint.row - 1;
        const glyphs =
          offset === 0
            ? ABYSS_CORE_GLYPHS
            : bank && !confluence
              ? ABYSS_EDGE_GLYPHS
              : ABYSS_MID_GLYPHS;
        placeCell({
          point: { row, column: column + offset },
          bank,
          branch,
          confluence,
          glyphs,
          flowIndex: flowBase + flowIndex,
        });
      }
    });
  };

  for (const [path, branch] of [
    [braid.left, "left"],
    [braid.right, "right"],
  ] as const) {
    paintPathCore(path, branch, 0, true);
    const outside = branch === "left" ? -1 : 1;
    path.slice(0, -4).forEach((point, flowIndex) => {
      placeCell({
        point: { row: point.row + outside, column: point.column },
        bank: true,
        branch,
        confluence: false,
        glyphs: ABYSS_EDGE_GLYPHS,
        flowIndex,
        enforceCorridor: true,
      });
    });
  }

  braid.spiral.forEach((point, flowIndex) => {
    placeCell({
      point,
      bank: true,
      branch: "left",
      confluence: false,
      glyphs: ABYSS_EDGE_GLYPHS,
      flowIndex,
    });
  });

  const mergedFlowBase = Math.max(braid.left.length, braid.right.length);
  paintPathCore(braid.merged, "merged", mergedFlowBase);
  paintCrossSections(
    braid.merged,
    "merged",
    (row) => {
      const rowsToSeam = Math.max(0, source.row - row);
      return Math.max(1, sourceFlow.width - sourceFlow.growth * rowsToSeam);
    },
    mergedFlowBase,
  );

  return {
    cells,
    mutated,
    mergeRow: braid.mergePoint.row,
    mutationRatio: cells > 0 ? mutated / cells : 0,
    outsidePlaced,
  };
}

function createRockFace(label: string, metrics: ViewportGridMetrics) {
  const face = document.createElement("span");
  face.className = "river-grid-action__face";
  buildAsciiRockFace(label)
    .split("\n")
    .forEach((text) => {
      const row = document.createElement("span");
      row.className = "river-grid-action__row";
      Array.from(text).forEach((glyph) => {
        const cell = document.createElement("span");
        cell.className = "river-grid-action__cell";
        cell.style.width = `${String(metrics.cellWidth)}px`;
        cell.style.height = `${String(metrics.cellHeight)}px`;
        cell.style.lineHeight = `${String(metrics.cellHeight)}px`;
        cell.textContent = glyph;
        row.append(cell);
      });
      face.append(row);
    });
  return face;
}

export type RiverCanvasView = {
  element: HTMLDivElement;
  update(desktopArt: string, mobileArt: string, tick?: number): void;
  destroy(): void;
};

export function createRiverCanvasView({
  desktopArt,
  mobileArt,
  desktopRocks,
  mobileRocks,
}: {
  desktopArt: string;
  mobileArt: string;
  desktopRocks: readonly RiverRock[];
  mobileRocks: readonly RiverRock[];
}): RiverCanvasView {
  const element = document.createElement("div");
  element.className = "bitmap-stream bitmap-stream--grid";
  const canvas = document.createElement("canvas");
  canvas.className = "bitmap-stream__canvas";
  canvas.setAttribute("aria-hidden", "true");
  const actions = document.createElement("div");
  actions.className = "river-grid-actions";
  element.append(canvas, actions);

  const initialRocks = window.matchMedia("(max-width: 640px)").matches
    ? mobileRocks
    : desktopRocks;
  initialRocks.forEach((rock) => {
    const link = document.createElement("a");
    link.className = "river-grid-action";
    link.href = rock.to;
    link.setAttribute("aria-label", rock.label);
    link.textContent = rock.label;
    actions.append(link);
  });

  let currentDesktop = desktopArt;
  let currentMobile = mobileArt;
  let currentTick = 0;
  let animationFrame = 0;
  let actionLayoutKey = "";
  let destroyed = false;
  let resizeObserver: ResizeObserver | null = null;

  const render = () => {
    const renderStarted = performance.now();
    animationFrame = 0;
    if (destroyed) return;
    const bounds = element.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const art = mobile ? currentMobile : currentDesktop;
    const rocks = mobile ? mobileRocks : desktopRocks;
    const fontSize = mobile ? bounds.width * 0.0225 : bounds.width * 0.0082;
    const cellHeight = window.innerHeight * (mobile ? 0.0115 : 0.017);
    const fontFamily = 'Menlo, "DejaVu Sans Mono", "Courier New", monospace';
    const baseFont = `400 ${String(fontSize)}px ${fontFamily}`;
    const cellWidth = measureText("M", baseFont);
    const metrics = computeViewportGrid({
      width: bounds.width,
      height: bounds.height,
      cellWidth,
      cellHeight,
    });
    const origin = {
      row: Math.floor(metrics.rows * (mobile ? 0.18 : 0.22)),
      column: Math.floor(metrics.columns * (mobile ? 0.38 : 0.39)),
    };
    const grid = createCharacterGrid(metrics.columns, metrics.rows);
    writeArtToGrid(grid, art, origin);
    const sourceRun = measureRiverSourceRun(art);
    const sourceFlow = measureRiverSourceFlow(art);
    const sourceJoin = {
      row: origin.row,
      column: origin.column + sourceRun.center,
    };
    const braid = placeBraidedHeadwater(
      grid,
      sourceJoin,
      sourceFlow,
      currentTick,
    );
    const wrappedRockCells = wrapRockCells(grid, origin, rocks);
    const occupiedCells = grid.cells.reduce(
      (count, cell) => count + (cell ? 1 : 0),
      0,
    );

    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    canvas.style.width = `${String(bounds.width)}px`;
    canvas.style.height = `${String(bounds.height)}px`;
    canvas.dataset.gridColumns = String(metrics.columns);
    canvas.dataset.gridRows = String(metrics.rows);
    canvas.dataset.cellWidth = metrics.cellWidth.toFixed(3);
    canvas.dataset.cellHeight = metrics.cellHeight.toFixed(3);
    canvas.dataset.originColumn = String(origin.column);
    canvas.dataset.originRow = String(origin.row);
    canvas.dataset.sourceWidth = String(sourceRun.width);
    canvas.dataset.sourceGrowth = String(sourceFlow.growth);
    canvas.dataset.sourceTangent = String(sourceFlow.tangent.column);
    canvas.dataset.braidBranches = "2";
    canvas.dataset.braidMergeRow = String(braid.mergeRow);
    canvas.dataset.braidGeneratedCells = String(braid.cells);
    canvas.dataset.braidMutationRatio = braid.mutationRatio.toFixed(4);
    canvas.dataset.braidOutsidePlaced = String(braid.outsidePlaced);
    canvas.dataset.textLayout = "pretext";
    canvas.dataset.wrappedCells = String(wrappedRockCells.wrapped);

    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);
    context.textBaseline = "middle";

    for (let row = 0; row < grid.rows; row += 1) {
      for (let column = 0; column < grid.columns; column += 1) {
        const cell = gridCellAt(grid, row, column);
        if (!cell) continue;
        const coverage = glyphCoverage(
          cell.glyph,
          baseFont,
          metrics.cellWidth,
          metrics.cellHeight,
        );
        const visual = deriveGlyphVisual({
          coverage,
          boundary: isBoundaryCell(grid, row, column),
          hash: stableHash(row, column),
        });
        const font = `${String(visual.weight)} ${String(fontSize)}px ${fontFamily}`;
        const glyphWidth = measureText(cell.glyph, font);
        context.globalAlpha = visual.alpha;
        context.fillStyle = visual.color;
        context.font = font;
        context.fillText(
          cell.glyph,
          column * metrics.cellWidth + (metrics.cellWidth - glyphWidth) / 2,
          row * metrics.cellHeight + metrics.cellHeight / 2,
        );
      }
    }
    context.globalAlpha = 1;

    const nextActionLayoutKey = [
      mobile,
      metrics.columns,
      metrics.rows,
      metrics.cellWidth.toFixed(3),
      metrics.cellHeight.toFixed(3),
      origin.row,
      origin.column,
    ].join(":");
    if (nextActionLayoutKey !== actionLayoutKey) {
      actionLayoutKey = nextActionLayoutKey;
      actions.replaceChildren();
      rocks.forEach((rock) => {
        const obstacle = rockObstacle(origin, rock);
        const link = document.createElement("a");
        link.className = "river-grid-action";
        link.href = rock.to;
        link.setAttribute("aria-label", rock.label);
        link.style.left = `${String(obstacle.left * metrics.cellWidth)}px`;
        link.style.top = `${String(obstacle.top * metrics.cellHeight)}px`;
        link.style.width = `${String((obstacle.right - obstacle.left) * metrics.cellWidth)}px`;
        link.style.height = `${String((obstacle.bottom - obstacle.top) * metrics.cellHeight)}px`;
        link.style.font = baseFont;
        link.append(createRockFace(rock.label, metrics));
        actions.append(link);
      });
    }
    canvas.dataset.occupiedCells = String(occupiedCells);
    canvas.dataset.renderMilliseconds = (
      performance.now() - renderStarted
    ).toFixed(2);
  };

  const scheduleRender = () => {
    if (animationFrame || destroyed) return;
    animationFrame = window.requestAnimationFrame(render);
  };
  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(scheduleRender);
    resizeObserver.observe(element);
  } else {
    window.addEventListener("resize", scheduleRender);
  }
  scheduleRender();

  return {
    element,
    update(nextDesktop, nextMobile, nextTick = 0) {
      currentDesktop = nextDesktop;
      currentMobile = nextMobile;
      currentTick = nextTick;
      scheduleRender();
    },
    destroy() {
      destroyed = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleRender);
    },
  };
}
