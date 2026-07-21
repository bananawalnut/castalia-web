import { buildApp } from "./app.js";
import { loadServerEnv } from "./runtime.js";

const config = loadServerEnv(process.env);
const app = buildApp({ config });
await app.listen({ host: config.host, port: config.port });
