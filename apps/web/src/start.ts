import { elementFromHtml, escapeHtml, type View } from "./dom.js";
import {
  prepareWalletOnboarding,
  type CastaliaWalletProvider,
} from "./wallet/onboarding.js";
import { validateWalletEnvelopeWithWasm } from "./wallet/wasm-validator.js";

export type StartWalletProvider = CastaliaWalletProvider & {
  openMembershipFlow(): Promise<{ state: "opened" }>;
};

export type StartFlowDependencies = {
  walletInstallUrl: string;
  getWalletProvider(): StartWalletProvider | undefined;
  prepareAdmission(provider: StartWalletProvider): Promise<{ state: string }>;
};

export async function prepareAdmissionRequest(provider: StartWalletProvider) {
  const nowMs = Date.now();
  return prepareWalletOnboarding(
    provider,
    {
      origin: window.location.origin,
      audience: "castalia-control",
      nowMs,
      requestId: crypto.randomUUID(),
      nonce: crypto.randomUUID(),
    },
    validateWalletEnvelopeWithWasm,
  );
}

export function startView(dependencies: StartFlowDependencies): View {
  let provider = dependencies.getWalletProvider();
  const action = provider
    ? '<button class="start-flow__cta" type="button">Become a member</button>'
    : dependencies.walletInstallUrl
      ? `<a class="start-flow__cta" href="${escapeHtml(dependencies.walletInstallUrl)}" rel="noreferrer">Join now</a>`
      : '<p class="start-flow__unavailable" role="status">Wallet installer not configured.</p>';
  const explanation = provider
    ? "The wallet will open securely over this page."
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

  const appendActivity = (message: string) => {
    const entry = document.createElement("li");
    entry.textContent = message;
    activity?.append(entry);
    console.info(`[Castalia Start] ${message}`);
  };
  appendActivity(
    provider ? "Wallet extension detected." : "Wallet extension not detected.",
  );

  const showFailure = () => {
    if (!result) return;
    result.hidden = false;
    result.textContent =
      "The membership request could not continue. No membership was created.";
    appendActivity("Flow stopped. No membership was created.");
  };
  const onReady = async () => {
    const current = dependencies.getWalletProvider();
    if (!current || !result) {
      showFailure();
      return;
    }
    appendActivity("Temporary wallet created. Current site approved.");
    appendActivity("Preparing signed admission presentation.");
    try {
      const admission = await dependencies.prepareAdmission(current);
      result.hidden = false;
      result.textContent =
        admission.state === "pending-server-verification"
          ? "Wallet ready. Awaiting membership service."
          : "The membership request could not continue. No membership was created.";
      if (admission.state === "pending-server-verification") {
        if (button) button.textContent = "Wallet ready";
        appendActivity(
          "Signed presentation ready. Awaiting membership service.",
        );
      } else appendActivity("Flow stopped. No membership was created.");
    } catch {
      showFailure();
    }
  };
  const onOpen = async () => {
    if (!provider || !button) return;
    appendActivity("Opening extension-owned wallet flow.");
    button.disabled = true;
    button.textContent = "Opening wallet…";
    try {
      await provider.openMembershipFlow();
    } catch {
      button.disabled = false;
      button.textContent = "Become a member";
      showFailure();
    }
  };

  const wireButton = () => {
    button = element.querySelector<HTMLButtonElement>("button.start-flow__cta");
    button?.addEventListener("click", onOpenClick);
  };
  const onOpenClick = () => {
    void onOpen();
  };
  const onReadyEvent = () => {
    void onReady();
  };
  wireButton();
  const providerTimer = provider
    ? undefined
    : window.setInterval(() => {
        const detected = dependencies.getWalletProvider();
        if (!detected) return;
        provider = detected;
        appendActivity("Wallet extension detected.");
        window.clearInterval(providerTimer);
        const actionContainer = element.querySelector<HTMLElement>(
          ".start-flow__action",
        );
        if (!actionContainer) return;
        actionContainer.innerHTML =
          '<p>The wallet will open securely over this page.</p><button class="start-flow__cta" type="button">Become a member</button>';
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
