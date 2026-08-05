import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const crate = resolve(root, "crates/castalia-wallet-wasm");
const output = resolve(root, "apps/web/src/generated/castalia-wallet-wasm");
const result = spawnSync(
  "wasm-pack",
  ["build", crate, "--target", "web", "--release", "--out-dir", output],
  { cwd: root, stdio: "inherit", env: process.env },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
