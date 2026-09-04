import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
const appOrigin = `http://127.0.0.1:${process.env.CASTALIA_BROWSER_PORT ?? "4173"}`;
const zenithMembershipFixture = {
  schema: "castalia.zenith-membership-credential.v3",
  version: 3,
  membershipId:
    "b2409aad97015e17749442377f14acd6ccd9ce804661738e4aa7e860d554d8a9",
  ownerPublicKey:
    "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c",
  status: "active",
  issuerId: "zenith-research",
  issuerKeyId: "zenith-membership-issuer-fixture-ed25519-1",
  signatureSuite: "Ed25519",
  issuerSignature:
    "b4Sf_uSYTxfhQUaF_Arq44IxYNByxKsrUOgmXCB4dEYbfAlJ6to50ZeY_qBbvZYibHO6A4JrIERZ1DBDxSkRBA",
} as const;
const routes = [
  "/",
  "/docs",
  "/start",
  "/my-castalia",
  "/profile",
  "/chronicle",
  "/proposals",
  "/tenders",
  "/tenders/tnd-0001",
  "/rfcs",
  "/merch",
  "/missing",
];
const primary = ["Chronicle", "Tenders", "RFC", "Merch", "Docs", "Join"];
for (const route of routes) {
  test(`${route} has bounded semantics, privacy, responsiveness, and no serious axe findings`, async ({
    page,
  }) => {
    const external: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== appOrigin)
        external.push(request.url());
    });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(route);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Primary"]')).toHaveCount(1);
    const logo = page.locator(".brand-logo");
    await expect(logo).toHaveAttribute("src", "/brand/castalia-crest.svg");
    expect(
      await logo.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link"),
    ).toHaveText(primary);
    const headerBackground = await page
      .locator(".app-header")
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(headerBackground).toContain("rgb(255, 255, 255)");
    expect(headerBackground).not.toContain("rgb(245, 236, 217)");
    const current = page.locator(
      'nav[aria-label="Primary"] [aria-current="page"]',
    );
    const expectedCurrent = [
      "/chronicle",
      "/docs",
      "/rfcs",
      "/tenders",
      "/tenders/tnd-0001",
      "/start",
    ].includes(route)
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

test("account action anchors right and the My Castalia masthead stays compact", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/my-castalia");
  const accountBox = await page
    .locator('[data-account-link="true"]')
    .boundingBox();
  const docsBox = await page.getByRole("link", { name: "Docs" }).boundingBox();
  if (!accountBox || !docsBox)
    throw new Error("navigation geometry unavailable");
  expect(accountBox.x).toBeGreaterThan(0.8 * 1440);
  expect(accountBox.x).toBeGreaterThan(docsBox.x + docsBox.width + 100);
  const headingSize = await page
    .getByRole("heading", { name: "My Castalia" })
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(headingSize).toBeLessThanOrEqual(72);
});

test("Start reports success only after Wallet hands off verified Active membership", async ({
  page,
}) => {
  await page.addInitScript((membership) => {
    Object.defineProperty(window, "castaliaWallet", {
      configurable: true,
      value: {
        kind: "castalia.wallet-provider",
        version: "1",
        membershipJoinProtocol: "castalia.zenith-membership.v3",
        getStatus: () => Promise.resolve({ state: "ready" }),
        createAuthenticationPresentation: () =>
          Promise.resolve({
            format: "castalia.wallet-presentation.v1",
            payload: "legacy-unused",
          }),
        getSubject: () =>
          Promise.resolve({
            subjectId: `did:castalia:member:${membership.ownerPublicKey}`,
            publicKey: membership.ownerPublicKey,
            dreggOwnerPublicKey: membership.ownerPublicKey,
            walletKind: "castalia-dregg",
          }),
        openMembershipFlow: () => {
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("castalia:wallet:membership-flow-ready", {
                detail: {
                  membership,
                },
              }),
            );
          });
          return Promise.resolve({ state: "opened" });
        },
        getMembership: () => Promise.resolve(membership),
      },
    });
  }, zenithMembershipFixture);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/start");
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "My Castalia",
    }),
  ).toHaveAttribute("href", "/my-castalia");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "My Castalia" })
    .click();
  await expect(page).toHaveURL(/\/my-castalia$/);
  await expect(
    page.getByRole("heading", { name: "My Castalia" }),
  ).toBeVisible();
  await expect(page.getByText("KEYPAIR READY")).toBeVisible();
  await page.getByRole("link", { name: "Open wallet options" }).click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByLabel("Membership type")).toHaveCount(0);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.filter(
      (item) => item.impact === "serious" || item.impact === "critical",
    ),
  ).toEqual([]);

  await page.getByRole("button", { name: "Join with extension" }).click();
  await expect(
    page.getByRole("status", { name: "Membership request status" }),
  ).toHaveText("Castalia membership is Active for this Member Key.");
  await expect(
    page.getByRole("button", { name: "Membership active" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", {
      name: "My Castalia",
    }),
  ).toHaveAttribute("href", "/my-castalia");
  expect(await page.context().cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
});

