import { spawn } from "node:child_process";
import { gzipSync } from "node:zlib";
import { mkdtemp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
const limit = {
  initialJs: 150 * 1024,
  css: 30 * 1024,
  initialTotal: 180 * 1024,
  lazy: 100 * 1024,
  allJs: 300 * 1024,
  webMs: 45_000,
  bffMs: 30_000,
  turboMs: 75_000,
};
const base = process.env.CASTALIA_OUTPUT_ROOT ?? process.env.TMPDIR ?? "/tmp";
await mkdir(base, { recursive: true });
const output = await mkdtemp(join(base, "castalia-build-budgets-"));
async function run(label, args, ceiling, extraEnv = {}) {
  const started = performance.now();
  await new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, {
      stdio: "inherit",
      env: {
        ...process.env,
        ...extraEnv,
        TURBO_TELEMETRY_DISABLED: "1",
      },
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} exited ${code}`)),
    );
  });
  const ms = performance.now() - started;
  if (ms > ceiling)
    throw new Error(`${label} ${ms.toFixed(1)}ms exceeds ${ceiling}ms`);
  return ms;
}
async function walk(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(path)));
    else output.push(path);
  }
  return output;
}
const web = join(output, "web");
const bff = join(output, "bff");
await run(
  "workspace prerequisite build",
  ["--filter", "@castalia/ui", "--filter", "@castalia/contracts", "build"],
  limit.bffMs,
);
const webMs = await run(
  "web build",
  [
    "--filter",
    "@castalia/web",
    "exec",
    "vite",
    "build",
    "--outDir",
    web,
    "--emptyOutDir",
  ],
  limit.webMs,
  { VITE_APP_ENV: "production", VITE_FIXTURE_MODE: "true" },
);
const bffMs = await run(
  "BFF build",
  [
    "--filter",
    "@castalia/bff",
    "exec",
    "tsc",
    "-p",
    "tsconfig.build.json",
    "--outDir",
    bff,
  ],
  limit.bffMs,
);
const turboMs = await run(
  "clean Turbo build",
  [
    "exec",
    "turbo",
    "run",
    "build",
    "--force",
    "--cache-dir",
    join(output, "turbo-cache"),
  ],
  limit.turboMs,
);
const assets = await walk(web);
const sizes = [];
for (const file of assets.filter((file) => /\.(?:js|css)$/.test(file)))
  sizes.push({
    file: relative(web, file),
    type: file.endsWith(".css") ? "css" : "js",
    gzip: gzipSync(await readFile(file)).byteLength,
  });
const js = sizes.filter((item) => item.type === "js");
const css = sizes.filter((item) => item.type === "css");
const initialJs = js.reduce((sum, item) => sum + item.gzip, 0);
const cssBytes = css.reduce((sum, item) => sum + item.gzip, 0);
const allJs = initialJs;
const lazy = js.filter(
  (item) =>
    /(?:lazy|chunk|-[A-Za-z0-9_-]{8,})\.js$/.test(item.file) && js.length > 1,
);
const failures = [];
if (initialJs > limit.initialJs) failures.push("initial JS");
if (cssBytes > limit.css) failures.push("CSS");
if (initialJs + cssBytes > limit.initialTotal) failures.push("initial JS+CSS");
if (allJs > limit.allJs) failures.push("all application JS");
for (const item of lazy)
  if (item.gzip > limit.lazy) failures.push(`lazy chunk ${item.file}`);
const result = {
  output,
  milliseconds: { web: webMs, bff: bffMs, turbo: turboMs },
  bytesGzip: {
    initialJs,
    css: cssBytes,
    initialTotal: initialJs + cssBytes,
    allJs,
    maxLazy: Math.max(0, ...lazy.map((item) => item.gzip)),
  },
  assets: sizes,
};
await writeFile(
  join(output, "build-measurements.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));
if (failures.length)
  throw new Error(`performance budget exceeded: ${failures.join(", ")}`);
