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
  const controller = new AbortController();
  let deadlineTimer;
  const deadline = new Promise((resolve) => {
    deadlineTimer = setTimeout(() => {
      controller.abort();
      resolve(false);
    }, timeout);
  });
  const polling = (async () => {
    while (now() - started < timeout) {
      if (await probe({ signal: controller.signal })) return true;
      const remaining = timeout - (now() - started);
      if (remaining <= 0) return false;
      await sleep(Math.min(interval, remaining));
    }
    return false;
  })();

  try {
    return await Promise.race([polling, deadline]);
  } finally {
    clearTimeout(deadlineTimer);
    controller.abort();
  }
}
