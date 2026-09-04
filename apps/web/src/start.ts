import { elementFromHtml, escapeHtml, type View } from "./dom.js";
import type { CastaliaWalletProvider } from "./wallet/onboarding.js";
import {
  ZENITH_MEMBERSHIP_PROTOCOL,
  verifyZenithMembershipCredential,
  type ZenithMembershipCredentialV3,
} from "@castalia/membership-contract";
import { ZENITH_MEMBERSHIP_TRUST_POLICY } from "./membership/trust-policy.js";
import {
  createWebWalletPanel,
  type WebWalletPanel,
} from "./wallet/web-wallet-panel.js";

export type StartMembershipSummary = ZenithMembershipCredentialV3;

export type StartWalletProvider = CastaliaWalletProvider & {
  readonly membershipJoinProtocol?: typeof ZENITH_MEMBERSHIP_PROTOCOL;
  openMembershipFlow(): Promise<{ state: "opened" }>;
  getMembership(): Promise<StartMembershipSummary>;
};

export type StartFlowDependencies = {
  walletInstallUrl: string;
  membershipIssuerUrl: string;
  getWalletProvider(): StartWalletProvider | undefined;
};

function supportsZenithIssuedJoin(
  provider: StartWalletProvider | undefined,
): provider is StartWalletProvider & {
  membershipJoinProtocol: typeof ZENITH_MEMBERSHIP_PROTOCOL;
} {
  return provider?.membershipJoinProtocol === ZENITH_MEMBERSHIP_PROTOCOL;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : "Unknown Wallet error";
}

async function assertMembershipMatchesWallet(
  provider: StartWalletProvider | undefined,
  membership: StartMembershipSummary,
): Promise<void> {
  if (!provider || typeof provider.getSubject !== "function")
    throw new Error("Wallet cannot bind membership to its current Member Key");
  const subject = await provider.getSubject();
  if (subject.dreggOwnerPublicKey !== membership.ownerPublicKey)
    throw new Error("membership credential owner does not match this Wallet");
}

export function membershipFromReadyDetail(
  detail: unknown,
): Promise<StartMembershipSummary | null> {
  if (typeof detail !== "object" || detail === null)
    return Promise.resolve(null);
  const membership = (detail as { membership?: unknown }).membership;
  if (typeof membership !== "object" || membership === null) {
    return Promise.reject(
      new Error("Wallet readiness event did not contain a membership"),
    );
  }
  return verifyZenithMembershipCredential(
    membership,
    ZENITH_MEMBERSHIP_TRUST_POLICY,
  );
}

