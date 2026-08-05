import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.CASTALIA_BASE_PATH ?? "/",
  build: { sourcemap: true },
});
