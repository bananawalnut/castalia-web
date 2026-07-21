function counts(report) {
  const vulnerabilities = report?.metadata?.vulnerabilities;
  if (typeof vulnerabilities !== "object" || vulnerabilities === null) {
    throw new Error("dependency scanner unavailable or report malformed");
  }
  const result = {};
  for (const severity of ["moderate", "high", "critical"]) {
    const value = Number(vulnerabilities[severity] ?? 0);
    if (!Number.isInteger(value) || value < 0)
      throw new Error("dependency report malformed");
    result[severity] = value;
  }
  return result;
}

export function evaluateAudit(report, exceptions, now = new Date()) {
  const summary = counts(report);
  if (summary.high > 0 || summary.critical > 0)
    throw new Error("high or critical dependency vulnerability found");
  if (summary.moderate === 0) return summary;
  const advisories = Object.entries(report.advisories ?? {}).filter(
    ([, item]) => item?.severity === "moderate",
  );
  if (advisories.length !== summary.moderate)
    throw new Error("moderate vulnerability report malformed");
  for (const [advisory] of advisories) {
    const exception = exceptions.find(
      (item) => String(item.advisory) === advisory,
    );
    if (!exception?.url || !/^https:\/\//.test(exception.url))
      throw new Error(`moderate advisory ${advisory} lacks linked exception`);
    const expires = new Date(`${exception.expires}T23:59:59Z`);
    if (Number.isNaN(expires.valueOf()) || expires < now)
      throw new Error(`moderate advisory ${advisory} exception expired`);
  }
  return summary;
}
