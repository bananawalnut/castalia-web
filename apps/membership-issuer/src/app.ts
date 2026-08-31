import {
  ZENITH_MEMBERSHIP_ENDPOINT_PATH,
  ZENITH_MEMBERSHIP_PROTOCOL,
} from "@castalia/membership-contract";
import type { ZenithMembershipIssuer } from "./issuer.js";

const JSON_HEADERS = {
  "access-control-allow-origin": "*",
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
} as const;

export type IssuerHttpRequest = {
  method: string;
  path: string;
  contentType?: string;
  body: Uint8Array;
};

export type IssuerHttpResponse = {
  status: number;
  headers: Readonly<Record<string, string>>;
  body: string;
};

function json(status: number, value: unknown): IssuerHttpResponse {
  return { status, headers: JSON_HEADERS, body: `${JSON.stringify(value)}\n` };
}

export function createMembershipIssuerApp(issuer: ZenithMembershipIssuer) {
  return async (request: IssuerHttpRequest): Promise<IssuerHttpResponse> => {
    if (
      request.method === "OPTIONS" &&
      request.path === ZENITH_MEMBERSHIP_ENDPOINT_PATH
    )
      return {
        status: 204,
        headers: {
          ...JSON_HEADERS,
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-max-age": "600",
        },
        body: "",
      };
    if (request.method === "GET" && request.path === "/health")
      return json(200, {
        status: "ok",
        membershipProtocol: ZENITH_MEMBERSHIP_PROTOCOL,
        issuerId: issuer.issuerId,
        issuerKeyId: issuer.issuerKeyId,
      });
    if (request.path !== ZENITH_MEMBERSHIP_ENDPOINT_PATH)
      return json(404, { error: "not_found" });
    if (request.method !== "POST")
      return json(405, { error: "method_not_allowed" });
    if (request.contentType !== "application/json")
      return json(415, { error: "unsupported_media_type" });
    if (request.body.length === 0 || request.body.length > 4096)
      return json(413, { error: "request_too_large" });
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(
        request.body,
      );
      const credential = await issuer.issue(JSON.parse(text) as unknown);
      return json(200, credential);
    } catch (error) {
      const invalidSignature =
        error instanceof Error &&
        error.message === "membership request signature is invalid";
      return json(invalidSignature ? 401 : 400, {
        error: invalidSignature ? "invalid_signature" : "invalid_request",
      });
    }
  };
}
