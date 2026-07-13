import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
const root = resolve(new URL("..", import.meta.url).pathname);
const [routes, pages, layout, app] = await Promise.all([
  readFile(join(root, "apps/web/src/routes.ts"), "utf8"),
  readFile(join(root, "apps/web/src/pages.tsx"), "utf8"),
  readFile(join(root, "apps/web/src/Layout.tsx"), "utf8"),
  readFile(join(root, "apps/web/src/App.tsx"), "utf8"),
]);
const requiredRoutes = [
  "/",
  "/community/:slug/forum",
  "/create",
  "/create/:requestId",
  "/docs",
  "/docs/api",
  "/docs/specs",
];
const requiredLabels = [
  "Communities",
  "Zenith forum",
  "Create community",
  "Docs",
];
const requiredCopy = [
  "Choose a community",
  "fixture-only preview",
  "Community access is not connected",
  "View Zenith forum",
  "Fixture only — not submitted",
  "Forum unavailable",
  "Messages, membership, sign-in, and posting are unavailable",
  "No Matrix",
  "connection was attempted",
  "Back to communities",
  "Read the documentation",
  "Community unavailable",
  "Requests unavailable",
  "Request not found",
  "Contract source only",
  "Fixture schemas",
  "Page not found",
];
const failures = [];
for (const value of requiredRoutes)
  if (!routes.includes(`\"${value}\"`)) failures.push(`missing route ${value}`);
for (const value of requiredLabels)
  if (!routes.includes(`label: \"${value}\"`))
    failures.push(`missing navigation label ${value}`);
for (const value of requiredCopy)
  if (!pages.includes(value))
    failures.push(`missing bounded route copy: ${value}`);
for (const value of [
  "<main",
  '<nav aria-label="Primary"',
  "Skip to content",
  "mainRef.current?.focus()",
])
  if (!layout.includes(value))
    failures.push(`missing layout contract ${value}`);
if (!app.includes('path: "*"')) failures.push("missing in-app 404 route");
for (const pattern of [
  /<form\b/i,
  /type=["']submit/i,
  /fetch\s*\(/,
  /localStorage|sessionStorage|document\.cookie|serviceWorker|analytics/i,
  /matrix-js-sdk/i,
])
  if (pattern.test(pages + layout + app))
    failures.push(`forbidden browser surface: ${pattern}`);
if (failures.length)
  throw new Error(`route/claim policy failed:\n${failures.join("\n")}`);
console.log(
  `route/claim policy passed: ${requiredRoutes.length} routes, ${requiredLabels.length} primary links`,
);
