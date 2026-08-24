import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountCastaliaApp } from "../src/runtime.js";

function click(element: Element) {
  element.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true }),
  );
}

describe("vanilla Castalia shell", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    window.history.replaceState(null, "", "/");
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener() {},
        removeEventListener() {},
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mounts canonical navigation and renders the landing without React", () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const app = mountCastaliaApp(root);

    expect(root.querySelectorAll('nav[aria-label="Primary"] a')).toHaveLength(
      5,
    );
    expect(
      Array.from(root.querySelectorAll('nav[aria-label="Primary"] a')).map(
        (link) => link.textContent,
      ),
    ).toEqual(["Chronicle", "Tenders", "RFC", "Merch", "Docs"]);
    expect(
      root.querySelector<HTMLImageElement>(".brand-logo")?.getAttribute("src"),
    ).toBe("/brand/castalia-crest.svg");
    expect(root.querySelector("h1")?.textContent).toBe("Castalia");
    expect(root.querySelectorAll(".pixel-star")).toHaveLength(48);
    expect(root.querySelectorAll(".river-grid-action")).toHaveLength(3);
    expect(
      root.querySelector(".bitmap-stream__canvas")?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(root.querySelector(".river-source-head")).toBeNull();
    expect(root.querySelector(".bitmap-stream__art--desktop")).toBeNull();
    expect(
      root.querySelector<HTMLAnchorElement>(".bitmap-start-cta")?.pathname,
    ).toBe("/start");

    app.destroy();
  });

  it("uses history routing, focuses main, and keeps placeholders on the 404 surface", () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const app = mountCastaliaApp(root);

    const chronicle = root.querySelector<HTMLAnchorElement>(
      'nav[aria-label="Primary"] a[href="/chronicle"]',
    );
    if (!chronicle) throw new Error("missing Chronicle link");
    click(chronicle);
    expect(window.location.pathname).toBe("/chronicle");
    expect(root.querySelector("h1")?.textContent).toBe("Page not found");
    expect(document.activeElement).toBe(root.querySelector("main"));

    app.navigate("/docs");
    expect(root.querySelector("h1")?.textContent).toBe("Documentation");

    app.destroy();
  });

  it("renders the Start flow and delegates wallet creation to the extension", async () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const openMembershipFlow = vi.fn(() =>
      Promise.resolve({ state: "opened" as const }),
    );
    const provider = {
      kind: "castalia.wallet-provider" as const,
      version: "1" as const,
      membershipJoinProtocol: "castalia.permissionless-membership.v2" as const,
      openMembershipFlow,
      getStatus: () => Promise.resolve({ state: "ready" as const }),
      createAuthenticationPresentation: vi.fn(),
      getSubject: () =>
        Promise.resolve({
          subjectId: "did:castalia:member:test",
          publicKey: "public-key",
          dreggOwnerPublicKey: "52".repeat(32),
          walletKind: "castalia-dregg" as const,
        }),
      requestMembershipPresentation: vi.fn(),
      getMembership: vi.fn(() =>
        Promise.resolve({
          cellId: "44".repeat(32),
          status: "active" as const,
          generation: 0,
          changedAt: 0,
          lastReceiptHash: "55".repeat(32),
        }),
      ),
    };
    const providerState: { current: typeof provider | undefined } = {
      current: undefined,
    };
    const app = mountCastaliaApp(root, {
      walletInstallUrl:
        "https://chromewebstore.google.com/detail/castalia/example",
      getWalletProvider: () => providerState.current,
    });

    app.navigate("/start");
    expect(root.querySelector("h1")?.textContent).toBe("Start");
    expect(
      root.querySelector<HTMLAnchorElement>(".start-flow__cta")?.textContent,
    ).toBe("Join now");
    providerState.current = provider;
    await vi.waitFor(() => {
      expect(
        root.querySelector<HTMLButtonElement>("button.start-flow__cta")
          ?.textContent,
      ).toBe("Join Castalia");
    });
    app.destroy();

    const installedApp = mountCastaliaApp(root, {
      walletInstallUrl: "",
      getWalletProvider: () => provider,
    });
    installedApp.navigate("/start");
    const becomeMember =
      root.querySelector<HTMLButtonElement>(".start-flow__cta");
    if (!becomeMember) throw new Error("missing Join Castalia button");
    window.dispatchEvent(
      new CustomEvent("castalia:wallet:membership-flow-ready"),
    );
    expect(provider.getMembership).not.toHaveBeenCalled();
    click(becomeMember);
    await vi.waitFor(() => {
      expect(openMembershipFlow).toHaveBeenCalledOnce();
    });

    window.dispatchEvent(
      new CustomEvent("castalia:wallet:membership-flow-ready", {
        detail: {
          membership: {
            cellId: "44".repeat(32),
            status: "active",
            generation: 0,
            changedAt: 0,
            lastReceiptHash: "55".repeat(32),
          },
        },
      }),
    );
    await vi.waitFor(() => {
      expect(root.querySelector('[role="status"]')?.textContent).toContain(
        "Castalia membership is Active",
      );
    });
    expect(root.textContent).not.toMatch(/^Member$/m);
    expect(provider.getMembership).not.toHaveBeenCalled();
    expect(becomeMember.textContent).toBe("Membership active");
    window.dispatchEvent(
      new CustomEvent("castalia:wallet:membership-flow-ready"),
    );
    expect(provider.getMembership).not.toHaveBeenCalled();
    expect(
      Array.from(root.querySelectorAll('[role="log"] li')).map((entry) =>
        entry.textContent.trim(),
      ),
    ).toEqual([
      "Wallet extension detected.",
      "Opening the extension-owned wallet flow.",
      "Member Key ready. Dregg issuance completed by Wallet.",
      "Accepting Wallet's verified membership result.",
      "Member-owned Castalia membership verified Active.",
    ]);
    installedApp.destroy();
  });

  it("blocks a stale Wallet build before opening a non-issuing Join flow", () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const openMembershipFlow = vi.fn(() =>
      Promise.resolve({ state: "opened" as const }),
    );
    const staleProvider = {
      kind: "castalia.wallet-provider" as const,
      version: "1" as const,
      openMembershipFlow,
      getStatus: () => Promise.resolve({ state: "ready" as const }),
      createAuthenticationPresentation: vi.fn(),
      getMembership: vi.fn(),
    };
    const app = mountCastaliaApp(root, {
      walletInstallUrl: "",
      getWalletProvider: () => staleProvider,
    });

    app.navigate("/start");

    expect(root.querySelector("button.start-flow__cta")).toBeNull();
    expect(root.querySelector('[role="status"]')?.textContent).toContain(
      "Wallet update required",
    );
    expect(root.textContent).toContain(
      "Reload the unpacked Castalia Wallet extension, then refresh this page.",
    );
    expect(openMembershipFlow).not.toHaveBeenCalled();
    app.destroy();
  });

  it("reports a post-issuance verification error without falsely claiming nothing was issued", async () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const provider = {
      kind: "castalia.wallet-provider" as const,
      version: "1" as const,
      membershipJoinProtocol: "castalia.permissionless-membership.v2" as const,
      openMembershipFlow: () => Promise.resolve({ state: "opened" as const }),
      getStatus: () => Promise.resolve({ state: "ready" as const }),
      createAuthenticationPresentation: vi.fn(),
      getMembership: vi.fn(() =>
        Promise.reject(new Error("origin not approved: http://127.0.0.1:4173")),
      ),
    };
    const app = mountCastaliaApp(root, {
      walletInstallUrl: "",
      getWalletProvider: () => provider,
    });
    app.navigate("/start");
    const becomeMember =
      root.querySelector<HTMLButtonElement>(".start-flow__cta");
    if (!becomeMember) throw new Error("missing Join Castalia button");
    click(becomeMember);
    await vi.waitFor(() => {
      expect(becomeMember.disabled).toBe(true);
    });

    // Compatibility path for a previously built Wallet that emitted no detail.
    window.dispatchEvent(
      new CustomEvent("castalia:wallet:membership-flow-ready"),
    );

    await vi.waitFor(() => {
      expect(root.querySelector('[role="status"]')?.textContent).toContain(
        "origin not approved: http://127.0.0.1:4173",
      );
    });
    expect(root.querySelector('[role="status"]')?.textContent).toContain(
      "may already exist",
    );
    expect(root.querySelector('[role="status"]')?.textContent).not.toContain(
      "No membership was issued",
    );
    app.destroy();
  });

  it("fails closed when the compatibility membership summary is not exact v2", async () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const provider = {
      kind: "castalia.wallet-provider" as const,
      version: "1" as const,
      membershipJoinProtocol: "castalia.permissionless-membership.v2" as const,
      openMembershipFlow: () => Promise.resolve({ state: "opened" as const }),
      getStatus: () => Promise.resolve({ state: "ready" as const }),
      createAuthenticationPresentation: vi.fn(),
      getMembership: vi.fn(() =>
        Promise.resolve({
          cellId: "44".repeat(32),
          status: "active" as const,
          generation: 0,
          changedAt: 1,
          lastReceiptHash: "55".repeat(32),
        }),
      ),
    };
    const app = mountCastaliaApp(root, {
      walletInstallUrl: "",
      getWalletProvider: () => provider,
    });
    app.navigate("/start");
    const becomeMember =
      root.querySelector<HTMLButtonElement>(".start-flow__cta");
    if (!becomeMember) throw new Error("missing Join Castalia button");
    click(becomeMember);
    await vi.waitFor(() => {
      expect(becomeMember.disabled).toBe(true);
    });

    window.dispatchEvent(
      new CustomEvent("castalia:wallet:membership-flow-ready"),
    );

    await vi.waitFor(() => {
      expect(root.querySelector('[role="status"]')?.textContent).toContain(
        "non-canonical membership summary",
      );
    });
    expect(becomeMember.textContent).toBe("Try again");
    expect(root.textContent).not.toContain(
      "Castalia membership is Active for this Member Key.",
    );
    app.destroy();
  });

  it("renders the RFC catalog as a four-column fixture table", () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const app = mountCastaliaApp(root);

    app.navigate("/rfcs");

    expect(root.querySelector("h1")?.textContent).toBe("RFCs");
    expect(
      Array.from(root.querySelectorAll(".rfc-catalog__table thead th")).map(
        (cell) => cell.textContent,
      ),
    ).toEqual(["ID", "Name", "Type", "Publish Date"]);
    expect(root.querySelectorAll(".rfc-catalog__table tr")).toHaveLength(5);
    expect(root.textContent).toContain("RFC-0017");
    expect(root.textContent).toContain("Proof-carrying bounded search reports");
    expect(root.textContent).toContain("RFC-0024");
    expect(root.textContent).toContain("Portable admission receipt viewer");
    expect(root.textContent).toContain("Repository-backed RFC index");
    expect(
      Array.from(root.querySelectorAll(".rfc-catalog__table tbody tr")).filter(
        (row) => row.textContent.includes("Proposal"),
      ),
    ).toHaveLength(2);
    expect(root.textContent).not.toContain("PRP-");
    expect(
      root.querySelector<HTMLAnchorElement>(
        '.rfc-catalog__table a[href="/rfcs/rfc-0017"]',
      ),
    ).not.toBeNull();
    expect(root.querySelector(".rfc-catalog__scroll-hint")?.textContent).toBe(
      "Scroll horizontally to view all four columns →",
    );
    expect(root.querySelectorAll("form, button")).toHaveLength(0);
    expect(
      root
        .querySelector<HTMLAnchorElement>(
          'nav[aria-label="Primary"] a[href="/rfcs"]',
        )
        ?.getAttribute("aria-current"),
    ).toBe("page");

    app.destroy();
  });

  it("renders tenders as read-only contract opportunities with unavailable bidding", () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const app = mountCastaliaApp(root);

    app.navigate("/tenders");
    expect(root.querySelector("h1")?.textContent).toBe("Tenders");
    expect(root.querySelectorAll(".tender-catalog__entry")).toHaveLength(2);
    expect(root.textContent).toContain("TND-0001");
    expect(root.textContent).toContain("Open for bids");
    expect(
      root
        .querySelector<HTMLAnchorElement>(
          'nav[aria-label="Primary"] a[href="/tenders"]',
        )
        ?.getAttribute("aria-current"),
    ).toBe("page");

    app.navigate("/tenders/tnd-0001");
    expect(root.querySelector("h1")?.textContent).toBe(
      "Implement content-addressed RFC manifests",
    );
    expect(root.textContent).toContain(
      "Tender → Bid → Award decision → Contract",
    );
    expect(
      root.querySelector<HTMLButtonElement>(".tender-viewer__bid")?.disabled,
    ).toBe(true);
    expect(root.textContent).toContain(
      "No bid, award decision, or contract was created",
    );
    expect(root.querySelector("form, input, textarea, select")).toBeNull();

    app.navigate("/proposals");
    expect(root.querySelector("h1")?.textContent).toBe("Page not found");

    app.destroy();
  });

  it("renders an academic RFC display with metadata tabs and format viewers", () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const app = mountCastaliaApp(root);

    app.navigate("/rfcs/rfc-0017");

    expect(root.querySelector("h1")?.textContent).toBe(
      "Proof-carrying bounded search reports",
    );
    expect(root.querySelector(".rfc-document__letterhead")).toBeNull();
    const masthead = root.querySelector(".rfc-document__masthead");
    expect(masthead?.textContent).toContain("Castalia / Request for Comments");
    expect(masthead?.textContent).toContain("By agent:cedar-07");
    expect(masthead?.textContent).toContain("Document IDRFC-0017");
    expect(masthead?.textContent).toContain("Revisionrev-rfc-0017-c");
    expect(masthead?.textContent).toContain("StatusIn review");
    const summary = root.querySelector(".rfc-document__summary");
    expect(summary?.querySelector("h2")?.textContent).toBe("Summary");
    expect(summary?.textContent).toContain("Report the exact input");
    expect(
      root.querySelector(
        ".rfc-document__paper > .rfc-document__intro > .rfc-document__masthead + .rfc-document__summary + .rfc-document__boundary + .rfc-document__format-controls",
      ),
    ).not.toBeNull();
    expect(
      root.querySelector(
        ".rfc-document__paper > .rfc-document__intro + .rfc-document__viewer-panel",
      ),
    ).not.toBeNull();
    expect(
      root.querySelector("#rfc-format-panel")?.getAttribute("tabindex"),
    ).toBe("0");
    expect(root.querySelectorAll("main")).toHaveLength(1);
    expect(
      root.querySelectorAll(".rfc-document__layout > :not([hidden])"),
    ).toHaveLength(2);
    expect(
      Array.from(root.querySelectorAll('[role="tablist"]'))
        .filter((tablist) => !tablist.closest("[hidden]"))
        .map((tablist) =>
          Array.from(tablist.querySelectorAll('[role="tab"]')).map(
            (tab) => tab.textContent,
          ),
        ),
    ).toEqual([
      ["MD", "PDF", "TXT"],
      ["Contents", "Details", "Comments", "Updates"],
    ]);
    expect(root.querySelector("#rfc-section-abstract")?.textContent).toContain(
      "Report the exact input",
    );
    expect(root.querySelector("#rfc-section-references h2")?.textContent).toBe(
      "References",
    );
    expect(
      root.querySelector("#rfc-section-references")?.textContent,
    ).toContain("No wikilinked references are recorded in this fixture");
    expect(root.querySelector("#rfc-rail-panel")?.textContent).toContain(
      "References",
    );
    const details = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ).find((tab) => tab.textContent === "Details");
    if (!details) throw new Error("missing Details tab");
    click(details);
    expect(root.querySelector("#rfc-rail-panel")?.textContent).toContain(
      "Date publishedNot recorded",
    );
    expect(root.querySelector("#rfc-rail-panel")?.textContent).toContain(
      "Authoragent:cedar-07",
    );
    expect(root.querySelector("#rfc-rail-panel")?.textContent).toContain(
      "Authorship proofUnavailable in fixture",
    );
    expect(root.querySelector("#rfc-rail-panel")?.textContent).toContain(
      "DomainUnspecified",
    );
    expect(root.querySelector("#rfc-rail-panel")?.textContent).toContain(
      "FormatsMarkdown, PDF, Plain text",
    );
    expect(
      root
        .querySelector<HTMLAnchorElement>('a[download$=".md"]')
        ?.getAttribute("href"),
    ).toBe("/rfcs/rfc-0017.md");
    expect(root.querySelectorAll(".rfc-document__download")).toHaveLength(3);

    const comments = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ).find((tab) => tab.textContent === "Comments");
    if (!comments) throw new Error("missing Comments tab");
    click(comments);
    expect(
      root.querySelector(".rfc-document__comment-disabled")?.textContent,
    ).toContain("Comment submission is disabled");
    expect(
      root.querySelector<HTMLButtonElement>(
        ".rfc-document__comment-disabled button",
      )?.disabled,
    ).toBe(true);

    const updates = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ).find((tab) => tab.textContent === "Updates");
    if (!updates) throw new Error("missing Updates tab");
    click(updates);
    expect(root.querySelector("#rfc-rail-panel")?.textContent).toContain(
      "rev-rfc-0017-c",
    );
    expect(root.querySelector("#rfc-rail-panel")?.textContent).toContain(
      "No earlier version history is recorded",
    );
    expect(
      root
        .querySelector<HTMLAnchorElement>(
          'nav[aria-label="Primary"] a[href="/rfcs"]',
        )
        ?.getAttribute("aria-current"),
    ).toBe("page");

    app.destroy();
  });

  it("opens the existing Markdown reader in the generic fullscreen viewer", () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const app = mountCastaliaApp(root);
    app.navigate("/rfcs/rfc-0017");

    const page = root.querySelector<HTMLElement>(".rfc-document");
    const view = root.querySelector<HTMLButtonElement>(
      ".rfc-document__viewer-toggle",
    );
    if (!page || !view) throw new Error("missing viewer controls");
    expect(view.textContent).toBe("View");
    expect(root.textContent).not.toMatch(/\bzen\b/i);
    expect(
      root.querySelectorAll(".rfc-document__rendered--markdown"),
    ).toHaveLength(1);

    click(view);
    expect(page.classList.contains("rfc-document--viewing")).toBe(true);
    expect(
      document.documentElement.classList.contains("rfc-viewer-active"),
    ).toBe(true);
    expect(
      root.querySelectorAll(".rfc-document__rendered--markdown"),
    ).toHaveLength(1);

    const viewerSidebar = root.querySelector<HTMLElement>(
      ".rfc-document__viewer-sidebar",
    );
    expect(viewerSidebar?.hidden).toBe(false);
    expect(viewerSidebar?.dataset.viewerKind).toBe("markdown");
    expect(viewerSidebar?.textContent).toContain("Markdown viewer");
    expect(
      viewerSidebar
        ?.querySelector('[role="tablist"]')
        ?.getAttribute("aria-label"),
    ).toBe("Viewer tools");
    expect(
      Array.from(viewerSidebar?.querySelectorAll('[role="tab"]') ?? []).map(
        (tab) => tab.textContent,
      ),
    ).toEqual(["Contents", "Comments"]);
    expect(viewerSidebar?.textContent).toContain("Abstract");

    const viewerComments = Array.from(
      viewerSidebar?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    ).find((tab) => tab.textContent === "Comments");
    if (!viewerComments) throw new Error("missing viewer Comments tab");
    click(viewerComments);
    expect(
      viewerSidebar?.querySelector(".rfc-document__comment-disabled")
        ?.textContent,
    ).toContain("Comment submission is disabled");

    const exit = viewerSidebar?.querySelector<HTMLButtonElement>(
      ".rfc-document__viewer-exit",
    );
    if (!exit) throw new Error("missing fullscreen Exit viewer control");
    expect(exit.textContent).toBe("Exit viewer");
    click(exit);
    expect(page.classList.contains("rfc-document--viewing")).toBe(false);
    expect(
      document.documentElement.classList.contains("rfc-viewer-active"),
    ).toBe(false);

    const pdf = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ).find((tab) => tab.textContent === "PDF");
    if (!pdf) throw new Error("missing PDF tab");
    click(pdf);
    expect(view.hidden).toBe(true);

    const markdown = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ).find((tab) => tab.textContent === "MD");
    if (!markdown) throw new Error("missing Markdown tab");
    click(markdown);
    click(view);
    page.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(page.classList.contains("rfc-document--viewing")).toBe(false);

    app.destroy();
    expect(
      document.documentElement.classList.contains("rfc-viewer-active"),
    ).toBe(false);
  });

  it("fails closed for an unknown RFC fixture", () => {
    const root = document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("missing test root");
    const app = mountCastaliaApp(root);

    app.navigate("/rfcs/rfc-9999");

    expect(root.querySelector("h1")?.textContent).toBe("RFC not found");
    expect(root.textContent).toContain("No remote lookup occurred");

    app.destroy();
  });
});
