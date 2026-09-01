import { describe, expect, it, vi } from "vitest";
import type { MembershipIssuerApp } from "../src/vercel.js";
import { createVercelIssuerHandler } from "../src/vercel.js";

function response(status = 200) {
  return {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    body: `${JSON.stringify({ status: "ok" })}\n`,
  };
}

describe("Vercel membership issuer adapter", () => {
  it("maps the Web request into the bounded issuer application contract", async () => {
    const app = vi.fn<MembershipIssuerApp>(async () => response());
    const handle = createVercelIssuerHandler(app, "/v3/memberships");
    const result = await handle(
      new Request("https://membership.zenith-research.ca/v3/memberships", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"request":"fixture"}',
      }),
    );

    expect(app).toHaveBeenCalledOnce();
    expect(app.mock.calls[0]?.[0]).toEqual({
      method: "POST",
      path: "/v3/memberships",
      contentType: "application/json",
      body: new TextEncoder().encode('{"request":"fixture"}'),
    });
    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    await expect(result.json()).resolves.toEqual({ status: "ok" });
  });

  it("caps oversized bodies before forwarding them to the issuer", async () => {
    const app = vi.fn<MembershipIssuerApp>(async (request) =>
      response(request.body.byteLength > 4096 ? 413 : 200),
    );
    const handle = createVercelIssuerHandler(app, "/v3/memberships");
    const result = await handle(
      new Request("https://membership.zenith-research.ca/v3/memberships", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: new Uint8Array(4097),
      }),
    );

    expect(result.status).toBe(413);
    expect(app.mock.calls[0]?.[0].body).toHaveLength(4097);
  });

  it("binds health to its fixed public path without reading a body", async () => {
    const app = vi.fn<MembershipIssuerApp>(async () => response());
    const handle = createVercelIssuerHandler(app, "/health");
    await handle(
      new Request("https://membership.zenith-research.ca/health", {
        method: "GET",
      }),
    );

    expect(app.mock.calls[0]?.[0]).toEqual({
      method: "GET",
      path: "/health",
      body: new Uint8Array(),
    });
  });
});
