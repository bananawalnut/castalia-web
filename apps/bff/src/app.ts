import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
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
  const fastifyOptions =
    config.requestIdHeader === undefined
      ? { logger: false as const, disableRequestLogging: true }
      : {
          logger: false as const,
          disableRequestLogging: true,
          requestIdHeader: config.requestIdHeader,
        };
  const app = Fastify(fastifyOptions);

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (origin === undefined || origin === config.webOrigin) return;
    if (!config.corsOrigins.includes(origin)) {
      await reply.code(403).send({ error: "origin_not_allowed" });
      return reply;
    }
    reply.header("access-control-allow-origin", origin);
    reply.header("vary", "Origin");
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    for (const [name, value] of Object.entries(securityHeaders))
      reply.header(name, value);
    reply.removeHeader("x-powered-by");
    reply.removeHeader("strict-transport-security");
    reply.removeHeader("set-cookie");
    return payload;
  });

  if (options.log !== undefined) {
    app.addHook("onResponse", async (request, reply) => {
      options.log?.(
        redactForLog({
          event: "request_complete",
          requestId: request.id,
          method: request.method,
          route: request.routeOptions.url,
          statusCode: reply.statusCode,
          durationMs: reply.elapsedTime,
        }),
      );
    });
    app.addHook("onError", async (request, reply) => {
      options.log?.(
        redactForLog({
          event: "request_error",
          requestId: request.id,
          method: request.method,
          route: request.routeOptions.url,
          statusCode: reply.statusCode,
        }),
      );
    });
  }

  app.setNotFoundHandler(async (_request, reply) =>
    reply.code(404).send({ error: "not_found" }),
  );
  app.setErrorHandler(async (_error, _request, reply) =>
    reply.code(500).send({ error: "internal_error" }),
  );

  app.get("/health", () => ({
    status: "ok",
    fixtureMode: true as const,
  }));
  app.get("/api/v1/session", () => ({
    status: "unavailable" as const,
    fixtureMode: true as const,
  }));
  app.get("/api/v1/communities", () => [
    {
      slug: "zenith" as const,
      name: "Zenith" as const,
      availability: "unavailable" as const,
    },
  ]);
  app.get("/api/v1/community-requests/example-request", () => ({
    id: "example-request" as const,
    label: "Example request" as const,
    status: "fixture_only_not_submitted" as const,
    createdAt: "2026-01-01T00:00:00.000Z" as const,
  }));

  return app;
}
