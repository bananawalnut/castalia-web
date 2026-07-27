import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
const routes = [
  "/",
  "/community/zenith/forum",
  "/community/other/forum",
  "/create",
  "/create/example-request",
  "/create/missing",
  "/docs",
  "/docs/api",
  "/docs/specs",
  "/docs/architecture/rfc-exchange",
  "/missing",
];
const primary = ["Communities", "Zenith forum", "Create community", "Docs"];
for (const route of routes) {
  test(`${route} has bounded semantics, privacy, responsiveness, and no serious axe findings`, async ({
    page,
  }) => {
    const external: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== "http://127.0.0.1:4173")
        external.push(request.url());
    });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(route);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Primary"]')).toHaveCount(1);
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link"),
    ).toHaveText(primary);
    const current = page.locator(
      'nav[aria-label="Primary"] [aria-current="page"]',
    );
    const expectedCurrent =
      route === "/" ||
      route === "/create" ||
      route === "/docs" ||
      route === "/community/zenith/forum"
        ? 1
        : 0;
    await expect(current).toHaveCount(expectedCurrent);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.filter(
        (item) => item.impact === "serious" || item.impact === "critical",
      ),
    ).toEqual([]);
    expect(external).toEqual([]);
    expect(await page.context().cookies()).toEqual([]);
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
        serviceWorker:
          "serviceWorker" in navigator &&
          navigator.serviceWorker.controller !== null,
      })),
    ).toEqual({ local: 0, session: 0, serviceWorker: false });
  });
}
test("keyboard navigation, visible focus, route focus, and unavailable controls", async ({
  page,
}) => {
  await page.goto("/");
  for (let index = 0; index < 8; index += 1) {
    if (
      await page
        .locator(".skip-link")
        .evaluate((element) => element === document.activeElement)
    )
      break;
    await page.keyboard.press("Tab");
  }
  await expect(page.locator(".skip-link")).toBeFocused();
  await expect(page.locator(".skip-link")).toHaveCSS("outline-style", "solid");
  await page.getByRole("link", { name: "Create community" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/create$/);
  await expect(page.locator("main")).toBeFocused();
  await expect(page.locator("h1")).toHaveText("Create a community");
  await expect(page.getByLabel("Example name (fixture-only)")).toBeDisabled();
  await expect(page.getByText("Session unavailable")).toBeVisible();
});
