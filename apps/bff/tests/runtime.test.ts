import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { loadServerEnv, redactForLog } from "../src/runtime.js";

const baseEnv = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: "3001",
  LOG_LEVEL: "info",
  CASTALIA_FIXTURE_MODE: "true",
  CASTALIA_WEB_ORIGIN: "http://127.0.0.1:4173",
};

const requiredHeaders = {
  "content-security-policy":
    "default-src 'self';base-uri 'none';object-src 'none';frame-ancestors 'none';form-action 'self';script-src 'self';style-src 'self';img-src 'self' data:;font-src 'self';connect-src 'self';media-src 'none';worker-src 'self';manifest-src 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

describe("server environment", () => {
  it("accepts only the strict fixture configuration", () => {
    expect(loadServerEnv(baseEnv).fixtureMode).toBe(true);
  });
  it.each([
    [{ ...baseEnv, CASTALIA_FIXTURE_MODE: "false" }, "CASTALIA_FIXTURE_MODE"],
    [{ ...baseEnv, CASTALIA_DATA_MODE: "fixture" }, "unknown application key"],
    [{ ...baseEnv, VITE_SECRET_TOKEN: "canary" }, "browser-visible secret"],
    [{ ...baseEnv, PUBLIC_PASSWORD: "canary" }, "browser-visible secret"],
    [{ ...baseEnv, NEXT_PUBLIC_ADMIN_KEY: "canary" }, "browser-visible secret"],
    [
      { ...baseEnv, CASTALIA_WEB_ORIGIN: "http://example.com/path" },
      "canonical origin",
    ],
    [{ ...baseEnv, CASTALIA_CORS_ORIGINS: "*" }, "canonical origin"],
    [{ ...baseEnv, CASTALIA_CORS_ORIGINS: "null" }, "canonical origin"],
    [
      { ...baseEnv, CASTALIA_REQUEST_ID_HEADER: "x-correlation-id" },
      "CASTALIA_REQUEST_ID_HEADER",
    ],
    [{ ...baseEnv, HOST: "0.0.0.0" }, "HOST"],
    [{ ...baseEnv, PORT: "80" }, "PORT"],
  ])("rejects invalid configuration", (env, message) => {
    expect(() => loadServerEnv(env)).toThrow(message);
  });
});

describe("fixture BFF boundaries", () => {
  it("applies exact security headers and never sets cookies on success and error", async () => {
    const app = buildApp({ env: baseEnv });
    for (const url of ["/health", "/missing"]) {
      const response = await app.inject({ method: "GET", url });
      for (const [name, value] of Object.entries(requiredHeaders))
        expect(response.headers[name]).toBe(value);
      expect(response.headers["set-cookie"]).toBeUndefined();
      expect(response.headers["x-powered-by"]).toBeUndefined();
    }
    await app.close();
  });

  it("permits only fixture session/read endpoints", async () => {
    const app = buildApp({ env: baseEnv });
    expect(
      (await app.inject({ method: "GET", url: "/api/v1/session" })).json(),
    ).toEqual({ status: "unavailable", fixtureMode: true });
    expect(
      (await app.inject({ method: "GET", url: "/api/v1/communities" }))
        .statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/community-requests/example-request",
        })
      ).statusCode,
    ).toBe(200);
    for (const request of [
      { method: "POST", url: "/api/v1/communities" },
      { method: "GET", url: "/api/v1/messages" },
      { method: "GET", url: "/api/v1/login" },
    ] as const)
      expect((await app.inject(request)).statusCode).toBe(404);
    await app.close();
  });

  it("uses exact-origin CORS without credentials", async () => {
    const app = buildApp({
      env: { ...baseEnv, CASTALIA_CORS_ORIGINS: "https://preview.example" },
    });
    const allowed = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "https://preview.example" },
    });
    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "https://preview.example",
    );
    expect(allowed.headers["access-control-allow-credentials"]).toBeUndefined();
    const rejected = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "https://evil.preview.example" },
    });
    expect(rejected.statusCode).toBe(403);
    expect(rejected.headers["access-control-allow-origin"]).toBeUndefined();
    const sameOrigin = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: baseEnv.CASTALIA_WEB_ORIGIN },
    });
    expect(sameOrigin.headers["access-control-allow-origin"]).toBeUndefined();
    await app.close();
  });
});

describe("recursive logging redaction", () => {
  it("keeps allowlisted keys and removes canaries recursively including errors and causes", () => {
    const secret = "CASTALIA_SECRET_CANARY_7f3b";
    const error = new Error(secret, { cause: new Error(secret) });
    const output = JSON.stringify(
      redactForLog({
        event: "request_complete",
        statusCode: 200,
        nested: {
          authorization: secret,
          nestedError: error,
          config: { token: secret },
        },
        error,
        body: secret,
        query: secret,
        cookies: secret,
        participant: secret,
        ip: secret,
      }),
    );
    expect(output).toContain("request_complete");
    expect(output).not.toContain(secret);
    expect(output).not.toContain("authorization");
    expect(output).not.toContain("token");
    expect(output).not.toContain("body");
    expect(output).not.toContain("query");
    expect(output).not.toContain("cookies");
    expect(output).not.toContain("participant");
    expect(output).not.toContain("ip");
  });
});
