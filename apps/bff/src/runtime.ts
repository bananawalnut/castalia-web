const applicationKey = /^(?:CASTALIA_|VITE_|PUBLIC_|NEXT_PUBLIC_)/;
const browserKey = /^(?:VITE_|PUBLIC_|NEXT_PUBLIC_)/;
const secretKey =
  /(secret|token|password|private|credential|admin|appservice|key)/i;
const allowedServerKeys = new Set([
  "NODE_ENV",
  "HOST",
  "PORT",
  "LOG_LEVEL",
  "CASTALIA_FIXTURE_MODE",
  "CASTALIA_WEB_ORIGIN",
  "CASTALIA_CORS_ORIGINS",
  "CASTALIA_REQUEST_ID_HEADER",
]);
const nodeEnvironments = new Set([
  "development",
  "test",
  "production",
] as const);
const logLevels = new Set(["debug", "info", "warn", "error"] as const);
const loopbackHosts = new Set(["127.0.0.1", "::1", "localhost"]);

export interface ServerRuntimeConfig {
  readonly nodeEnv: "development" | "test" | "production";
  readonly host: string;
  readonly port: number;
  readonly logLevel: "debug" | "info" | "warn" | "error";
  readonly fixtureMode: true;
  readonly webOrigin: string;
  readonly corsOrigins: readonly string[];
  readonly requestIdHeader?: "x-request-id";
}

function canonicalOrigin(value: string, key: string): string {
  try {
    const url = new URL(value);
    if (
      value === "null" ||
      value.includes("*") ||
      url.origin !== value ||
      url.username !== "" ||
      url.password !== "" ||
      (url.protocol !== "http:" && url.protocol !== "https:")
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(`${key} must contain exact canonical origin values`);
  }
  return value;
}

function required(
  input: Record<string, string | undefined>,
  key: string,
): string {
  const value = input[key];
  if (value === undefined || value === "")
    throw new Error(`${key} is required`);
  return value;
}

export function loadServerEnv(
  input: Record<string, string | undefined>,
): ServerRuntimeConfig {
  for (const [key, value] of Object.entries(input)) {
    if (
      value === undefined ||
      !applicationKey.test(key) ||
      allowedServerKeys.has(key)
    )
      continue;
    if (browserKey.test(key) && secretKey.test(key))
      throw new Error(`browser-visible secret key rejected: ${key}`);
    throw new Error(`unknown application key: ${key}`);
  }

  const nodeEnv = input.NODE_ENV ?? "development";
  if (!nodeEnvironments.has(nodeEnv as ServerRuntimeConfig["nodeEnv"]))
    throw new Error("NODE_ENV must be development, test, or production");
  const host = input.HOST ?? "127.0.0.1";
  if (!loopbackHosts.has(host)) throw new Error("HOST must be a loopback host");
  const portText = input.PORT ?? "3001";
  if (!/^[0-9]+$/.test(portText))
    throw new Error("PORT must be an integer from 1024 through 65535");
  const port = Number(portText);
  if (port < 1024 || port > 65535)
    throw new Error("PORT must be an integer from 1024 through 65535");
  const logLevel = input.LOG_LEVEL ?? "info";
  if (!logLevels.has(logLevel as ServerRuntimeConfig["logLevel"]))
    throw new Error("LOG_LEVEL must be debug, info, warn, or error");
  if (input.CASTALIA_FIXTURE_MODE !== "true")
    throw new Error("CASTALIA_FIXTURE_MODE must equal true");

  const webOrigin = canonicalOrigin(
    required(input, "CASTALIA_WEB_ORIGIN"),
    "CASTALIA_WEB_ORIGIN",
  );
  const corsOrigins =
    input.CASTALIA_CORS_ORIGINS === undefined
      ? []
      : input.CASTALIA_CORS_ORIGINS.split(",").map((origin) =>
          canonicalOrigin(origin, "CASTALIA_CORS_ORIGINS"),
        );
  if (
    new Set(corsOrigins).size !== corsOrigins.length ||
    corsOrigins.includes(webOrigin)
  ) {
    throw new Error(
      "CASTALIA_CORS_ORIGINS must contain unique non-same-origin exact origins",
    );
  }
  const requestIdHeader = input.CASTALIA_REQUEST_ID_HEADER;
  if (requestIdHeader !== undefined && requestIdHeader !== "x-request-id") {
    throw new Error("CASTALIA_REQUEST_ID_HEADER must equal x-request-id");
  }

  return {
    nodeEnv: nodeEnv as ServerRuntimeConfig["nodeEnv"],
    host,
    port,
    logLevel: logLevel as ServerRuntimeConfig["logLevel"],
    fixtureMode: true,
    webOrigin,
    corsOrigins,
    ...(requestIdHeader === undefined ? {} : { requestIdHeader }),
  };
}

const logKeys = new Set([
  "event",
  "requestId",
  "method",
  "route",
  "statusCode",
  "durationMs",
]);

export type SafeLogEntry = Readonly<Record<string, string | number>>;

export function redactForLog(input: unknown): SafeLogEntry {
  if (typeof input !== "object" || input === null || Array.isArray(input))
    return {};
  const output: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!logKeys.has(key)) continue;
    if (
      typeof value === "string" ||
      (typeof value === "number" && Number.isFinite(value))
    )
      output[key] = value;
  }
  return output;
}
