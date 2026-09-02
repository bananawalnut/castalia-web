import { landingView } from "./landing.js";
import { chronicleView } from "./chronicle.js";
import { navigation } from "./routes.js";
import type { View } from "./dom.js";
import { rfcCatalogView } from "./rfc-catalog.js";
import { rfcDocumentView } from "./rfc-document.js";
import { docsView, notFoundView } from "./retained-views.js";
import { tenderCatalogView, tenderViewerView } from "./tenders.js";
import { deployedPath, routePath } from "./base-path.js";
import {
  startView,
  type StartFlowDependencies,
  type StartWalletProvider,
} from "./start.js";

export type CastaliaApp = {
  navigate(path: string): void;
  destroy(): void;
};

type CastaliaAppOptions = Partial<StartFlowDependencies> & {
  /** @deprecated Permissionless Join no longer calls Control. */
  controlBaseUrl?: string;
  /** @deprecated Permissionless Join no longer calls Control. */
  controlAudience?: string;
  /** @deprecated Retained only so older embedders do not fail to compile. */
  membershipServiceAvailable?: boolean;
  /** @deprecated Retained only so older embedders do not fail to compile. */
  completeOnboarding?: unknown;
};

declare global {
  interface Window {
    castaliaWallet?: StartWalletProvider;
  }
}

function route(
  pathname: string,
  startDependencies: StartFlowDependencies,
): View {
  if (pathname === "/") return landingView();
  if (pathname === "/start") return startView(startDependencies);
  if (pathname === "/chronicle") return chronicleView();
  if (pathname === "/tenders") return tenderCatalogView();
  if (pathname.startsWith("/tenders/"))
    return tenderViewerView(
      decodeURIComponent(pathname.slice("/tenders/".length)),
    );
  if (pathname === "/rfcs") return rfcCatalogView();
  if (pathname.startsWith("/rfcs/"))
    return rfcDocumentView(decodeURIComponent(pathname.slice("/rfcs/".length)));
  if (pathname === "/docs") return docsView();
  return notFoundView();
}

function createShell(root: HTMLElement) {
  const shell = document.createElement("div");
  shell.className = "app-layout";
  const skip = document.createElement("a");
  skip.className = "skip-link";
  skip.href = "#main";
  skip.textContent = "Skip to content";
  const header = document.createElement("header");
  header.className = "app-header";
  const headerLeft = document.createElement("div");
  headerLeft.className = "app-header-left";
  const brand = document.createElement("a");
  brand.className = "brand";
  brand.href = deployedPath("/");
  brand.setAttribute("aria-label", "Castalia home");
  const logo = document.createElement("img");
  logo.className = "brand-logo";
  logo.src = deployedPath("/brand/castalia-crest.svg");
  logo.alt = "";
  brand.append(logo);
  const nav = document.createElement("nav");
  nav.className = "app-nav";
  nav.setAttribute("aria-label", "Primary");
  for (const item of navigation) {
    const link = document.createElement("a");
    link.href = deployedPath(item.to);
    link.textContent = item.label;
    nav.append(link);
  }
  headerLeft.append(brand, nav);
  header.append(headerLeft);
  const main = document.createElement("main");
  main.id = "main";
  main.className = "app-main";
  main.tabIndex = -1;
  shell.append(skip, header, main);
  root.replaceChildren(shell);
  return { main, nav };
}

export function mountCastaliaApp(
  root: HTMLElement,
  options: CastaliaAppOptions = {},
): CastaliaApp {
  const { main, nav } = createShell(root);
  let currentView: View | undefined;
  const startDependencies: StartFlowDependencies = {
    walletInstallUrl: options.walletInstallUrl ?? "",
    getWalletProvider:
      options.getWalletProvider ?? (() => window.castaliaWallet),
  };

  const render = () => {
    currentView?.destroy?.();
    const currentPath = routePath(window.location.pathname);
    currentView = route(currentPath, startDependencies);
    main.replaceChildren(currentView.element);
    for (const link of main.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const href = link.getAttribute("href");
      if (href?.startsWith("/") && !href.startsWith("//"))
        link.href = deployedPath(href);
    }
    const navigationPath = currentPath.startsWith("/rfcs/")
      ? "/rfcs"
      : currentPath.startsWith("/tenders/")
        ? "/tenders"
        : currentPath;
    for (const link of nav.querySelectorAll<HTMLAnchorElement>("a")) {
      if (
        ["/chronicle", "/docs", "/rfcs", "/tenders"].includes(navigationPath) &&
        routePath(link.pathname) === navigationPath
      )
        link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    main.focus({ preventScroll: true });
  };

  const navigate = (path: string) => {
    const target = new URL(path, window.location.href);
    const pathname = deployedPath(routePath(target.pathname));
    window.history.pushState(
      null,
      "",
      `${pathname}${target.search}${target.hash}`,
    );
    render();
  };

  const onClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;
    if (!target || target.target || target.hasAttribute("download")) return;
    const href = target.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    const destination = new URL(target.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    event.preventDefault();
    navigate(`${destination.pathname}${destination.search}${destination.hash}`);
  };
  const onPopState = () => {
    render();
  };
  root.addEventListener("click", onClick);
  window.addEventListener("popstate", onPopState);
  render();

  return {
    navigate,
    destroy() {
      currentView?.destroy?.();
      root.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
      root.replaceChildren();
    },
  };
}
