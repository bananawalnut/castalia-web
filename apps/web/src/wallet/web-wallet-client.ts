import type {
  CustodyRequest,
  CustodyResponse,
  WebWalletIdentity,
} from "./custody-protocol.js";

type CreateResult = {
  encryptedCustody: string;
  identity: WebWalletIdentity;
  recoveryKey: string;
};

type RestoreResult = {
  encryptedCustody: string;
  identity: WebWalletIdentity;
};

type CustodyRequestWithoutId = CustodyRequest extends infer Request
  ? Request extends { id: number }
    ? Omit<Request, "id">
    : never
  : never;

export interface WebWalletCustodyClient {
  create(passphrase: string, createdAt: number): Promise<CreateResult>;
  restoreFromRecoveryKey(
    recoveryKey: string,
    passphrase: string,
    createdAt: number,
  ): Promise<RestoreResult>;
  unlock(
    encryptedCustody: string,
    passphrase: string,
  ): Promise<WebWalletIdentity>;
  identity(): Promise<WebWalletIdentity>;
  recoveryKey(): Promise<string>;
  exportRandomized(passphrase: string): Promise<string>;
  sealIdentitySection(contents: string): Promise<string>;
  openIdentitySection(encrypted: string): Promise<string>;
  exportCastaway(
    contents: string,
    passphrase: string,
    exportedAt: number,
  ): Promise<string>;
  importCastaway(encrypted: string, passphrase: string): Promise<string>;
  signMembershipJoin(): Promise<Uint8Array>;
  lock(): Promise<void>;
  destroy(): void;
}

export function createWebWalletCustodyClient(
  worker = new Worker(new URL("./custody-worker.ts", import.meta.url), {
    type: "module",
    name: "castalia-web-wallet-custody",
  }),
): WebWalletCustodyClient {
  let requestId = 0;
  const pending = new Map<
    number,
    { resolve(value: unknown): void; reject(reason: Error): void }
  >();
  const onMessage = (event: MessageEvent<CustodyResponse>) => {
    const response = event.data;
    const handler = pending.get(response.id);
    if (!handler) return;
    pending.delete(response.id);
    if (response.ok) handler.resolve(response.value);
    else handler.reject(new Error(response.error));
  };
  worker.addEventListener("message", onMessage);

  const call = <T>(request: CustodyRequestWithoutId): Promise<T> => {
    const id = ++requestId;
    return new Promise<T>((resolve, reject) => {
      pending.set(id, {
        resolve: (value) => {
          resolve(value as T);
        },
        reject,
      });
      worker.postMessage({ ...request, id });
    });
  };

  return {
    create: (passphrase, createdAt) =>
      call({ operation: "create", passphrase, createdAt }),
    restoreFromRecoveryKey: (recoveryKey, passphrase, createdAt) =>
      call({
        operation: "restore-recovery-key",
        recoveryKey,
        passphrase,
        createdAt,
      }),
    unlock: (encryptedCustody, passphrase) =>
      call({ operation: "unlock", encryptedCustody, passphrase }),
    identity: () => call({ operation: "identity" }),
    recoveryKey: () => call({ operation: "recovery-key" }),
    exportRandomized: (passphrase) => call({ operation: "export", passphrase }),
    sealIdentitySection: (contents) =>
      call({ operation: "seal-identity-section", contents }),
    openIdentitySection: (encrypted) =>
      call({ operation: "open-identity-section", encrypted }),
    exportCastaway: (contents, passphrase, exportedAt) =>
      call({
        operation: "export-castaway",
        contents,
        passphrase,
        exportedAt,
      }),
    importCastaway: (encrypted, passphrase) =>
      call({ operation: "import-castaway", encrypted, passphrase }),
    signMembershipJoin: () => call({ operation: "sign-membership-join" }),
    lock: () => call({ operation: "lock" }),
    destroy() {
      worker.removeEventListener("message", onMessage);
      worker.terminate();
      for (const handler of pending.values())
        handler.reject(new Error("wallet worker stopped"));
      pending.clear();
    },
  };
}
