import {
  base64urlFromBytes,
  issueZenithMembershipCredential,
  verifyZenithMembershipCredential,
  type ZenithMembershipCredentialV3,
  type ZenithMembershipTrustPolicyV1,
} from "@castalia/membership-contract";
import type { WebWalletIdentity } from "./custody-protocol.js";
import {
  createWebWalletCustodyClient,
  type WebWalletCustodyClient,
} from "./web-wallet-client.js";
import {
  createIndexedDbWebWalletStorage,
  type StoredWebWallet,
  type WebWalletStorage,
} from "./web-wallet-storage.js";

export type WebWalletSnapshot = {
  state: "empty" | "locked" | "ready";
  identity: WebWalletIdentity | null;
  backupConfirmed: boolean;
  membership: ZenithMembershipCredentialV3 | null;
};

export class WebWalletSession {
  private unlocked = false;

  constructor(
    private readonly custody: WebWalletCustodyClient,
    private readonly storage: WebWalletStorage,
    private readonly issuerOrigin: string,
    private readonly trustPolicy: ZenithMembershipTrustPolicyV1,
    private readonly fetchImpl?: typeof fetch,
  ) {}

  async snapshot(): Promise<WebWalletSnapshot> {
    const stored = await this.storage.load();
    let membership: ZenithMembershipCredentialV3 | null = null;
    if (stored?.membership) {
      try {
        membership = await verifyZenithMembershipCredential(
          stored.membership,
          this.trustPolicy,
          stored.identity.ownerPublicKey,
        );
      } catch {
        membership = null;
      }
    }
    return {
      state: stored ? (this.unlocked ? "ready" : "locked") : "empty",
      identity: stored?.identity ?? null,
      backupConfirmed: stored?.backupConfirmed ?? false,
      membership,
    };
  }

  async create(passphrase: string): Promise<{
    identity: WebWalletIdentity;
    recoveryKey: string;
  }> {
    const created = await this.custody.create(passphrase, Date.now());
    await this.saveNewWallet({
      schema: "castalia.web-wallet.v1",
      encryptedCustody: created.encryptedCustody,
      identity: created.identity,
      backupConfirmed: false,
      membership: null,
    });
    this.unlocked = true;
    return { identity: created.identity, recoveryKey: created.recoveryKey };
  }

  async restoreFromRecoveryKey(
    recoveryKey: string,
    passphrase: string,
  ): Promise<WebWalletIdentity> {
    const restored = await this.custody.restoreFromRecoveryKey(
      recoveryKey,
      passphrase,
      Date.now(),
    );
    await this.saveNewWallet({
      schema: "castalia.web-wallet.v1",
      encryptedCustody: restored.encryptedCustody,
      identity: restored.identity,
      backupConfirmed: true,
      membership: null,
    });
    this.unlocked = true;
    return restored.identity;
  }

  async restoreFromEncryptedRecovery(
    encryptedCustody: string,
    passphrase: string,
  ): Promise<WebWalletIdentity> {
    const identity = await this.custody.unlock(encryptedCustody, passphrase);
    await this.saveNewWallet({
      schema: "castalia.web-wallet.v1",
      encryptedCustody,
      identity,
      backupConfirmed: true,
      membership: null,
    });
    this.unlocked = true;
    return identity;
  }

  async unlock(passphrase: string): Promise<WebWalletIdentity> {
    const stored = await this.requireStored();
    const identity = await this.custody.unlock(
      stored.encryptedCustody,
      passphrase,
    );
    if (
      identity.ownerPublicKey !== stored.identity.ownerPublicKey ||
      identity.mlDsa65PublicKeyCommitment !==
        stored.identity.mlDsa65PublicKeyCommitment
    ) {
      await this.custody.lock();
      throw new Error("encrypted wallet does not match its public binding");
    }
    this.unlocked = true;
    return identity;
  }

  async confirmBackup(): Promise<void> {
    const stored = await this.requireStored();
    stored.backupConfirmed = true;
    await this.storage.save(stored);
  }

  async recoveryKey(): Promise<string> {
    this.requireUnlocked();
    return this.custody.recoveryKey();
  }

  async exportEncryptedRecovery(passphrase: string): Promise<string> {
    this.requireUnlocked();
    return this.custody.exportRandomized(passphrase);
  }

  async issueMembership(): Promise<ZenithMembershipCredentialV3> {
    this.requireUnlocked();
    const stored = await this.requireStored();
    if (!stored.backupConfirmed)
      throw new Error("save and confirm a recovery method before joining");
    const identity = await this.custody.identity();
    if (identity.ownerPublicKey !== stored.identity.ownerPublicKey)
      throw new Error("opened wallet does not match its stored identity");
    const signature = await this.custody.signMembershipJoin();
    const options = {
      issuerOrigin: this.issuerOrigin,
      ownerPublicKey: identity.ownerPublicKey,
      signature: base64urlFromBytes(signature),
      trustPolicy: this.trustPolicy,
      ...(this.fetchImpl ? { fetchImpl: this.fetchImpl } : {}),
    };
    const membership = await issueZenithMembershipCredential(options);
    stored.membership = membership;
    await this.storage.save(stored);
    return membership;
  }

  async verifiedMembership(): Promise<ZenithMembershipCredentialV3 | null> {
    const stored = await this.storage.load();
    if (!stored?.membership) return null;
    return verifyZenithMembershipCredential(
      stored.membership,
      this.trustPolicy,
      stored.identity.ownerPublicKey,
    );
  }

  async lock(): Promise<void> {
    await this.custody.lock();
    this.unlocked = false;
  }

  destroy(): void {
    this.custody.destroy();
    this.unlocked = false;
  }

  private requireUnlocked(): void {
    if (!this.unlocked) throw new Error("unlock this browser wallet first");
  }

  private async requireStored(): Promise<StoredWebWallet> {
    const stored = await this.storage.load();
    if (!stored) throw new Error("no browser wallet exists on this device");
    return stored;
  }

  private async saveNewWallet(value: StoredWebWallet): Promise<void> {
    try {
      await this.storage.save(value);
    } catch (error) {
      await this.custody.lock();
      throw error;
    }
  }
}

export function createWebWalletSession(input: {
  issuerOrigin: string;
  trustPolicy: ZenithMembershipTrustPolicyV1;
  fetchImpl?: typeof fetch;
  custody?: WebWalletCustodyClient;
  storage?: WebWalletStorage;
}): WebWalletSession {
  return new WebWalletSession(
    input.custody ?? createWebWalletCustodyClient(),
    input.storage ?? createIndexedDbWebWalletStorage(),
    input.issuerOrigin,
    input.trustPolicy,
    input.fetchImpl,
  );
}
