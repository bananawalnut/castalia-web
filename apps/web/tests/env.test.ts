import { describe, expect, it } from "vitest";
import { loadBrowserEnv } from "../src/env.js";

describe("browser environment", () => {
  it("accepts an HTTPS Castalia wallet installer URL", () => {
    expect(
      loadBrowserEnv({
        VITE_APP_ENV: "test",
        VITE_FIXTURE_MODE: "true",
        VITE_CASTALIA_WALLET_INSTALL_URL:
          "https://chromewebstore.google.com/detail/castalia/example",
      }).walletInstallUrl,
    ).toBe("https://chromewebstore.google.com/detail/castalia/example");
  });

  it("accepts a canonical Control origin and public audience", () => {
    const env = loadBrowserEnv({
      VITE_APP_ENV: "test",
      VITE_FIXTURE_MODE: "true",
      VITE_CASTALIA_CONTROL_BASE_URL: "https://control.castalia.example",
      VITE_CASTALIA_CONTROL_AUDIENCE: "castalia-control-production",
    });
    expect(env.controlBaseUrl).toBe("https://control.castalia.example");
    expect(env.controlAudience).toBe("castalia-control-production");
  });

  it("rejects a non-HTTPS wallet installer URL", () => {
    expect(() =>
      loadBrowserEnv({
        VITE_APP_ENV: "test",
        VITE_FIXTURE_MODE: "true",
        VITE_CASTALIA_WALLET_INSTALL_URL: "javascript:alert(1)",
      }),
    ).toThrow("VITE_CASTALIA_WALLET_INSTALL_URL");
  });

  it("accepts the exact fixture browser keys", () => {
    expect(
      loadBrowserEnv({
        VITE_APP_ENV: "test",
        VITE_BFF_BASE_URL: "",
        VITE_FIXTURE_MODE: "true",
      }).fixtureMode,
    ).toBe(true);
  });
  it.each(["development", "test"])(
    "accepts the %s application environment",
    (appEnv) => {
      expect(
        loadBrowserEnv({
          VITE_APP_ENV: appEnv,
          VITE_FIXTURE_MODE: "true",
        }).appEnv,
      ).toBe(appEnv);
    },
  );
  it("accepts production only without fixture mode", () => {
    const env = loadBrowserEnv({ VITE_APP_ENV: "production" });
    expect(env.appEnv).toBe("production");
    expect(env.fixtureMode).toBe(false);
  });
  it("rejects fixture trust in production", () => {
    expect(() =>
      loadBrowserEnv({
        VITE_APP_ENV: "production",
        VITE_FIXTURE_MODE: "true",
      }),
    ).toThrow("must not be true in production");
  });
  it.each([
    [{ VITE_APP_ENV: "test", VITE_FIXTURE_MODE: "false" }, "VITE_FIXTURE_MODE"],
    [
      {
        VITE_APP_ENV: "test",
        VITE_FIXTURE_MODE: "true",
        VITE_SECRET_KEY: "canary",
      },
      "browser-visible secret",
    ],
    [
      { VITE_APP_ENV: "test", VITE_FIXTURE_MODE: "true", PUBLIC_OTHER: "x" },
      "unknown application key",
    ],
    [
      {
        VITE_APP_ENV: "test",
        VITE_FIXTURE_MODE: "true",
        VITE_BFF_BASE_URL: "https://example.com/path",
      },
      "canonical origin",
    ],
    [
      {
        VITE_APP_ENV: "test",
        VITE_FIXTURE_MODE: "true",
        VITE_CASTALIA_CONTROL_BASE_URL: "http://control.castalia.example",
      },
      "HTTPS outside loopback",
    ],
    [
      {
        VITE_APP_ENV: "test",
        VITE_FIXTURE_MODE: "true",
        VITE_CASTALIA_CONTROL_AUDIENCE: "castalia-control\nother",
      },
      "must be canonical",
    ],
  ])("rejects invalid keys", (env, message) => {
    expect(() => loadBrowserEnv(env)).toThrow(message);
  });
});
