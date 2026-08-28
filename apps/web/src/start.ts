import { elementFromHtml, escapeHtml, type View } from "./dom.js";
import type { CastaliaWalletProvider } from "./wallet/onboarding.js";

export type StartMembershipSummary = {
  cellId: string;
  status: "pending" | "active" | "suspended" | "revoked" | "expired";
  generation: number;
  changedAt: number;
  lastReceiptHash: string | null;
};

export type StartWalletProvider = CastaliaWalletProvider & {
  readonly membershipJoinProtocol?: "castalia.permissionless-membership.v2";
  openMembershipFlow(): Promise<{ state: "opened" }>;
  getMembership(): Promise<StartMembershipSummary>;
};

export type StartFlowDependencies = {
  walletInstallUrl: string;
  getWalletProvider(): StartWalletProvider | undefined;
};

const HEX32 = /^[0-9a-f]{64}$/u;
const PERMISSIONLESS_JOIN_PROTOCOL = "castalia.permissionless-membership.v2";

function supportsPermissionlessJoin(
  provider: StartWalletProvider | undefined,
): provider is StartWalletProvider & {
  membershipJoinProtocol: typeof PERMISSIONLESS_JOIN_PROTOCOL;
} {
  return provider?.membershipJoinProtocol === PERMISSIONLESS_JOIN_PROTOCOL;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : "Unknown Wallet error";
}

export function membershipFromReadyDetail(
  detail: unknown,
): StartMembershipSummary | null {
  if (typeof detail !== "object" || detail === null) return null;
  const membership = (detail as { membership?: unknown }).membership;
  if (typeof membership !== "object" || membership === null) {
    throw new Error("Wallet readiness event did not contain a membership");
  }
  const value = membership as Partial<StartMembershipSummary>;
  const keys = Object.keys(value).sort();
  if (
    keys.join(",") !== "cellId,changedAt,generation,lastReceiptHash,status" ||
    typeof value.cellId !== "string" ||
    !HEX32.test(value.cellId) ||
    value.status !== "active" ||
    value.generation !== 0 ||
    value.changedAt !== 0 ||
    (value.lastReceiptHash !== null &&
      (typeof value.lastReceiptHash !== "string" ||
        !HEX32.test(value.lastReceiptHash)))
  ) {
    throw new Error("Wallet returned a non-canonical membership summary");
  }
  return value as StartMembershipSummary;
}

export function startView(dependencies: StartFlowDependencies): View {
  let provider = dependencies.getWalletProvider();
  const walletUpdateRequired =
    provider && !supportsPermissionlessJoin(provider);
  const action = walletUpdateRequired
    ? '<p class="start-flow__unavailable" role="status">Wallet update required. Reload the unpacked Castalia Wallet extension, then refresh this page.</p>'
    : provider
      ? '<button class="start-flow__cta" type="button">Join Castalia</button>'
      : dependencies.walletInstallUrl
        ? `<a class="start-flow__cta" href="${escapeHtml(dependencies.walletInstallUrl)}" rel="noreferrer">Join now</a>`
        : '<p class="start-flow__unavailable" role="status">Wallet installer not configured.</p>';
  const explanation = walletUpdateRequired
    ? "This Wallet build predates direct permissionless Dregg membership issuance."
    : provider
      ? "Your wallet will create or unlock your Member Key and issue its membership directly on Dregg."
      : "Install the Castalia wallet to create your private identity.";
  const element = elementFromHtml(
    `<article class="start-flow"><p class="start-flow__eyebrow">Castalia</p><h1>Start</h1><p class="start-flow__lede">Membership begins with a private wallet and a signed request you control.</p><section class="start-flow__step" aria-labelledby="membership-heading"><p class="start-flow__number">01</p><div><h2 id="membership-heading">Become a member</h2><div class="start-flow__action"><p>${explanation}</p>${action}</div></div></section><p class="start-flow__result" role="status" aria-label="Membership request status" hidden></p><section class="start-flow__activity" aria-labelledby="activity-heading"><h2 id="activity-heading">Activity</h2><div role="log" aria-label="Wallet activity" aria-live="polite" aria-relevant="additions"><ol></ol></div></section></article>`,
  );
  const result = element.querySelector<HTMLParagraphElement>(
    ".start-flow__result",
  );
  const activity = element.querySelector<HTMLOListElement>('[role="log"] ol');
  let button = element.querySelector<HTMLButtonElement>(
    "button.start-flow__cta",
  );
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
    appendActivity("Member Key ready. Dregg issuance completed by Wallet.");
    try {
      const detail: unknown =
        event instanceof CustomEvent
          ? (event as CustomEvent<unknown>).detail
          : null;
      const handedOffMembership = membershipFromReadyDetail(detail);
      let membership: StartMembershipSummary;
      if (handedOffMembership) {
        appendActivity("Accepting Wallet's verified membership result.");
        membership = handedOffMembership;
      } else {
        if (!current) throw new Error("Wallet provider is unavailable");
        appendActivity("Reading and verifying the issued membership cell.");
        const fallbackMembership = membershipFromReadyDetail({
          membership: await current.getMembership(),
        });
        if (!fallbackMembership) {
          throw new Error("Wallet did not return a membership summary");
        }
        membership = fallbackMembership;
      }
      if (
        membership.status !== "active" ||
        membership.generation !== 0 ||
        !HEX32.test(membership.cellId)
      )
        throw new Error("Wallet did not return canonical Active membership");
      result.hidden = false;
      membershipIssued = true;
      onboardingRunning = false;
      result.textContent = "Castalia membership is Active for this Member Key.";
      if (button) {
        button.disabled = true;
        button.textContent = "Membership active";
      }
      appendActivity("Member-owned Castalia membership verified Active.");
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
    button = element.querySelector<HTMLButtonElement>("button.start-flow__cta");
    button?.addEventListener("click", onOpenClick);
  };
  const onOpenClick = () => {
    void onOpen();
  };
  const onReadyEvent = (event: Event) => {
    void onReady(event);
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
        if (!supportsPermissionlessJoin(detected)) {
          appendActivity("Wallet extension update required.");
          actionContainer.innerHTML =
            '<p>This Wallet build predates direct permissionless Dregg membership issuance.</p><p class="start-flow__unavailable" role="status">Wallet update required. Reload the unpacked Castalia Wallet extension, then refresh this page.</p>';
          return;
        }
        appendActivity("Wallet extension detected.");
        actionContainer.innerHTML =
          '<p>Your wallet will create or unlock your Member Key and issue its membership directly on Dregg.</p><button class="start-flow__cta" type="button">Join Castalia</button>';
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
      if (providerTimer !== undefined) window.clearInterval(providerTimer);
      window.removeEventListener(
        "castalia:wallet:membership-flow-ready",
        onReadyEvent,
      );
    },
  };
}
