import type { IssuerHttpRequest, IssuerHttpResponse } from "./app.js";

const MAX_BODY_BYTES = 4096;

export type MembershipIssuerApp = (
  request: IssuerHttpRequest,
) => Promise<IssuerHttpResponse>;

async function boundedBody(request: Request): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      return new Uint8Array(MAX_BODY_BYTES + 1);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export function createVercelIssuerHandler(
  app: MembershipIssuerApp,
  path: "/health" | "/v3/memberships",
) {
  return async (request: Request): Promise<Response> => {
    const body = await boundedBody(request);
    const contentType = request.headers.get("content-type");
    const result = await app({
      method: request.method,
      path,
      ...(contentType === null ? {} : { contentType }),
      body,
    });
    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    });
  };
}
