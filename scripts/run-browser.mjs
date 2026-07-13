import { spawn } from "node:child_process";
import { mkdtemp, mkdir } from "node:fs/promises";
import { join } from "node:path";
const base = process.env.CASTALIA_OUTPUT_ROOT ?? process.env.TMPDIR ?? "/tmp";
await mkdir(base, { recursive: true });
const output = await mkdtemp(join(base, "castalia-playwright-"));
const env = {
  ...process.env,
  PLAYWRIGHT_OUTPUT_DIR: join(output, "results"),
  PLAYWRIGHT_REPORT_DIR: join(output, "report"),
  PLAYWRIGHT_BROWSERS_PATH:
    process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(base, "playwright-browsers"),
};
await new Promise((resolve, reject) => {
  const build = spawn("pnpm", ["--filter", "@castalia/ui", "build"], {
    stdio: "inherit",
    env,
  });
  build.on("error", reject);
  build.on("exit", (code) =>
    code === 0
      ? resolve()
      : reject(new Error(`UI prerequisite build exited ${code}`)),
  );
});
const child = spawn("pnpm", ["exec", "playwright", "test"], {
  stdio: "inherit",
  env,
});
child.on("error", (error) => {
  throw error;
});
child.on("exit", (code) => {
  console.log(`browser artifacts: ${output}`);
  process.exitCode = code ?? 1;
});
