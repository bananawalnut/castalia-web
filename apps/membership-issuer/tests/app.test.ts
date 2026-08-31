import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ZENITH_MEMBERSHIP_ENDPOINT_PATH,
  ZENITH_MEMBERSHIP_REQUEST_SCHEMA,
  ZENITH_MEMBERSHIP_VERSION,
  base64urlFromBytes,
  zenithMembershipJoinTranscript,
} from "@castalia/membership-contract";
import { createMembershipIssuerApp } from "../src/app.js";
import { createZenithMembershipIssuer } from "../src/issuer.js";

const PKCS8_PREFIX = "302e020100300506032b657004220420";
const OWNER_SEED =
  "4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb";
const ISSUER_SEED =
  "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60";

function privateKey(seed: string) {
  return createPrivateKey({
    key: Buffer.from(`${PKCS8_PREFIX}${seed}`, "hex"),
    format: "der",
    type: "pkcs8",
  });
}

function body(): Uint8Array {
  const ownerSpki = createPublicKey(privateKey(OWNER_SEED)).export({
    format: "der",
    type: "spki",
  });
  const ownerPublicKey = ownerSpki.subarray(12).toString("hex");
  return new TextEncoder().encode(
    JSON.stringify({
      schema: ZENITH_MEMBERSHIP_REQUEST_SCHEMA,
      version: ZENITH_MEMBERSHIP_VERSION,
      ownerPublicKey,
      signatureSuite: "Ed25519",
      signature: base64urlFromBytes(
        sign(
          null,
          zenithMembershipJoinTranscript(ownerPublicKey),
          privateKey(OWNER_SEED),
        ),
      ),
    }),
  );
}

function app() {
  return createMembershipIssuerApp(
    createZenithMembershipIssuer({
      issuerKeyId: "zenith-membership-issuer-fixture-ed25519-1",
      privateKeyPkcs8Base64url: Buffer.from(
        `${PKCS8_PREFIX}${ISSUER_SEED}`,
        "hex",
      ).toString("base64url"),
    }),
  );
}

describe("membership issuer HTTP boundary", () => {
  it("exposes only health, preflight, and deterministic issuance without cookies", async () => {
    const handle = app();
    const health = await handle({
      method: "GET",
      path: "/health",
      body: new Uint8Array(),
    });
    expect(health.status).toBe(200);
    expect(health.headers["set-cookie"]).toBeUndefined();
    const issued = await handle({
      method: "POST",
      path: ZENITH_MEMBERSHIP_ENDPOINT_PATH,
      contentType: "application/json",
      body: body(),
    });
    expect(issued.status).toBe(200);
    expect(issued.headers["cache-control"]).toBe("no-store");
    expect(issued.headers["set-cookie"]).toBeUndefined();
    expect(JSON.parse(issued.body)).toMatchObject({
      status: "active",
      version: 3,
    });
    expect(
      (
        await handle({
          method: "GET",
          path: "/invented",
          body: new Uint8Array(),
        })
      ).status,
    ).toBe(404);
  });

  it("fails closed on content type, body bounds, and invalid signatures", async () => {
    const handle = app();
    expect(
      (
        await handle({
          method: "POST",
          path: ZENITH_MEMBERSHIP_ENDPOINT_PATH,
          contentType: "text/plain",
          body: body(),
        })
      ).status,
    ).toBe(415);
    expect(
      (
        await handle({
          method: "POST",
          path: ZENITH_MEMBERSHIP_ENDPOINT_PATH,
          contentType: "application/json",
          body: new Uint8Array(4097),
        })
      ).status,
    ).toBe(413);
    const altered = JSON.parse(new TextDecoder().decode(body())) as Record<
      string,
      unknown
    >;
    altered.ownerPublicKey = "44".repeat(32);
    const rejected = await handle({
      method: "POST",
      path: ZENITH_MEMBERSHIP_ENDPOINT_PATH,
      contentType: "application/json",
      body: new TextEncoder().encode(JSON.stringify(altered)),
    });
    expect(rejected.status).toBe(401);
    expect(JSON.parse(rejected.body)).toEqual({ error: "invalid_signature" });
  });
});
