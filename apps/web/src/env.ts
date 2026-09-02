const applicationKey = /^(?:CASTALIA_|VITE_|PUBLIC_|NEXT_PUBLIC_)/;
const browserKey = /^(?:VITE_|PUBLIC_|NEXT_PUBLIC_)/;
const secretKey =
  /(secret|token|password|private|credential|admin|appservice|key)/i;
const allowed = new Set([
  "VITE_APP_ENV",
  "VITE_BFF_BASE_URL",
  "VITE_FIXTURE_MODE",
  "VITE_CASTALIA_WALLET_INSTALL_URL",
  "VITE_CASTALIA_CONTROL_BASE_URL",
  "VITE_CASTALIA_CONTROL_AUDIENCE",
]);
const appEnvironments = new Set(["development", "test", "production"] as const);

function hasAsciiControl(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function canonicalOrigin(value: string, key: string): string {
  if (value === "") return value;
  try {
    const url = new URL(value);
    if (
      url.origin !== value ||
      url.username !== "" ||
      url.password !== "" ||
      (url.protocol !== "http:" && url.protocol !== "https:")
    )
      throw new Error();
  } catch {
    throw new Error(`${key} must be a canonical origin`);
  }
  return value;
}

function controlOrigin(value: string): string {
  const origin = canonicalOrigin(value, "VITE_CASTALIA_CONTROL_BASE_URL");
  if (origin === "") return origin;
  const url = new URL(origin);
  const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if (url.protocol !== "https:" && !loopback.has(url.hostname))
    throw new Error(
      "VITE_CASTALIA_CONTROL_BASE_URL must use HTTPS outside loopback",
    );
  return origin;
}

function controlAudience(value: string): string {
  if (
    value === "" ||
    value !== value.normalize("NFC") ||
    hasAsciiControl(value)
  )
    throw new Error("VITE_CASTALIA_CONTROL_AUDIENCE must be canonical");
  return value;
}

function walletInstallUrl(value: string): string {
  if (value === "") return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username !== "" || url.password !== "")
      throw new Error();
  } catch {
    throw new Error("VITE_CASTALIA_WALLET_INSTALL_URL must be an HTTPS URL");
  }
  return value;
}

export function loadBrowserEnv(input: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || !applicationKey.test(key) || allowed.has(key))
      continue;
    if (browserKey.test(key) && secretKey.test(key))
      throw new Error(`browser-visible secret key rejected: ${key}`);
    throw new Error(`unknown application key: ${key}`);
  }
  const appEnv = input.VITE_APP_ENV ?? "development";
  if (!appEnvironments.has(appEnv as "development" | "test" | "production"))
    throw new Error("VITE_APP_ENV must be development, test, or production");
  const fixtureMode = input.VITE_FIXTURE_MODE === "true";
  if (
    input.VITE_FIXTURE_MODE !== undefined &&
    input.VITE_FIXTURE_MODE !== "true" &&
    input.VITE_FIXTURE_MODE !== "false"
  )
    throw new Error("VITE_FIXTURE_MODE must be true or false");
  if (appEnv === "production" && fixtureMode)
    throw new Error("VITE_FIXTURE_MODE must not be true in production");
  if (appEnv !== "production" && !fixtureMode)
    throw new Error("VITE_FIXTURE_MODE must equal true outside production");
  return {
    appEnv: appEnv as "development" | "test" | "production",
    bffBaseUrl: canonicalOrigin(
      input.VITE_BFF_BASE_URL ?? "",
      "VITE_BFF_BASE_URL",
    ),
    controlBaseUrl: controlOrigin(input.VITE_CASTALIA_CONTROL_BASE_URL ?? ""),
    controlAudience: controlAudience(
      input.VITE_CASTALIA_CONTROL_AUDIENCE ?? "castalia-control-local",
    ),
    walletInstallUrl: walletInstallUrl(
      input.VITE_CASTALIA_WALLET_INSTALL_URL ?? "",
    ),
    fixtureMode,
  };
}
