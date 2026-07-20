export function startupProbeTimeout(warmup) {
  return warmup ? 30_000 : 2_000;
}
