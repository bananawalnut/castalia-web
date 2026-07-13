import { spawn, execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const base = process.env.CASTALIA_OUTPUT_ROOT ?? process.env.TMPDIR ?? "/tmp";
await mkdir(base, { recursive: true });
const output = await mkdtemp(join(base, "castalia-startup-"));
await new Promise((resolve, reject) => {
  const child = spawn(
    "pnpm",
    [
      "--filter",
      "@castalia/bff",
      "exec",
      "tsc",
      "-p",
      "tsconfig.build.json",
      "--outDir",
      output,
    ],
    { stdio: "inherit" },
  );
  child.on("error", reject);
  child.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`BFF compile exited ${code}`)),
  );
});
async function findServer(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      const found = await findServer(path);
      if (found) return found;
    } else if (entry.name === "server.js") return path;
  }
  return undefined;
}
const server = await findServer(output);
if (!server) throw new Error("compiled fixture BFF server not found");
await symlink(
  fileURLToPath(new URL("../apps/bff/node_modules", import.meta.url)),
  join(output, "node_modules"),
  "dir",
);
const samples = [];
const rssMiB = [];
for (let index = 0; index < 20; index += 1) {
  const port = 41000 + index;
  const child = spawn(process.execPath, [server], {
    stdio: "ignore",
    env: {
      ...(process.env.PATH === undefined ? {} : { PATH: process.env.PATH }),
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      PORT: String(port),
      LOG_LEVEL: "error",
      CASTALIA_FIXTURE_MODE: "true",
      CASTALIA_WEB_ORIGIN: "http://127.0.0.1:4173",
    },
  });
  const exited = new Promise((resolve) => child.once("exit", resolve));
  const started = performance.now();
  let ready = false;
  try {
    while (performance.now() - started < 2000) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    if (!ready)
      throw new Error(`sample ${index + 1} exceeded 2s probe timeout`);
    samples.push(performance.now() - started);
    try {
      rssMiB.push(
        Number(
          execFileSync("ps", ["-o", "rss=", "-p", String(child.pid)], {
            encoding: "utf8",
          }).trim(),
        ) / 1024,
      );
    } catch {}
  } finally {
    child.kill("SIGTERM");
    await exited;
  }
}
const sorted = [...samples].sort((a, b) => a - b);
const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
const max = sorted.at(-1);
const maxRss = Math.max(0, ...rssMiB);
const result = {
  samples: samples.length,
  milliseconds: { p95, max, values: samples },
  idleRssMiB: { max: maxRss, warning: maxRss > 128 },
};
await writeFile(
  join(output, "startup-measurements.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));
if (p95 > 500 || max > 1000)
  throw new Error(
    `startup budget exceeded: p95=${p95.toFixed(1)} max=${max.toFixed(1)}`,
  );
