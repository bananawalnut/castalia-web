import { spawn, execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createServer } from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";
import { waitForStartup } from "./lib/startup-policy.mjs";
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
async function findCompiled(root, name) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      const found = await findCompiled(path, name);
      if (found) return found;
    } else if (entry.name === name) return path;
  }
  return undefined;
}
const server = await findCompiled(output, "server.js");
const application = await findCompiled(output, "app.js");
if (!server) throw new Error("compiled fixture BFF server not found");
if (!application) throw new Error("compiled fixture BFF application not found");
await symlink(
  fileURLToPath(new URL("../apps/bff/node_modules", import.meta.url)),
  join(output, "node_modules"),
  "dir",
);
// Precondition the compiled dependency graph without starting the product server.
// Every actual BFF launch below still has to reach /health within two seconds.
await new Promise((resolve, reject) => {
  const child = spawn(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `const { buildApp } = await import(${JSON.stringify(pathToFileURL(application).href)}); const app = buildApp(); await app.ready(); await app.close()`,
    ],
    { stdio: "ignore" },
  );
  child.on("error", reject);
  child.on("exit", (code) =>
    code === 0
      ? resolve()
      : reject(new Error(`BFF dependency precondition exited ${code}`)),
  );
});
// Keep compiler teardown and filesystem flushes outside the process-startup samples.
// Every measured sample still launches a fresh compiled BFF process.
await new Promise((resolve) => setTimeout(resolve, 2_000));
async function availablePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const address = probe.address();
  if (address === null || typeof address === "string")
    throw new Error("failed to allocate a loopback startup probe port");
  await new Promise((resolve, reject) =>
    probe.close((error) => (error === undefined ? resolve() : reject(error))),
  );
  return address.port;
}
const samples = [];
const rssMiB = [];
for (let index = 0; index < 21; index += 1) {
  const warmup = index === 0;
  const port = await availablePort();
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
  try {
    const ready = await waitForStartup({
      probe: async ({ signal }) => {
        try {
          const response = await fetch(`http://127.0.0.1:${port}/health`, {
            signal,
          });
          return response.ok;
        } catch {
          return false;
        }
      },
    });
    if (!ready) {
      const label = warmup ? "warm-up" : `sample ${index}`;
      throw new Error(`${label} exceeded 2s probe timeout`);
    }
    if (!warmup) samples.push(performance.now() - started);
    try {
      if (warmup) continue;
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