export function startView(dependencies: StartFlowDependencies): View {
  let provider = dependencies.getWalletProvider();
  const walletUpdateRequired = provider && !supportsZenithIssuedJoin(provider);
  const extensionAction = walletUpdateRequired
    ? '<p class="start-flow__unavailable" role="status">Wallet update required. Reload the unpacked Castalia Wallet extension, then refresh this page.</p>'
    : provider
      ? '<button class="start-flow__cta" data-extension-wallet type="button">Join with extension</button>'
      : dependencies.walletInstallUrl
        ? `<a class="start-flow__secondary" href="${escapeHtml(dependencies.walletInstallUrl)}" rel="noreferrer">Install the extension</a>`
        : '<p class="start-flow__unavailable" role="status">Wallet installer not configured.</p>';
  const action = `${extensionAction}<button class="start-flow__cta" data-web-wallet type="button">Use this browser</button>`;
  const explanation = walletUpdateRequired
    ? "This Wallet build predates Zenith-issued membership v3."
    : provider
      ? "Your wallet will create or unlock your Member Key and request its signed membership from Zenith."
      : "Create an encrypted wallet in this browser, or install the extension for desktop custody.";
  const element = elementFromHtml(
    `<article class="start-flow"><p class="start-flow__eyebrow">Castalia</p><h1>Start</h1><p class="start-flow__lede">Membership begins with a private wallet and a signed request you control.</p><section class="start-flow__step" aria-labelledby="membership-heading"><p class="start-flow__number">01</p><div><h2 id="membership-heading">Become a member</h2><div class="start-flow__action"><p>${explanation}</p>${action}</div></div></section><div class="start-flow__web-wallet" hidden></div><p class="start-flow__result" role="status" aria-label="Membership request status" hidden></p><section class="start-flow__activity" aria-labelledby="activity-heading"><h2 id="activity-heading">Activity</h2><div role="log" aria-label="Wallet activity" aria-live="polite" aria-relevant="additions"><ol></ol></div></section></article>`,
  );
  const result = element.querySelector<HTMLParagraphElement>(
    ".start-flow__result",
  );
  const activity = element.querySelector<HTMLOListElement>('[role="log"] ol');
  let button = element.querySelector<HTMLButtonElement>(
    "button[data-extension-wallet]",
  );
  let webButton = element.querySelector<HTMLButtonElement>(
    "button[data-web-wallet]",
  );
  const webWalletHost = element.querySelector<HTMLElement>(
    ".start-flow__web-wallet",
  );
  let webWalletPanel: WebWalletPanel | undefined;
  let awaitingWallet = false;
  let onboardingRunning = false;
  let membershipIssued = false;

  const appendActivity = (message: string) => {
    const entry = document.createElement("li");
    entry.textContent = message;
    activity?.append(entry);
    console.info(`[Castalia Start] ${message}`);
  };
  appendActivity(
    walletUpdateRequired
      ? "Wallet extension update required."
      : provider
        ? "Wallet extension detected."
        : "Wallet extension not detected.",
  );

  const showFailure = (error: unknown, membershipMayExist = false) => {
    awaitingWallet = false;
    onboardingRunning = false;
    if (!result) return;
    result.hidden = false;
    const message = errorMessage(error);
    result.textContent = membershipMayExist
      ? `Wallet completed the join step, but Castalia Web could not confirm the membership: ${message}. The membership may already exist; retrying is safe and will not create a duplicate.`
      : `The Wallet flow could not continue: ${message}. No membership was confirmed.`;
    if (button) {
      button.disabled = false;
      button.textContent = "Try again";
    }
    appendActivity(
      membershipMayExist
        ? `Web confirmation failed: ${message}`
        : `Wallet flow stopped: ${message}`,
    );
  };

  const onReady = async (event: Event) => {
    if (!awaitingWallet || onboardingRunning || membershipIssued) return;
    awaitingWallet = false;
    onboardingRunning = true;
    const current = dependencies.getWalletProvider();
    if (!result) {
      showFailure(new Error("Membership status surface is unavailable"), true);
      return;
    }
    appendActivity("Member Key ready. Zenith issuance completed by Wallet.");
    try {
      const detail: unknown =
        event instanceof CustomEvent
          ? (event as CustomEvent<unknown>).detail
          : null;
      const handedOffMembership = await membershipFromReadyDetail(detail);
      let membership: StartMembershipSummary;
      if (handedOffMembership) {
        appendActivity("Accepting Wallet's verified membership result.");
        membership = handedOffMembership;
      } else {
        if (!current) throw new Error("Wallet provider is unavailable");
        appendActivity(
          "Reading and verifying the signed membership credential.",
        );
        const fallbackMembership = await membershipFromReadyDetail({
          membership: await current.getMembership(),
        });
        if (!fallbackMembership) {
          throw new Error("Wallet did not return a membership summary");
        }
        membership = fallbackMembership;
      }
      await assertMembershipMatchesWallet(current, membership);
      result.hidden = false;
      membershipIssued = true;
      onboardingRunning = false;
      result.textContent = "Castalia membership is Active for this Member Key.";
      if (button) {
        button.disabled = true;
        button.textContent = "Membership active";
      }
      appendActivity("Zenith-signed Castalia membership verified Active.");
    } catch (error) {
      showFailure(error, true);
    }
  };

  const onOpen = async () => {
    if (!provider || !button) return;
    awaitingWallet = true;
    button.disabled = true;
    button.textContent = "Opening wallet…";
    appendActivity("Opening the extension-owned wallet flow.");
    try {
      await provider.openMembershipFlow();
    } catch (error) {
      showFailure(error);
    }
  };

  const wireButton = () => {
    button = element.querySelector<HTMLButtonElement>(
      "button[data-extension-wallet]",
    );
    button?.addEventListener("click", onOpenClick);
    webButton = element.querySelector<HTMLButtonElement>(
      "button[data-web-wallet]",
    );
    webButton?.addEventListener("click", onWebWalletClick);
  };
  const onOpenClick = () => {
    void onOpen();
  };
  const onReadyEvent = (event: Event) => {
    void onReady(event);
  };
  const onWebWalletClick = () => {
    if (!webWalletHost || webWalletPanel) return;
    webWalletHost.hidden = false;
    webWalletPanel = createWebWalletPanel({
      issuerOrigin: dependencies.membershipIssuerUrl,
      onMembership(membership) {
        void membershipFromReadyDetail({ membership })
          .then((verified) => {
            if (!verified || !result) return;
            membershipIssued = true;
            result.hidden = false;
            result.textContent =
              "Castalia membership is Active for this browser wallet.";
            appendActivity("Browser wallet membership verified Active.");
          })
          .catch((error: unknown) => {
            showFailure(error, true);
          });
      },
    });
    webWalletHost.replaceChildren(webWalletPanel.element);
    webWalletHost.scrollIntoView({ behavior: "smooth", block: "start" });
    appendActivity("Browser-owned encrypted wallet opened.");
  };
  wireButton();
  const providerTimer = provider
    ? undefined
    : window.setInterval(() => {
        const detected = dependencies.getWalletProvider();
        if (!detected) return;
        provider = detected;
        window.clearInterval(providerTimer);
        const actionContainer = element.querySelector<HTMLElement>(
          ".start-flow__action",
        );
        if (!actionContainer) return;
        if (!supportsZenithIssuedJoin(detected)) {
          appendActivity("Wallet extension update required.");
          actionContainer.innerHTML =
            '<p>This Wallet build predates Zenith-issued membership v3.</p><p class="start-flow__unavailable" role="status">Wallet update required. Reload the unpacked Castalia Wallet extension, then refresh this page.</p>';
          return;
        }
        appendActivity("Wallet extension detected.");
        actionContainer.innerHTML =
          '<p>Your wallet will create or unlock your Member Key and request its signed membership from Zenith.</p><button class="start-flow__cta" data-extension-wallet type="button">Join with extension</button><button class="start-flow__secondary" data-web-wallet type="button">Use this browser</button>';
        wireButton();
      }, 250);
  window.addEventListener(
    "castalia:wallet:membership-flow-ready",
    onReadyEvent,
  );
  return {
    element,
    destroy() {
      button?.removeEventListener("click", onOpenClick);
      webButton?.removeEventListener("click", onWebWalletClick);
      webWalletPanel?.destroy();
      if (providerTimer !== undefined) window.clearInterval(providerTimer);
      window.removeEventListener(
        "castalia:wallet:membership-flow-ready",
        onReadyEvent,
      );
    },
  };
}