test("pixel night sky preserves a clear subtitle and unconnected Aquarius", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".bitmap-stream__canvas")).toHaveAttribute(
      "data-braid-outside-placed",
      "0",
    );
    await expect(page.locator(".pixel-star")).toHaveCount(48);
    await expect(
      page.locator('[data-constellation="Aquarius"] .pixel-star'),
    ).toHaveCount(13);
    await expect(
      page.locator(
        '[data-constellation="Aquarius"] svg, [data-constellation="Aquarius"] line',
      ),
    ).toHaveCount(0);

    const header = await page.locator(".app-header").boundingBox();
    const title = await page.locator(".bitmap-title").boundingBox();
    expect(header).not.toBeNull();
    expect(title).not.toBeNull();
    expect(
      (title?.y ?? 0) - ((header?.y ?? 0) + (header?.height ?? 0)),
    ).toBeGreaterThanOrEqual(40);

    const subtitle = await page.locator(".bitmap-subheading").boundingBox();
    const stars = await page.locator(".pixel-star").evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left - 5,
          right: rect.right + 5,
          top: rect.top - 5,
          bottom: rect.bottom + 5,
        };
      }),
    );
    expect(subtitle).not.toBeNull();
    expect(
      stars.some(
        (star) =>
          subtitle !== null &&
          star.left < subtitle.x + subtitle.width &&
          star.right > subtitle.x &&
          star.top < subtitle.y + subtitle.height &&
          star.bottom > subtitle.y,
      ),
    ).toBe(false);
  }
});
test("ASCII riverbank actions remain visible and route with the keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".river-source-head")).toHaveCount(0);
  const mobileRiver = page.locator(".bitmap-stream--grid");
  const canvas = mobileRiver.locator(".bitmap-stream__canvas");
  await expect(canvas).toHaveAttribute("data-text-layout", "pretext");
  await expect(canvas).toHaveAttribute("data-braid-branches", "2");
  expect(
    Number(await canvas.getAttribute("data-braid-merge-row")),
  ).toBeGreaterThan(0);
  expect(
    Number(await canvas.getAttribute("data-braid-generated-cells")),
  ).toBeGreaterThan(20);
  expect(
    Number(await canvas.getAttribute("data-grid-columns")),
  ).toBeGreaterThan(0);
  expect(Number(await canvas.getAttribute("data-grid-rows"))).toBeGreaterThan(
    0,
  );
  expect(
    Number(await canvas.getAttribute("data-occupied-cells")),
  ).toBeGreaterThan(500);
  expect(
    Number(await canvas.getAttribute("data-wrapped-cells")),
  ).toBeGreaterThan(0);
  expect(
    Number(await canvas.getAttribute("data-render-milliseconds")),
  ).toBeLessThan(150);
  const occupiedBeforeFlow = await canvas.getAttribute("data-occupied-cells");
  await page.waitForTimeout(420);
  expect(await canvas.getAttribute("data-occupied-cells")).toBe(
    occupiedBeforeFlow,
  );
  expect(
    Number(await canvas.getAttribute("data-braid-mutation-ratio")),
  ).toBeLessThanOrEqual(0.085);
  await expect(page.locator(".bitmap-title")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  const commons = mobileRiver.getByRole("link", { name: "The Commons" });
  const rfc = mobileRiver.getByRole("link", { name: "RFC" });
  const spaces = mobileRiver.getByRole("link", { name: "Spaces" });

  await expect(commons).toBeVisible();
  await expect(rfc).toBeVisible();
  await expect(spaces).toBeVisible();
  await expect(commons).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const cellHeight = Number(await canvas.getAttribute("data-cell-height"));
  expect((await commons.boundingBox())?.height).toBeGreaterThan(cellHeight * 2);
  expect((await commons.boundingBox())?.y).toBeLessThan(
    (await rfc.boundingBox())?.y ?? 0,
  );
  expect((await rfc.boundingBox())?.y).toBeLessThan(
    (await spaces.boundingBox())?.y ?? 0,
  );
  await commons.focus();
  await expect(commons).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/room\/zenith$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Page not found",
  );

  await page.goto("/");
  await page
    .locator(".bitmap-stream--grid")
    .getByRole("link", { name: "RFC" })
    .click();
  await expect(page).toHaveURL(/\/rfcs$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("RFCs");

  await page.goto("/");
  await page
    .locator(".bitmap-stream--grid")
    .getByRole("link", { name: "Spaces" })
    .click();
  await expect(page).toHaveURL(/\/spaces$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Page not found",
  );
});
test("reduced motion keeps the braided river on its canonical static frame", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = page.locator(".bitmap-stream__canvas");
  await expect(canvas).toHaveAttribute("data-braid-branches", "2");
  await page.waitForTimeout(420);
  await expect(canvas).toHaveAttribute("data-braid-mutation-ratio", "0.0000");
});
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
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", {
      name: "Chronicle",
    })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/chronicle$/);
  await expect(page.locator("main")).toBeFocused();
  await expect(page.locator("h1")).toHaveText(
    "Portable data is the part of Web3 we still owe people",
  );
  await expect(page.getByText(".castaway", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Session unavailable")).toHaveCount(0);
});

