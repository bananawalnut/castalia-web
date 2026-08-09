const applicationKey = /^(?:CASTALIA_|VITE_|PUBLIC_|NEXT_PUBLIC_)/;
const browserKey = /^(?:VITE_|PUBLIC_|NEXT_PUBLIC_)/;
const secretKey =
  /(secret|token|password|private|credential|admin|appservice|key)/i;
const allowed = new Set([
  "VITE_APP_ENV",
  "VITE_BFF_BASE_URL",
  "VITE_FIXTURE_MODE",
  "VITE_CASTALIA_WALLET_INSTALL_URL",
]);
const appEnvironments = new Set(["development", "test", "production"] as const);

function canonicalOrigin(value: string): string {
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
    throw new Error("VITE_BFF_BASE_URL must be a canonical origin");
  }
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
  if (input.VITE_FIXTURE_MODE !== "true")
    throw new Error("VITE_FIXTURE_MODE must equal true");
  return {
    appEnv: appEnv as "development" | "test" | "production",
    bffBaseUrl: canonicalOrigin(input.VITE_BFF_BASE_URL ?? ""),
    walletInstallUrl: walletInstallUrl(
      input.VITE_CASTALIA_WALLET_INSTALL_URL ?? "",
    ),
    fixtureMode: true as const,
  };
}
