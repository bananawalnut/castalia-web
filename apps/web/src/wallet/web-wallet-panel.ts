import { escapeHtml } from "../dom.js";
import { ZENITH_MEMBERSHIP_TRUST_POLICY } from "../membership/trust-policy.js";
import {
  createWebWalletSession,
  type WebWalletSession,
  type WebWalletSnapshot,
} from "./web-wallet-session.js";
import type { ZenithMembershipCredentialV3 } from "@castalia/membership-contract";

export type WebWalletPanel = {
  element: HTMLElement;
  destroy(): void;
};

function message(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "The wallet operation failed";
}

export function createWebWalletPanel(input: {
  issuerOrigin: string;
  session?: WebWalletSession;
  onMembership(membership: ZenithMembershipCredentialV3): void;
  onStateChange?(): void;
}): WebWalletPanel {
  const ownsSession = input.session === undefined;
  const session =
    input.session ??
    createWebWalletSession({
      issuerOrigin: input.issuerOrigin,
      trustPolicy: ZENITH_MEMBERSHIP_TRUST_POLICY,
    });
  const element = document.createElement("section");
  element.className = "web-wallet";
  element.setAttribute("aria-labelledby", "web-wallet-heading");
  let recoveryKey: string | null = null;
  let notice = "";
  let busy = false;

  const render = async () => {
    const snapshot = await session.snapshot();
    element.innerHTML = view(snapshot, recoveryKey, notice, busy);
    wire(snapshot);
  };

  const run = async (operation: () => Promise<void>) => {
    busy = true;
    notice = "Working…";
    for (const control of element.querySelectorAll<HTMLButtonElement>("button"))
      control.disabled = true;
    try {
      await operation();
    } catch (error) {
      notice = message(error);
    } finally {
      busy = false;
      input.onStateChange?.();
      await render();
    }
  };

  const requiredInput = (selector: string): HTMLInputElement => {
    const control = element.querySelector<HTMLInputElement>(selector);
    if (!control) throw new Error("wallet form is unavailable");
    return control;
  };

  const wire = (snapshot: WebWalletSnapshot) => {
    element
      .querySelector<HTMLFormElement>("[data-wallet-create]")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        void run(async () => {
          const passphrase = requiredInput("#web-wallet-create-passphrase");
          const confirmation = requiredInput("#web-wallet-create-confirm");
          if (passphrase.value.length < 12)
            throw new Error("Use a passphrase of at least 12 characters");
          if (passphrase.value !== confirmation.value)
            throw new Error("Passphrases do not match");
          const created = await session.create(passphrase.value);
          passphrase.value = "";
          confirmation.value = "";
          recoveryKey = created.recoveryKey;
          notice = "Wallet created. Save a recovery method before joining.";
        });
      });
    element
      .querySelector<HTMLFormElement>("[data-wallet-restore-key]")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        void run(async () => {
          const key = requiredInput("#web-wallet-recovery-key");
          const passphrase = requiredInput("#web-wallet-restore-passphrase");
          await session.restoreFromRecoveryKey(
            key.value.trim(),
            passphrase.value,
          );
          key.value = "";
          passphrase.value = "";
          recoveryKey = null;
          notice = "Identity restored from the recovery key.";
        });
      });
    element
      .querySelector<HTMLFormElement>("[data-wallet-restore-file]")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        void run(async () => {
          const file = requiredInput("#web-wallet-recovery-file").files?.[0];
          if (!file) throw new Error("Choose a .castalia-recovery file");
          if (file.size > 1_048_576)
            throw new Error("Recovery file exceeds the 1 MiB limit");
          const passphrase = requiredInput("#web-wallet-file-passphrase");
          await session.restoreFromEncryptedRecovery(
            await file.text(),
            passphrase.value,
          );
          passphrase.value = "";
          recoveryKey = null;
          notice = "Identity restored from encrypted recovery.";
        });
      });
    element
      .querySelector<HTMLFormElement>("[data-wallet-unlock]")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        void run(async () => {
          const passphrase = requiredInput("#web-wallet-unlock-passphrase");
          await session.unlock(passphrase.value);
          passphrase.value = "";
          notice = "Browser wallet unlocked for this tab.";
        });
      });
    element
      .querySelector<HTMLButtonElement>("[data-wallet-copy-key]")
      ?.addEventListener("click", () => {
        if (!recoveryKey) return;
        void run(async () => {
          await navigator.clipboard.writeText(recoveryKey ?? "");
          notice = "Recovery key copied. Store it somewhere private.";
        });
      });
    element
      .querySelector<HTMLButtonElement>("[data-wallet-reveal-key]")
      ?.addEventListener("click", () => {
        void run(async () => {
          recoveryKey = await session.recoveryKey();
          notice = "Recovery key revealed. Keep it private.";
        });
      });
    element
      .querySelector<HTMLFormElement>("[data-wallet-export]")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        void run(async () => {
          const passphrase = requiredInput("#web-wallet-export-passphrase");
          const confirmation = requiredInput(
            "#web-wallet-export-passphrase-confirm",
          );
          if (passphrase.value.length < 12)
            throw new Error(
              "Use a recovery passphrase of at least 12 characters",
            );
          if (passphrase.value !== confirmation.value)
            throw new Error("Recovery passphrases do not match");
          const encrypted = await session.exportEncryptedRecovery(
            passphrase.value,
          );
          passphrase.value = "";
          confirmation.value = "";
          const url = URL.createObjectURL(
            new Blob([encrypted], { type: "application/json" }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = `Castalia-Recovery-${String(Date.now())}.castalia-recovery`;
          link.click();
          URL.revokeObjectURL(url);
          notice = "Encrypted recovery downloaded.";
        });
      });
    element
      .querySelector<HTMLInputElement>("[data-wallet-backup-confirm]")
      ?.addEventListener("change", (event) => {
        const control = event.currentTarget as HTMLInputElement;
        if (!control.checked) return;
        void run(async () => {
          await session.confirmBackup();
          recoveryKey = null;
          notice = "Recovery confirmed. You can now join Castalia.";
        });
      });
    element
      .querySelector<HTMLButtonElement>("[data-wallet-join]")
      ?.addEventListener("click", () => {
        void run(async () => {
          const membership = await session.issueMembership();
          notice = "Zenith-signed membership verified and saved.";
          input.onMembership(membership);
        });
      });
    element
      .querySelector<HTMLButtonElement>("[data-wallet-lock]")
      ?.addEventListener("click", () => {
        void run(async () => {
          await session.lock();
          recoveryKey = null;
          notice = "Browser wallet locked.";
        });
      });

    if (snapshot.state === "ready" && snapshot.membership)
      input.onMembership(snapshot.membership);
  };

  const onVisibility = () => {
    if (document.visibilityState !== "hidden") return;
    void session.lock().then(render, () => undefined);
  };
  document.addEventListener("visibilitychange", onVisibility);
  void render().catch((error: unknown) => {
    notice = message(error);
    element.innerHTML = `<p class="web-wallet__notice" role="alert">${escapeHtml(notice)}</p>`;
  });

  return {
    element,
    destroy() {
      document.removeEventListener("visibilitychange", onVisibility);
      if (ownsSession) session.destroy();
    },
  };
}