test("removed legacy pages resolve to the retained not-found surface", async ({
  page,
}) => {
  for (const route of [
    "/room/zenith",
    "/spaces",
    "/spaces/new",
    "/spaces/zenith",
    "/spaces/zenith/rooms/new",
    "/problems",
    "/problems/prb-0001",
    "/proposals",
    "/proposals/prp-0003",
    "/community/zenith/forum",
    "/create",
    "/create/example-request",
    "/docs/api",
    "/docs/specs",
    "/docs/architecture/rfc-exchange",
    "/docs/rfc-exchange/preview",
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
  }
});

test("Docs maps the implemented RFC and tender registries", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs");
  await expect(
    page.getByRole("heading", { name: "Navigation map" }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /RFC \/rfcs/ })).toContainText(
    "Implemented fixture catalog",
  );
  await expect(
    page.getByRole("row", { name: /Tenders \/tenders/ }),
  ).toContainText("Implemented fixture catalog");
});

test("RFCs renders a four-column fixture catalog", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/rfcs");
  await expect(
    page.getByRole("heading", { level: 1, name: "RFCs" }),
  ).toBeVisible();
  await expect(page.getByRole("table", { name: "RFC catalog" })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveText([
    "ID",
    "Name",
    "Type",
    "Publish Date",
  ]);
  await expect(page.getByRole("row")).toHaveCount(5);
  await expect(page.getByRole("row", { name: /RFC-0017/ })).toContainText(
    "Proof-carrying bounded search reports",
  );
  await expect(page.getByRole("row", { name: /RFC-0024/ })).toContainText(
    "Counterexample-first falsification harness",
  );
  await expect(
    page.getByRole("row", { name: /Portable admission/ }),
  ).toContainText("Proposal");
  await expect(
    page.getByRole("row", { name: /Repository-backed/ }),
  ).toContainText("Proposal");
  await expect(page.locator("form, button")).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 720 });
  await expect(page.locator(".rfc-catalog__scroll-hint")).toBeVisible();
  expect(
    await page
      .locator(".rfc-catalog__table-viewport")
      .evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true);
});

