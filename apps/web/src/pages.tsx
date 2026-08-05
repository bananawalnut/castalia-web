import { useEffect, useState } from "react";
import { Link } from "react-router";
import { DESKTOP_ASCII_RIVER, MOBILE_ASCII_RIVER } from "./asciiRiverArt.js";

const AQUARIUS_STARS = [
  { name: "Sadalsuud", x: 8, y: 18, major: true },
  { name: "Sadalmelik", x: 20, y: 35, major: true },
  { name: "Sadachbia", x: 40, y: 34, major: true },
  { name: "Zeta Aquarii", x: 50, y: 29, major: true },
  { name: "Eta Aquarii", x: 58, y: 32, major: false },
  { name: "Pi Aquarii", x: 75, y: 18, major: false },
  { name: "Ancha", x: 36, y: 50, major: true },
  { name: "Hydor", x: 48, y: 57, major: false },
  { name: "Tau Aquarii", x: 25, y: 67, major: false },
  { name: "Skat", x: 63, y: 75, major: true },
  { name: "Albali", x: 78, y: 55, major: true },
  { name: "Iota Aquarii", x: 84, y: 82, major: false },
  { name: "99 Aquarii", x: 92, y: 68, major: false },
] as const;

const PIXEL_SKY_STARS = [
  [65, 6],
  [73, 12],
  [82, 5],
  [90, 10],
  [97, 4],
  [4, 31],
  [15, 34],
  [28, 29],
  [88, 31],
  [96, 39],
  [7, 43],
  [22, 47],
  [34, 40],
  [46, 46],
  [59, 43],
  [71, 49],
  [84, 45],
  [95, 53],
  [5, 58],
  [14, 66],
  [26, 55],
  [37, 63],
  [50, 59],
  [64, 68],
  [76, 61],
  [89, 70],
  [97, 63],
  [8, 80],
  [20, 75],
  [31, 86],
  [43, 78],
  [56, 88],
  [69, 81],
  [82, 90],
  [94, 83],
] as const;

function PixelNightSky() {
  return (
    <div className="pixel-night-sky" aria-hidden="true">
      {PIXEL_SKY_STARS.map(([x, y], index) => (
        <span
          key={`${String(x)}-${String(y)}`}
          className={`pixel-star pixel-star--field${
            index % 9 === 0 ? " pixel-star--major" : ""
          }`}
          style={{ left: `${String(x)}%`, top: `${String(y)}%` }}
        />
      ))}
      <div className="pixel-aquarius" data-constellation="Aquarius">
        {AQUARIUS_STARS.map((star) => (
          <span
            key={star.name}
            className={`pixel-star${star.major ? " pixel-star--major" : ""}`}
            data-star={star.name}
            style={{
              left: `${String(star.x)}%`,
              top: `${String(star.y)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
const WHISPER_INTERVALS = [13, 16, 5, 224] as const;
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

function pistisGlitchAt(step: number) {
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

function animateAsciiRiver(
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

const DESKTOP_RIVER_MODEL = buildRiverModel(DESKTOP_ASCII_RIVER);
const MOBILE_RIVER_MODEL = buildRiverModel(MOBILE_ASCII_RIVER);

type RiverRock = {
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
  spaces: { label: "Spaces", text: "╱░▒▓█[ spaces ]█▓▒░╲", to: "/spaces" },
} as const;

const DESKTOP_RIVER_ROCKS: readonly RiverRock[] = [
  {
    ...RIVER_ROCK_LINKS.commons,
    row: 16,
    column: 50,
  },
  {
    ...RIVER_ROCK_LINKS.rfc,
    row: 26,
    column: 49,
  },
  {
    ...RIVER_ROCK_LINKS.spaces,
    row: 39,
    column: 52,
  },
];

const MOBILE_RIVER_ROCKS: readonly RiverRock[] = [
  { ...RIVER_ROCK_LINKS.commons, row: 30, column: 9 },
  { ...RIVER_ROCK_LINKS.rfc, row: 44, column: 22 },
  { ...RIVER_ROCK_LINKS.spaces, row: 61, column: 20 },
];

function RiverArtWithRocks({
  art,
  rocks,
}: {
  art: string;
  rocks: readonly RiverRock[];
}) {
  const rockByRow = new Map(rocks.map((rock) => [rock.row, rock]));

  return art.split("\n").map((line, row) => {
    const rock = rockByRow.get(row);
    if (!rock)
      return (
        <span key={row} aria-hidden="true">
          {row === 0 ? (
            <>
              <span className="river-source-head">{line.slice(0, 3)}</span>
              {line.slice(3)}
            </>
          ) : (
            line
          )}
          {"\n"}
        </span>
      );

    // Composition-only prototype: the rock replaces a fixed-width run of river
    // characters directly in the preformatted artwork. Row and column remain
    // cheap art-direction controls while routes stay ordinary links.
    const padded = line.padEnd(rock.column + rock.text.length, " ");
    return (
      <span key={row}>
        <span aria-hidden="true">{padded.slice(0, rock.column)}</span>
        <Link className="riverbank-action" to={rock.to} aria-label={rock.label}>
          <span aria-hidden="true">{rock.text}</span>
        </Link>
        <span aria-hidden="true">
          {padded.slice(rock.column + rock.text.length)}
          {"\n"}
        </span>
      </span>
    );
  });
}

function BitmapStream() {
  const [tick, setTick] = useState(0);
  const [glitchStep, setGlitchStep] = useState(0);

  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const timer = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 180);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let step = 0;
    let timer = 0;
    const schedule = () => {
      const interval =
        WHISPER_INTERVALS[step % WHISPER_INTERVALS.length] ??
        WHISPER_INTERVALS[WHISPER_INTERVALS.length - 1];
      timer = window.setTimeout(() => {
        step += 1;
        setGlitchStep(step);
        schedule();
      }, interval);
    };
    schedule();

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const whisper = pistisGlitchAt(glitchStep);

  return (
    <div className="bitmap-stream">
      <pre className="bitmap-stream__art bitmap-stream__art--desktop">
        <RiverArtWithRocks
          art={animateAsciiRiver(DESKTOP_RIVER_MODEL, tick, whisper)}
          rocks={DESKTOP_RIVER_ROCKS}
        />
      </pre>
      <pre className="bitmap-stream__art bitmap-stream__art--mobile">
        <RiverArtWithRocks
          art={animateAsciiRiver(MOBILE_RIVER_MODEL, tick, whisper)}
          rocks={MOBILE_RIVER_ROCKS}
        />
      </pre>
    </div>
  );
}

export function Rooms() {
  return (
    <div className="bitmap-scene bitmap-landing">
      <PixelNightSky />
      <img
        className="bitmap-figure bitmap-angel"
        src="/bitmap/angel.png"
        alt=""
        aria-hidden="true"
      />
      <img
        className="bitmap-figure bitmap-merlin"
        src="/bitmap/merlin.png"
        alt=""
        aria-hidden="true"
      />

      <header className="bitmap-title">
        <h1>Castalia</h1>
        <p className="bitmap-subheading">
          an open spring for independent worlds.
        </p>
        <Link className="bitmap-story-cta" to="/story">
          Story →
        </Link>
      </header>

      <BitmapStream />
    </div>
  );
}

export function NotFound() {
  return (
    <article className="retained-not-found">
      <h1>Page not found</h1>
      <p>The requested page is not one of the retained Castalia surfaces.</p>
      <nav aria-label="Not found actions">
        <Link to="/">Back to Castalia</Link>
        <Link to="/docs">Documentation</Link>
      </nav>
    </article>
  );
}
