import { describe, expect, it } from "vitest";
import { loadMembershipIssuerRuntime } from "../src/runtime.js";

const PKCS8 = Buffer.from(
  "302e020100300506032b6570042204209d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
  "hex",
).toString("base64url");

const env = {
  HOST: "127.0.0.1",
  PORT: "3002",
  CASTALIA_ISSUER_KEY_ID: "zenith-membership-issuer-fixture-ed25519-1",
  CASTALIA_ISSUER_PRIVATE_KEY_PKCS8_BASE64URL: PKCS8,
};

describe("membership issuer runtime", () => {
  it("loads an exact process-local signer configuration", () => {
    const runtime = loadMembershipIssuerRuntime(env);
    expect(runtime.port).toBe(3002);
    expect(runtime.issuer.issuerPublicKey).toBe(
      "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    );
  });

  it.each([
    [{ ...env, CASTALIA_ISSUER_UNKNOWN: "x" }, "unknown issuer"],
    [{ ...env, CASTALIA_ISSUER_KEY_ID: "" }, "is required"],
    [{ ...env, HOST: "example.com" }, "HOST"],
    [{ ...env, PORT: "80" }, "PORT"],
  ])("rejects unsafe or incomplete configuration", (input, message) => {
    expect(() => loadMembershipIssuerRuntime(input)).toThrow(message);
  });

  it("rejects the checked-in fixture signer in production", () => {
    expect(() =>
      loadMembershipIssuerRuntime({ ...env, NODE_ENV: "production" }),
    ).toThrow("test fixture");
  });
});
