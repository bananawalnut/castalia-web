const defaultBasePath = import.meta.env.BASE_URL;

function normalizeBasePath(basePath: string) {
  const leadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return leadingSlash.endsWith("/") ? leadingSlash : `${leadingSlash}/`;
}

export function routePath(
  pathname: string,
  basePath = defaultBasePath,
): string {
  const normalizedBase = normalizeBasePath(basePath);
  if (normalizedBase === "/") return pathname;
  const prefix = normalizedBase.slice(0, -1);
  if (pathname === prefix || pathname === normalizedBase) return "/";
  return pathname.startsWith(`${prefix}/`)
    ? pathname.slice(prefix.length)
    : pathname;
}

export function deployedPath(
  pathname: string,
  basePath = defaultBasePath,
): string {
  const normalizedBase = normalizeBasePath(basePath);
  if (normalizedBase === "/") return pathname;
  const prefix = normalizedBase.slice(0, -1);
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return pathname;
  if (pathname === "/") return normalizedBase;
  const logicalPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${prefix}${logicalPath}`;
}
