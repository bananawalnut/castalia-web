import { resolve } from "node:path";
import { PAGE_ROUTES } from "../apps/web/src/page-routes.js";
import { generatePagesRouteEntries } from "./lib/pages-route-entries.mjs";

const dist = resolve(process.argv[2] ?? "apps/web/dist");
const result = await generatePagesRouteEntries({ dist, routes: PAGE_ROUTES });
console.log(
  `Pages route entries generated: ${result.routes.length} routes in ${result.output}`,
);
