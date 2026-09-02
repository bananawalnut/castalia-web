import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const membershipVector = JSON.parse(
  readFileSync(
    new URL(
      "../../docs/vectors/castalia-zenith-membership-v3.vector.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { issuerKeyId: string; issuerPublicKey: string };

export default defineConfig({
  define: {
    __CASTALIA_ZENITH_ISSUER_KEY_ID__: JSON.stringify(
      membershipVector.issuerKeyId,
    ),
    __CASTALIA_ZENITH_ISSUER_PUBLIC_KEY__: JSON.stringify(
      membershipVector.issuerPublicKey,
    ),
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
  },
});
