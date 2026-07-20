export const STARTUP_PROBE_TIMEOUT_MS = 2_000;

const defaultNow = () => performance.now();
const defaultSleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function waitForStartup({
  probe,
  timeout = STARTUP_PROBE_TIMEOUT_MS,
  interval = 10,
  now = defaultNow,
  sleep = defaultSleep,
}) {
  const started = now();
  while (now() - started < timeout) {
    if (await probe()) return true;
    await sleep(interval);
  }
  return false;
}
