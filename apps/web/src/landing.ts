import {
  animateAsciiRiver,
  DESKTOP_RIVER_MODEL,
  DESKTOP_RIVER_ROCKS,
  MOBILE_RIVER_MODEL,
  MOBILE_RIVER_ROCKS,
  pistisGlitchAt,
  WHISPER_INTERVALS,
} from "./river.js";
import type { View } from "./dom.js";
import { createRiverCanvasView } from "./river-canvas.js";
import { deployedPath } from "./base-path.js";

const AQUARIUS_STARS = [
  ["Sadalsuud", 8, 18, true],
  ["Sadalmelik", 20, 35, true],
  ["Sadachbia", 40, 34, true],
  ["Zeta Aquarii", 50, 29, true],
  ["Eta Aquarii", 58, 32, false],
  ["Pi Aquarii", 75, 18, false],
  ["Ancha", 36, 50, true],
  ["Hydor", 48, 57, false],
  ["Tau Aquarii", 25, 67, false],
  ["Skat", 63, 75, true],
  ["Albali", 78, 55, true],
  ["Iota Aquarii", 84, 82, false],
  ["99 Aquarii", 92, 68, false],
] as const;

const FIELD_STARS = [
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

function createStar(className: string, x: number, y: number) {
  const star = document.createElement("span");
  star.className = className;
  star.style.left = `${String(x)}%`;
  star.style.top = `${String(y)}%`;
  return star;
}

function createNightSky() {
  const sky = document.createElement("div");
  sky.className = "pixel-night-sky";
  sky.setAttribute("aria-hidden", "true");
  FIELD_STARS.forEach(([x, y], index) => {
    sky.append(
      createStar(
        `pixel-star pixel-star--field${index % 9 === 0 ? " pixel-star--major" : ""}`,
        x,
        y,
      ),
    );
  });
  const aquarius = document.createElement("div");
  aquarius.className = "pixel-aquarius";
  aquarius.dataset.constellation = "Aquarius";
  AQUARIUS_STARS.forEach(([name, x, y, major]) => {
    const star = createStar(
      `pixel-star${major ? " pixel-star--major" : ""}`,
      x,
      y,
    );
    star.dataset.star = name;
    aquarius.append(star);
  });
  sky.append(aquarius);
  return sky;
}

export function landingView(): View {
  const scene = document.createElement("div");
  scene.className = "bitmap-scene bitmap-landing";
  scene.append(createNightSky());

  for (const [kind, src] of [
    ["angel", "/bitmap/angel.png"],
    ["merlin", "/bitmap/merlin.png"],
  ] as const) {
    const image = document.createElement("img");
    image.className = `bitmap-figure bitmap-${kind}`;
    image.src = deployedPath(src);
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    scene.append(image);
  }

  const title = document.createElement("header");
  title.className = "bitmap-title";
  title.innerHTML =
    '<h1>Castalia</h1><p class="bitmap-subheading">an open spring for independent worlds.</p><a class="bitmap-start-cta" href="/start">Start</a>';
  scene.append(title);

  const river = createRiverCanvasView({
    desktopArt: DESKTOP_RIVER_MODEL.original,
    mobileArt: MOBILE_RIVER_MODEL.original,
    desktopRocks: DESKTOP_RIVER_ROCKS,
    mobileRocks: MOBILE_RIVER_ROCKS,
  });
  scene.append(river.element);
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let tick = 0;
  let glitchStep = 0;
  let interval = 0;
  let timeout = 0;

  const render = () => {
    const whisper = pistisGlitchAt(glitchStep);
    river.update(
      animateAsciiRiver(DESKTOP_RIVER_MODEL, tick, whisper),
      animateAsciiRiver(MOBILE_RIVER_MODEL, tick, whisper),
      tick,
    );
  };
  render();

  if (!reducedMotion) {
    interval = window.setInterval(() => {
      tick += 1;
      render();
    }, 180);
    let step = 0;
    const scheduleWhisper = () => {
      const delay = WHISPER_INTERVALS[step % WHISPER_INTERVALS.length] ?? 224;
      timeout = window.setTimeout(() => {
        step += 1;
        glitchStep = step;
        render();
        scheduleWhisper();
      }, delay);
    };
    scheduleWhisper();
  }

  return {
    element: scene,
    destroy() {
      if (interval) window.clearInterval(interval);
      if (timeout) window.clearTimeout(timeout);
      river.destroy();
    },
  };
}
