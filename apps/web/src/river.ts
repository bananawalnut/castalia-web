import { DESKTOP_ASCII_RIVER, MOBILE_ASCII_RIVER } from "./asciiRiverArt.js";

const FLOW_SYMBOLS = [
  Array.from("·αγיו∴∵∣"),
  Array.from("βδεζηאבגדהוזחט¬∧∨∣∤≈≠"),
  Array.from("θλμξπρσφψωיכלמנסעפצקרשת∀∃⇒⇔⊢⊨⊥⊤±×÷√≡ℕℤℚ"),
  Array.from("⊕⊗⊘⊙⊚⊛△▽◯✦✧⌬⍟⌖∞∑∏∫≤≥∂∇ℝℂ"),
];
const REDACTION_FLOW = Array.from("░▒▓█▓▒");
const MATRIX_RAIN = Array.from("01אΣ∴⊢⊨≡");
// Short excerpts verified against the 1853 Berlin Latin edition of Pistis
// Sophia. They surface briefly as complete, legible glitch apparitions.
const PISTIS_SOPHIA_WHISPERS = [
  "lumen luminum, audi igitur nunc",
  "serva me, lumen",
  "ego sum tua vis et tuum lumen",
  "in altitudine altitudinum",
] as const;
export const WHISPER_INTERVALS = [13, 16, 5, 224] as const;
const GREEK_SYMBOLS = "αβγδεζηθλμξπρσφψω";
const DENSE_SYMBOLS = "✦⌬⍟⌖⊗⊘⊚⊛";
const MUTATION_CYCLE = 53;
const MUTATION_DWELL = 2;
const REDACTION_CYCLE = 127;
const MATRIX_EVENT_CYCLE = 180;
const MATRIX_EVENT_DURATION = 18;

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function riverSlotHash(row: number, column: number) {
  let value = Math.imul(row + 1, 0x45d9f3b) ^ Math.imul(column + 1, 0x119de1f3);
  value ^= value >>> 16;
  return value >>> 0;
}

export function pistisGlitchAt(step: number) {
  const cycleSteps = 96;
  const cycle = Math.floor(step / cycleSteps);
  const localStep = positiveModulo(step, cycleSteps);
  const seed = riverSlotHash(cycle + 211, cycle * 7 + 19);
  const start = 12 + positiveModulo(seed, 49);
  const duration = 9 + positiveModulo(seed >>> 8, 8);
  if (localStep < start || localStep >= start + duration) return null;

  const age = localStep - start;
  const phrase =
    PISTIS_SOPHIA_WHISPERS[
      positiveModulo(seed >>> 16, PISTIS_SOPHIA_WHISPERS.length)
    ] ?? PISTIS_SOPHIA_WHISPERS[0];
  const edge = age <= 1 || age >= duration - 2;
  const concealed = age === 0 || age === duration - 1;

  return {
    runSeed: seed,
    text: concealed ? "████ ▓▒░ ████" : edge ? `▓▒ ${phrase} ▒▓` : phrase,
  };
}

function symbolDensity(symbol: string) {
  if (symbol === "·") return 0;
  if (GREEK_SYMBOLS.includes(symbol)) return 1;
  if (DENSE_SYMBOLS.includes(symbol)) return 3;
  return 2;
}

type RiverCell = {
  symbol: string;
  row: number;
  column: number;
  hash: number;
  bank: boolean;
  deepWater: boolean;
  downstreamDelay: number;
  phaseJitter: number;
};

type RiverModel = {
  original: string;
  rows: RiverCell[][];
  rowCount: number;
  whisperRuns: { row: number; start: number; length: number }[];
};

function buildRiverModel(art: string): RiverModel {
  const sourceRows = art.split("\n").map((line) => Array.from(line));
  const rowCount = Math.max(1, sourceRows.length - 1);
  const occupied = (row: number, column: number) =>
    (sourceRows[row]?.[column] ?? " ") !== " ";

  const rows = sourceRows.map((symbols, row) =>
    symbols.map((symbol, column) => {
      const hash = riverSlotHash(row, column);
      let nearbyWater = 0;
      let bank = false;

      for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
        for (let columnOffset = -2; columnOffset <= 2; columnOffset += 1) {
          if (rowOffset === 0 && columnOffset === 0) continue;
          const neighborIsWater = occupied(
            row + rowOffset,
            column + columnOffset,
          );
          if (Math.abs(rowOffset) <= 1 && Math.abs(columnOffset) <= 1) {
            bank ||= !neighborIsWater;
          }
          nearbyWater += Number(neighborIsWater);
        }
      }

      return {
        symbol,
        row,
        column,
        hash,
        bank,
        deepWater: !bank && nearbyWater >= 20,
        downstreamDelay: Math.round(
          (row / rowCount) * 13 + Math.sin(row * 0.31 + column * 0.17) * 2,
        ),
        phaseJitter: positiveModulo(hash, MUTATION_CYCLE),
      };
    }),
  );

  const whisperRuns: RiverModel["whisperRuns"] = [];
  rows.forEach((cells, row) => {
    let start = -1;
    for (let column = 0; column <= cells.length; column += 1) {
      const cell = cells[column];
      const flowingWater = cell && cell.symbol !== " " && !cell.bank;
      if (flowingWater && start < 0) start = column;
      if ((!flowingWater || column === cells.length) && start >= 0) {
        const length = column - start;
        if (length >= 12) whisperRuns.push({ row, start, length });
        start = -1;
      }
    }
  });

  return { original: art, rows, rowCount, whisperRuns };
}

