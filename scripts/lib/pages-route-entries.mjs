import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

function validateRoute(route) {
  if (
    typeof route !== "string" ||
    !route.startsWith("/") ||
    route.includes("\\") ||
    route.includes("?") ||
    route.includes("#") ||
    (route !== "/" && route.endsWith("/"))
  ) {
    throw new Error(`unsafe route: ${String(route)}`);
  }

  if (route === "/") return route;

  const segments = route.split("/").slice(1);
  let unsafe = false;
  try {
    unsafe = segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        decodeURIComponent(segment) !== segment,
    );
  } catch {
    unsafe = true;
  }
  if (unsafe) {
    throw new Error(`unsafe route: ${route}`);
  }

  return route;
}

export async function generatePagesRouteEntries({ dist, routes }) {
  const output = resolve(dist);
  const shell = await readFile(join(output, "index.html"), "utf8");
  const normalizedRoutes = [...new Set(routes.map(validateRoute))].sort();

  if (!normalizedRoutes.includes("/")) {
    throw new Error("Pages route manifest must include /");
  }

  for (const route of normalizedRoutes) {
    if (route === "/") continue;
    const directory = join(output, ...route.slice(1).split("/"));
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "index.html"), shell);
  }

  await writeFile(join(output, "404.html"), shell);
  await writeFile(join(output, ".nojekyll"), "");

  return { output, routes: normalizedRoutes };
}
