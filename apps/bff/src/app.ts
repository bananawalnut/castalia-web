import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import type {
  FixtureCommunityRequest,
  FixtureSession,
  operations,
} from "@castalia/contracts";
import { createFixtureSynapseUserRegistry } from "@castalia/matrix-client";
import { loadServerEnv, redactForLog } from "./runtime.js";
import type { SafeLogEntry, ServerRuntimeConfig } from "./runtime.js";

const defaultEnv = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: "3001",
  LOG_LEVEL: "info",
  CASTALIA_FIXTURE_MODE: "true",
  CASTALIA_WEB_ORIGIN: "http://127.0.0.1:4173",
};

const securityHeaders = {
  "content-security-policy":
    "default-src 'self';base-uri 'none';object-src 'none';frame-ancestors 'none';form-action 'self';script-src 'self';style-src 'self';img-src 'self' data:;font-src 'self';connect-src 'self';media-src 'none';worker-src 'self';manifest-src 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
} as const;

type HealthResponse =
  operations["getHealth"]["responses"][200]["content"]["application/json"];

const healthFixture = {
  status: "ok",
  fixtureMode: true,
} satisfies HealthResponse;
const sessionFixture = {
  status: "unavailable",
  fixtureMode: true,
} satisfies FixtureSession;
const communityRegistry = createFixtureSynapseUserRegistry([
  {
    userId: "@zenith:fixture.invalid",
    displayName: "Zenith",
    publicCommunity: true,
  },
]);
const requestFixture = {
  id: "example-request",
  label: "Example request",
  status: "fixture_only_not_submitted",
  createdAt: "2026-01-01T00:00:00.000Z",
} satisfies FixtureCommunityRequest;

export interface BuildAppOptions {
  readonly env?: Record<string, string | undefined>;
  readonly config?: ServerRuntimeConfig;
  readonly log?: (entry: SafeLogEntry) => void;
}

function runtimeConfig(options: BuildAppOptions): ServerRuntimeConfig {
  if (options.config !== undefined) return options.config;
  return loadServerEnv(options.env ?? defaultEnv);
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const config = runtimeConfig(options);
  const logger =
    config.nodeEnv === "test"
      ? (false as const)
      : {
          level: config.logLevel,
          redact: {
            paths: [
              "req.headers.authorization",
              "req.headers.cookie",
              "headers.authorization",
              "headers.cookie",
              "body",
              "query",
              "config",
              "err.stack",
              "err.cause",
            ],
            censor: "[REDACTED]",
          },
        };
  const fastifyOptions =
    config.requestIdHeader === undefined
      ? { logger, disableRequestLogging: true }
      : {
          logger,
          disableRequestLogging: true,
          requestIdHeader: config.requestIdHeader,
        };
  const app = Fastify(fastifyOptions);

  app.register(sensible);
  app.register(helmet, { hsts: false });
  app.register(cors, {
    credentials: false,
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["content-type"],
    origin(origin, callback) {
      if (origin === undefined || origin === config.webOrigin) {
        callback(null, false);
        return;
      }
      if (config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(
        Object.assign(new Error("origin_not_allowed"), { statusCode: 403 }),
        false,
      );
    },
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    for (const [name, value] of Object.entries(securityHeaders))
      reply.header(name, value);
    reply.removeHeader("x-powered-by");
    reply.removeHeader("strict-transport-security");
    reply.removeHeader("set-cookie");
    return payload;
  });

  const emit = (entry: unknown) => {
    const safe = redactForLog(entry);
    options.log?.(safe);
    if (config.nodeEnv !== "test") app.log.info(safe);
  };
  app.addHook("onResponse", async (request, reply) => {
    emit({
      event: "request_complete",
      requestId: request.id,
      method: request.method,
      route: request.routeOptions.url,
      statusCode: reply.statusCode,
      durationMs: reply.elapsedTime,
    });
  });
  app.addHook("onError", async (request, reply) => {
    emit({
      event: "request_error",
      requestId: request.id,
      method: request.method,
      route: request.routeOptions.url,
      statusCode: reply.statusCode,
    });
  });

  app.setNotFoundHandler(async (_request, reply) =>
    reply.code(404).send({ error: "not_found" }),
  );
  app.setErrorHandler(async (error, _request, reply) => {
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: unknown }).statusCode
        : undefined;
    const forbidden =
      error instanceof Error &&
      statusCode === 403 &&
      error.message === "origin_not_allowed";
    return reply
      .code(forbidden ? 403 : 500)
      .send({ error: forbidden ? "origin_not_allowed" : "internal_error" });
  });

  app.get("/health", () => healthFixture);
  app.get("/api/v1/session", () => sessionFixture);
  app.get("/api/v1/communities", () => communityRegistry.listCommunities());
  app.get("/api/v1/community-requests/example-request", () => requestFixture);

  return app;
}
