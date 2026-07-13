export function validateWorkflowText(text, file) {
  const errors = [];
  if (/pull_request_target/.test(text))
    errors.push(`${file}: pull_request_target is forbidden`);
  if (!/^permissions:\s*\n\s+contents:\s+read\s*$/m.test(text))
    errors.push(`${file}: top-level permissions must be contents: read`);
  if (/permissions:\s+(?:write-all|read-all)/.test(text))
    errors.push(`${file}: broad permissions are forbidden`);
  for (const match of text.matchAll(/uses:\s*([^\s@]+)@([^\s#]+)/g)) {
    if (!/^[0-9a-f]{40}$/.test(match[2]))
      errors.push(`${file}: ${match[1]} must use a full 40-character SHA`);
  }
  for (const block of text
    .split(/\n(?=\s{6}- uses:\s*actions\/checkout@)/)
    .slice(1)) {
    const step = block.split(/\n(?=\s{6}- )/)[0];
    if (!/persist-credentials:\s*false/.test(step))
      errors.push(`${file}: checkout must set persist-credentials: false`);
  }
  const jobsText = text.split(/^jobs:\s*$/m)[1] ?? "";
  const jobMatches = [
    ...jobsText.matchAll(
      /^  ([A-Za-z0-9_-]+):\s*\n([\s\S]*?)(?=^  [A-Za-z0-9_-]+:\s*\n|(?![\s\S]))/gm,
    ),
  ];
  for (const [, job, body] of jobMatches)
    if (!/timeout-minutes:\s*[1-9][0-9]*/.test(body))
      errors.push(`${file}: job ${job} requires a bounded timeout`);
  if (/\$\{\{\s*secrets\./.test(text) && /pull_request:/.test(text))
    errors.push(`${file}: secrets may not be exposed to pull_request code`);
  return errors;
}
