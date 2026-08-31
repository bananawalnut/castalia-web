import { createZenithMembershipIssuer } from "./issuer.js";

const issuerKeys = new Set([
  "CASTALIA_ISSUER_KEY_ID",
  "CASTALIA_ISSUER_PRIVATE_KEY_PKCS8_BASE64URL",
]);

function required(
  input: Record<string, string | undefined>,
  key: string,
): string {
  const value = input[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}

export function loadMembershipIssuerRuntime(
  input: Record<string, string | undefined>,
) {
  for (const key of Object.keys(input)) {
    if (key.startsWith("CASTALIA_ISSUER_") && !issuerKeys.has(key))
      throw new Error(`unknown issuer configuration key: ${key}`);
  }
  const host = input.HOST ?? "127.0.0.1";
  if (!new Set(["127.0.0.1", "::1", "0.0.0.0"]).has(host))
    throw new Error("HOST must be a loopback or all-interface bind address");
  const portText = input.PORT ?? "3002";
  if (!/^[0-9]+$/u.test(portText))
    throw new Error("PORT must be an integer from 1024 through 65535");
  const port = Number(portText);
  if (port < 1024 || port > 65535)
    throw new Error("PORT must be an integer from 1024 through 65535");
  const issuer = createZenithMembershipIssuer({
    issuerKeyId: required(input, "CASTALIA_ISSUER_KEY_ID"),
    privateKeyPkcs8Base64url: required(
      input,
      "CASTALIA_ISSUER_PRIVATE_KEY_PKCS8_BASE64URL",
    ),
  });
  if (
    input.NODE_ENV === "production" &&
    (issuer.issuerKeyId === "zenith-membership-issuer-fixture-ed25519-1" ||
      issuer.issuerPublicKey ===
        "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a")
  )
    throw new Error(
      "production issuer must not use the Zenith test fixture key",
    );
  return {
    host,
    port,
    issuer,
  };
}