function view(
  snapshot: WebWalletSnapshot,
  recoveryKey: string | null,
  notice: string,
  busy: boolean,
): string {
  const disabled = busy ? " disabled" : "";
  const status = notice
    ? `<p class="web-wallet__notice" role="status">${escapeHtml(notice)}</p>`
    : "";
  const heading = `<div class="web-wallet__header"><p class="start-flow__eyebrow">Mobile wallet</p><h2 id="web-wallet-heading">Use this browser</h2><p>Your encrypted Dregg-hybrid identity stays in this browser. No account, cookie, or Control approval is created.</p></div>`;
  if (snapshot.state === "empty")
    return `${heading}${status}<div class="web-wallet__columns"><form data-wallet-create><h3>Create a wallet</h3><label>Passphrase<input id="web-wallet-create-passphrase" type="password" minlength="12" autocomplete="new-password" required></label><label>Confirm passphrase<input id="web-wallet-create-confirm" type="password" minlength="12" autocomplete="new-password" required></label><button type="submit"${disabled}>Create private wallet</button></form><div><details><summary>Restore from recovery key</summary><form data-wallet-restore-key><label>Recovery key<textarea id="web-wallet-recovery-key" rows="3" spellcheck="false" required></textarea></label><label>New local passphrase<input id="web-wallet-restore-passphrase" type="password" minlength="12" autocomplete="new-password" required></label><button type="submit"${disabled}>Restore identity</button></form></details><details><summary>Restore encrypted recovery</summary><form data-wallet-restore-file><label>Recovery file<input id="web-wallet-recovery-file" type="file" accept=".castalia-recovery,application/json" required></label><label>Recovery passphrase<input id="web-wallet-file-passphrase" type="password" autocomplete="current-password" required></label><button type="submit"${disabled}>Open recovery</button></form></details></div></div>`;

  const identity = snapshot.identity
    ? `<div class="web-wallet__identity"><span>Member Key</span><code>${escapeHtml(snapshot.identity.ownerPublicKey)}</code><span>Dregg hybrid commitment</span><code>${escapeHtml(snapshot.identity.mlDsa65PublicKeyCommitment)}</code></div>`
    : "";
  if (snapshot.state === "locked")
    return `${heading}${status}${identity}<form data-wallet-unlock><label>Passphrase<input id="web-wallet-unlock-passphrase" type="password" autocomplete="current-password" required></label><button type="submit"${disabled}>Unlock wallet</button></form>`;

  const recovery = recoveryKey
    ? `<section class="web-wallet__recovery"><h3>Save your recovery key now</h3><p>This key restores both Ed25519 and ML-DSA-65 signing authority. Anyone with it controls this identity.</p><code>${escapeHtml(recoveryKey)}</code><button type="button" data-wallet-copy-key${disabled}>Copy recovery key</button></section>`
    : `<button class="web-wallet__quiet" type="button" data-wallet-reveal-key${disabled}>Reveal recovery key</button>`;
  const backup = snapshot.backupConfirmed
    ? '<p class="web-wallet__confirmed">Recovery confirmed</p>'
    : `<label class="web-wallet__check"><input type="checkbox" data-wallet-backup-confirm${disabled}> I stored a recovery method somewhere private</label>`;
  const membership = snapshot.membership
    ? `<p class="web-wallet__membership">Membership active <code>${escapeHtml(snapshot.membership.membershipId)}</code></p>`
    : `<button type="button" data-wallet-join${disabled}${snapshot.backupConfirmed ? "" : " disabled"}>Join Castalia</button>`;
  return `${heading}${status}${identity}${recovery}<div class="web-wallet__actions"><form data-wallet-export><label>Recovery passphrase<input id="web-wallet-export-passphrase" type="password" minlength="12" autocomplete="new-password" required></label><label>Confirm recovery passphrase<input id="web-wallet-export-passphrase-confirm" type="password" minlength="12" autocomplete="new-password" required></label><button type="submit"${disabled}>Download encrypted recovery</button></form>${backup}${membership}<button class="web-wallet__quiet" type="button" data-wallet-lock${disabled}>Lock wallet</button></div>`;
}
