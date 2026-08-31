import { createServer } from "node:http";
import { createMembershipIssuerApp } from "./app.js";
import { loadMembershipIssuerRuntime } from "./runtime.js";

const runtime = loadMembershipIssuerRuntime(process.env);
const app = createMembershipIssuerApp(runtime.issuer);

createServer((request, response) => {
  void (async () => {
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of request) {
      const bytes = Buffer.from(chunk);
      length += bytes.length;
      if (length > 4096) {
        response.writeHead(413, { "content-type": "application/json" });
        response.end('{"error":"request_too_large"}\n');
        return;
      }
      chunks.push(bytes);
    }
    const result = await app({
      method: request.method ?? "",
      path: new URL(request.url ?? "/", "http://localhost").pathname,
      ...(request.headers["content-type"] === undefined
        ? {}
        : { contentType: request.headers["content-type"] }),
      body: Buffer.concat(chunks),
    });
    response.writeHead(result.status, result.headers);
    response.end(result.body);
  })().catch(() => {
    response.writeHead(500, { "content-type": "application/json" });
    response.end('{"error":"internal_error"}\n');
  });
}).listen(runtime.port, runtime.host);
