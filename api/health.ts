import { createMembershipIssuerApp } from "../apps/membership-issuer/src/app.js";
import { loadMembershipIssuerRuntime } from "../apps/membership-issuer/src/runtime.js";
import { createVercelIssuerHandler } from "../apps/membership-issuer/src/vercel.js";

const runtime = loadMembershipIssuerRuntime(process.env);
const fetch = createVercelIssuerHandler(
  createMembershipIssuerApp(runtime.issuer),
  "/health",
);

export default { fetch };
