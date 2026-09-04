import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const fixtureKeyId = "zenith-membership-issuer-fixture-ed25519-1";
const fixturePublicKey =
  "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";

export default defineConfig(() => {
  const fixture =
    process.env.VITE_FIXTURE_MODE === "true" || process.env.NODE_ENV === "test";
  const issuerKeyId = fixture
    ? fixtureKeyId
    : process.env.CASTALIA_ZENITH_ISSUER_KEY_ID;
  const issuerPublicKey = fixture
    ? fixturePublicKey
    : process.env.CASTALIA_ZENITH_ISSUER_PUBLIC_KEY;
  if (!issuerKeyId || !issuerPublicKey) {
    throw new Error(
      "production Web build requires the pinned Zenith membership issuer key ID and public key",
    );
  }
  if (!/^[a-z0-9](?:[a-z0-9.-]{0,62}[a-z0-9])?$/u.test(issuerKeyId))
    throw new Error("Zenith membership issuer key ID is not canonical");
  if (!/^[0-9a-f]{64}$/u.test(issuerPublicKey))
    throw new Error("Zenith membership issuer public key is not canonical");
  if (
    !fixture &&
    (issuerKeyId === fixtureKeyId || issuerPublicKey === fixturePublicKey)
  )
    throw new Error(
      "production Web must not trust the Zenith test fixture issuer",
    );
  return {
    base: process.env.CASTALIA_BASE_PATH ?? "/",
    build: { sourcemap: true },
    resolve: {
      alias: {
        "@castalia/castaway-contract": fileURLToPath(
          new URL(
            "../../packages/castaway-contract/src/index.ts",
            import.meta.url,
          ),
        ),
        "@castalia/membership-contract": fileURLToPath(
          new URL(
            "../../packages/membership-contract/src/index.ts",
            import.meta.url,
          ),
        ),
      },
    },
    define: {
      __CASTALIA_ZENITH_ISSUER_KEY_ID__: JSON.stringify(issuerKeyId),
      __CASTALIA_ZENITH_ISSUER_PUBLIC_KEY__: JSON.stringify(issuerPublicKey),
    },
  };
});