test("Tenders exposes read-only opportunities and a fail-closed bid boundary", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/tenders");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tenders" }),
  ).toBeVisible();
  await expect(page.locator(".tender-catalog__entry")).toHaveCount(2);
  await page.getByRole("link", { name: /Implement content-addressed/ }).click();
  await expect(page).toHaveURL(/\/tenders\/tnd-0001$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Implement content-addressed RFC manifests",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Tender → Bid → Award decision → Contract"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Bid submission unavailable" }),
  ).toBeDisabled();
  await expect(page.locator("form, input, textarea, select")).toHaveCount(0);
  await expect(
    page.getByText(/No bid, award decision, or contract was created/),
  ).toBeVisible();

  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("RFC display is academic, format-switchable, and comment submission stays disabled", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/rfcs/rfc-0017");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Proof-carrying bounded search reports",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("tablist", { name: "Document format" }).getByRole("tab"),
  ).toHaveText(["MD", "PDF", "TXT"]);
  await expect(
    page.getByRole("tablist", { name: "RFC metadata" }).getByRole("tab"),
  ).toHaveText(["Contents", "Details", "Comments", "Updates"]);
  await expect(page.locator(".rfc-document__letterhead")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { level: 2, name: "Summary" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "References" }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("tabpanel", { name: "Contents" }).getByRole("link", {
      name: "References",
    }),
  ).toHaveAttribute("href", "#rfc-section-references");
  expect(
    await page.locator(".rfc-document__intro").evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.backgroundColor, style.color];
    }),
  ).toEqual(["rgb(6, 77, 189)", "rgb(255, 253, 245)"]);
  expect(
    await page.locator(".rfc-document__viewer-panel").evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.backgroundColor, style.color];
    }),
  ).toEqual(["rgb(255, 253, 245)", "rgb(23, 27, 34)"]);

  const title = await page.locator(".rfc-document__masthead h1").boundingBox();
  const author = await page.locator(".rfc-document__byline").boundingBox();
  const mastheadMetadata = await page
    .locator(".rfc-document__masthead-meta")
    .boundingBox();
  const paper = await page.locator(".rfc-document__paper").boundingBox();
  const formatTabs = await page
    .getByRole("tablist", { name: "Document format" })
    .boundingBox();
  if (!title || !author || !mastheadMetadata || !paper || !formatTabs)
    throw new Error("missing compact RFC masthead geometry");
  expect(title.height).toBeLessThan(125);
  expect(mastheadMetadata.y).toBeGreaterThan(author.y + author.height - 1);
  expect(formatTabs.y - paper.y).toBeLessThan(650);

  const layout = await page.locator(".rfc-document__layout").boundingBox();
  const rail = await page.locator(".rfc-document__rail").boundingBox();
  if (!layout || !rail) throw new Error("missing RFC layout geometry");
  expect(rail.width / layout.width).toBeGreaterThan(0.28);
  expect(rail.width / layout.width).toBeLessThan(0.38);

  await page.getByRole("tab", { name: "Details" }).click();
  const details = page.getByRole("tabpanel", { name: "Details" });
  await expect(details).toContainText("Date published");
  await expect(details).toContainText("Not recorded");
  await expect(details).toContainText("Authorship proof");
  await expect(details).toContainText("Unavailable in fixture");
  await expect(details.getByRole("link", { name: "PDF" })).toHaveAttribute(
    "download",
    "rfc-0017.pdf",
  );

  await page.getByRole("tab", { name: "PDF" }).click();
  await expect(page.locator('iframe[title="RFC-0017 PDF"]')).toHaveAttribute(
    "src",
    "/rfcs/rfc-0017.pdf",
  );
  await page.getByRole("tab", { name: "MD" }).click();

  const abstract = page.locator("#rfc-section-abstract p");
  const context = await abstract.textContent();
  await abstract.evaluate((element) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  const draft = page.locator(".rfc-comment-draft");
  await expect(draft).toBeVisible();
  await expect(draft).toHaveAttribute("data-comment-context", context ?? "");
  await expect(
    draft.getByRole("button", { name: "Comment submission unavailable" }),
  ).toBeDisabled();

  await page.getByRole("tab", { name: "Comments" }).click();
  await expect(page.getByText(/comment submission is disabled/i)).toBeVisible();
  await expect(
    page
      .getByRole("tabpanel", { name: "Comments" })
      .getByRole("button", { name: "Comment submission unavailable" }),
  ).toBeDisabled();

  await page.setViewportSize({ width: 320, height: 720 });
  const paperMobile = await page.locator(".rfc-document__paper").boundingBox();
  const railMobile = await page.locator(".rfc-document__rail").boundingBox();
  const mastheadMetadataMobile = await page
    .locator(".rfc-document__masthead-meta")
    .boundingBox();
  if (!paperMobile || !railMobile || !mastheadMetadataMobile)
    throw new Error("missing mobile RFC geometry");
  expect(mastheadMetadataMobile.height).toBeLessThan(90);
  expect(railMobile.y).toBeGreaterThan(paperMobile.y + paperMobile.height - 1);
  expect(
    await page
      .getByRole("tablist", { name: "RFC metadata" })
      .evaluate((tablist) => {
        const bounds = tablist.getBoundingClientRect();
        return Array.from(tablist.querySelectorAll('[role="tab"]')).every(
          (tab) => {
            const tabBounds = tab.getBoundingClientRect();
            return (
              tabBounds.left >= bounds.left && tabBounds.right <= bounds.right
            );
          },
        );
      }),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("RFC View opens the fullscreen Markdown viewer with dedicated TOC and comments", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/rfcs/rfc-0017");

  await expect(page.locator(".rfc-document__rendered--markdown")).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "View", exact: true }).click();

  const reader = page.locator(".rfc-document--viewing");
  const sidebar = page.locator(".rfc-document__viewer-sidebar");
  const viewer = page.locator(".rfc-document__viewer-panel");
  await expect(reader).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(page.locator(".rfc-document__rail")).toBeHidden();
  await expect(page.locator(".rfc-document__rendered--markdown")).toHaveCount(
    1,
  );
  await expect(sidebar).toHaveAttribute("data-viewer-kind", "markdown");
  await expect(sidebar).toContainText("Markdown viewer");
  await expect(
    sidebar.getByRole("tablist", { name: "Viewer tools" }).getByRole("tab"),
  ).toHaveText(["Contents", "Comments"]);
  await expect(
    sidebar.getByRole("link", { name: "References" }),
  ).toHaveAttribute("href", "#rfc-section-references");

  const viewport = page.viewportSize();
  const readerBox = await reader.boundingBox();
  if (!viewport || !readerBox)
    throw new Error("missing fullscreen reader geometry");
  expect(readerBox.x).toBe(0);
  expect(readerBox.y).toBe(0);
  expect(Math.abs(readerBox.width - viewport.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(readerBox.height - viewport.height)).toBeLessThanOrEqual(1);
  expect(
    await reader.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.position, style.overflow];
    }),
  ).toEqual(["fixed", "hidden"]);
  expect(
    await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).overflow),
  ).toBe("hidden");
  expect(
    await viewer.evaluate((element) => getComputedStyle(element).overflowY),
  ).toBe("auto");

  const prose = page.locator(".rfc-document__rendered p").first();
  const proseStyle = await prose.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      family: style.fontFamily,
      size: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      width: element.getBoundingClientRect().width,
    };
  });
  expect(proseStyle.family).toContain("ABC Diatype");
  expect(proseStyle.lineHeight / proseStyle.size).toBeGreaterThanOrEqual(1.65);
  expect(proseStyle.width).toBeLessThanOrEqual(800);

  const sidebarBoxBefore = await sidebar.boundingBox();
  await viewer.evaluate((element) => {
    element.scrollTop = 400;
  });
  expect(await viewer.evaluate((element) => element.scrollTop)).toBeGreaterThan(
    0,
  );
  const sidebarBoxAfter = await sidebar.boundingBox();
  expect(sidebarBoxAfter?.y).toBe(sidebarBoxBefore?.y);

  await sidebar.getByRole("tab", { name: "Comments" }).click();
  await expect(
    sidebar.getByRole("button", { name: "Comment submission unavailable" }),
  ).toBeDisabled();
  const viewerA11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    viewerA11y.violations.filter(
      (item) => item.impact === "serious" || item.impact === "critical",
    ),
  ).toEqual([]);
  await sidebar.getByRole("button", { name: "Exit viewer" }).click();
  await expect(page.locator(".rfc-document")).not.toHaveClass(
    /rfc-document--viewing/,
  );
  expect(
    await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).overflow),
  ).not.toBe("hidden");

  await page.getByRole("tab", { name: "PDF" }).click();
  await expect(page.locator(".rfc-document__viewer-toggle")).toBeHidden();
  await page.getByRole("tab", { name: "MD" }).click();
  await page.getByRole("button", { name: "View", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".rfc-document")).not.toHaveClass(
    /rfc-document--viewing/,
  );

  await page.setViewportSize({ width: 320, height: 720 });
  await page.getByRole("button", { name: "View", exact: true }).click();
  const sidebarMobile = await sidebar.boundingBox();
  const viewerMobile = await viewer.boundingBox();
  const readerMobile = await reader.boundingBox();
  if (!sidebarMobile || !viewerMobile || !readerMobile)
    throw new Error("missing mobile fullscreen reader geometry");
  expect(sidebarMobile.y).toBeLessThan(viewerMobile.y);
  expect(sidebarMobile.y + sidebarMobile.height).toBeLessThanOrEqual(
    viewerMobile.y + 1,
  );
  expect(readerMobile.width).toBe(320);
  expect(readerMobile.height).toBe(720);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