export function animateAsciiRiver(
  model: RiverModel,
  tick: number,
  whisper: ReturnType<typeof pistisGlitchAt>,
) {
  if (tick === 0 && !whisper) return model.original;

  const matrixElapsed = tick - 120;
  const matrixEvent = Math.floor(matrixElapsed / MATRIX_EVENT_CYCLE);
  const matrixPhase = positiveModulo(matrixElapsed, MATRIX_EVENT_CYCLE);
  const matrixColumnA = positiveModulo(matrixEvent * 29 + 7, 17);
  const matrixColumnB = positiveModulo(matrixEvent * 13 + 3, 23);

  const renderedRows = model.rows.map((cells) =>
    cells.map((cell) => {
      if (cell.symbol === " " || cell.bank) return cell.symbol;

      if (matrixElapsed >= 0 && matrixPhase < MATRIX_EVENT_DURATION) {
        const rainHead = Math.floor(
          (matrixPhase / Math.max(1, MATRIX_EVENT_DURATION - 1)) *
            (model.rowCount + 6),
        );
        const rainTrail = rainHead - cell.row;
        const selectedColumn =
          cell.column % 17 === matrixColumnA ||
          cell.column % 23 === matrixColumnB;
        if (selectedColumn && rainTrail >= 0 && rainTrail < 6) {
          return (
            MATRIX_RAIN[
              positiveModulo(
                cell.hash + matrixEvent + rainTrail,
                MATRIX_RAIN.length,
              )
            ] ?? cell.symbol
          );
        }
      }

      const localTick = tick - cell.downstreamDelay + cell.phaseJitter;
      const redactionPhase = positiveModulo(
        localTick + positiveModulo(cell.hash, 41),
        REDACTION_CYCLE,
      );
      if (
        cell.deepWater &&
        cell.hash % 19 === 0 &&
        redactionPhase < REDACTION_FLOW.length
      ) {
        return REDACTION_FLOW[redactionPhase] ?? cell.symbol;
      }

      const mutationPhase = positiveModulo(localTick, MUTATION_CYCLE);
      if (mutationPhase >= MUTATION_DWELL) return cell.symbol;

      const symbols = FLOW_SYMBOLS[symbolDensity(cell.symbol)] ??
        FLOW_SYMBOLS[1] ?? ["·"];
      return (
        symbols[
          positiveModulo(
            cell.hash + Math.floor(localTick / MUTATION_CYCLE),
            symbols.length,
          )
        ] ?? cell.symbol
      );
    }),
  );

  if (whisper) {
    const glyphs = Array.from(whisper.text.replaceAll(" ", "·"));
    const runs = model.whisperRuns.filter((run) => run.length >= glyphs.length);
    const run = runs.length
      ? runs[positiveModulo(whisper.runSeed, runs.length)]
      : undefined;
    if (run) {
      const start = run.start + Math.floor((run.length - glyphs.length) / 2);
      const row = renderedRows[run.row];
      glyphs.forEach((glyph, index) => {
        if (row) row[start + index] = glyph;
      });
    }
  }

  return renderedRows.map((row) => row.join("")).join("\n");
}

export const DESKTOP_RIVER_MODEL = buildRiverModel(DESKTOP_ASCII_RIVER);
export const MOBILE_RIVER_MODEL = buildRiverModel(MOBILE_ASCII_RIVER);

export type RiverRock = {
  row: number;
  column: number;
  label: string;
  text: string;
  to: string;
};

const RIVER_ROCK_LINKS = {
  commons: {
    label: "The Commons",
    text: "╱░▒▓█[ the commons ]█▓▒░╲",
    to: "/room/zenith",
  },
  rfc: { label: "RFC", text: "╱░▒▓█[ rfc ]█▓▒░╲", to: "/rfcs" },
  spaces: {
    label: "Spaces",
    text: "╱░▒▓█[ spaces ]█▓▒░╲",
    to: "/spaces",
  },
} as const;

function centeredRock(
  art: string,
  row: number,
  rock: Omit<RiverRock, "row" | "column">,
): RiverRock {
  const line = art.split("\n")[row];
  if (line === undefined)
    throw new Error(`Missing ASCII river row ${String(row)}`);
  const waterStart = line.search(/\S/u);
  const waterEnd = line.trimEnd().length;
  const rockWidth = Array.from(rock.text).length;
  return {
    ...rock,
    row,
    column: waterStart + Math.floor((waterEnd - waterStart - rockWidth) / 2),
  };
}

// Row is the placement markup; the occupied run in that row owns centering.
export const DESKTOP_RIVER_ROCKS: readonly RiverRock[] = [
  centeredRock(DESKTOP_ASCII_RIVER, 16, RIVER_ROCK_LINKS.commons),
  centeredRock(DESKTOP_ASCII_RIVER, 26, RIVER_ROCK_LINKS.rfc),
  centeredRock(DESKTOP_ASCII_RIVER, 39, RIVER_ROCK_LINKS.spaces),
];

export const MOBILE_RIVER_ROCKS: readonly RiverRock[] = [
  centeredRock(MOBILE_ASCII_RIVER, 30, {
    ...RIVER_ROCK_LINKS.commons,
    text: "╱▒[ commons ]▒╲",
  }),
  centeredRock(MOBILE_ASCII_RIVER, 44, {
    ...RIVER_ROCK_LINKS.rfc,
    text: "╱▒[ rfc ]▒╲",
  }),
  centeredRock(MOBILE_ASCII_RIVER, 61, {
    ...RIVER_ROCK_LINKS.spaces,
    text: "╱▒[ spaces ]▒╲",
  }),
];
