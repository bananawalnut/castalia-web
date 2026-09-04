import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
const root = resolve(new URL("..", import.meta.url).pathname);
const [
  routes,
  pageRoutes,
  landing,
  runtime,
  retainedViews,
  chronicle,
  rfcCatalog,
  rfcDocument,
  rfcFixtures,
  tenders,
] = await Promise.all([
  readFile(join(root, "apps/web/src/routes.ts"), "utf8"),
  readFile(join(root, "apps/web/src/page-routes.ts"), "utf8"),
  readFile(join(root, "apps/web/src/landing.ts"), "utf8"),
  readFile(join(root, "apps/web/src/runtime.ts"), "utf8"),
  readFile(join(root, "apps/web/src/retained-views.ts"), "utf8"),
  readFile(join(root, "apps/web/src/chronicle.ts"), "utf8"),
  readFile(join(root, "apps/web/src/rfc-catalog.ts"), "utf8"),
  readFile(join(root, "apps/web/src/rfc-document.ts"), "utf8"),
  readFile(join(root, "apps/web/src/rfcFixtures.ts"), "utf8"),
  readFile(join(root, "apps/web/src/tenders.ts"), "utf8"),
]);
const requiredRoutes = [
  "/",
  "/start",
  "/my-castalia",
  "/profile",
  "/chronicle",
  "/tenders",
  "/rfcs",
  "/docs",
];
const placeholderRoutes = ["/merch"];
const removedRoutes = ["/proposals"];
const requiredLabels = ["Chronicle", "Tenders", "RFC", "Merch", "Docs", "Join"];
const requiredNavigation = ['{ to: "/chronicle", label: "Chronicle" }'];
const requiredCopy = [
  "<h1>Castalia</h1>",
  "an open spring for independent worlds.",
  'href="/start">Start</a>',
  "Landing, Chronicle, Tenders, RFCs, Docs, Join, and the keypair-owned My Castalia home are implemented surfaces",
  "Portable data is the part of Web3 we still owe people",
  "Catalog UI draft",
  "Comment submission is disabled",
  "Bid submission unavailable",
  'kind: "Proposal"',
  "Page not found",
];
const surfaceSource =
  landing +
  runtime +
  retainedViews +
  chronicle +
  rfcCatalog +
  rfcDocument +
  rfcFixtures +
  tenders;
const failures = [];
for (const value of requiredRoutes)
  if (!pageRoutes.includes(`\"${value}\"`))
    failures.push(`missing route ${value}`);
for (const value of requiredLabels)
  if (!routes.includes(`label: \"${value}\"`))
    failures.push(`missing navigation label ${value}`);
for (const value of requiredNavigation)
  if (!routes.includes(value))
    failures.push(`missing navigation contract ${value}`);
for (const value of requiredCopy)
  if (!surfaceSource.includes(value))
    failures.push(`missing bounded route copy: ${value}`);
for (const value of [
  'createElement("main")',
  'aria-label", "Primary"',
  "Skip to content",
  "main.focus({ preventScroll: true })",
])
  if (!runtime.includes(value))
    failures.push(`missing layout contract ${value}`);
for (const value of placeholderRoutes)
  if (pageRoutes.includes(`path: \"${value}\"`))
    failures.push(`placeholder must remain unimplemented: ${value}`);
for (const value of removedRoutes)
  if (routes.includes(value)) failures.push(`removed route returned: ${value}`);
if (!runtime.includes("return notFoundView()"))
  failures.push("missing in-app 404 route");
for (const pattern of [
  /<form\b/i,
  /type=["']submit/i,
  /fetch\s*\(/,
  /localStorage|sessionStorage|document\.cookie|serviceWorker|analytics/i,
  /matrix-js-sdk/i,
])
  if (pattern.test(surfaceSource))
    failures.push(`forbidden browser surface: ${pattern}`);
if (failures.length)
  throw new Error(`route/claim policy failed:\n${failures.join("\n")}`);
console.log(
  `route/claim policy passed: ${requiredRoutes.length} implemented routes, ${placeholderRoutes.length} placeholders, ${removedRoutes.length} removed route, ${requiredLabels.length} primary links`,
);
