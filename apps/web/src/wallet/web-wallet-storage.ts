import type { ZenithMembershipCredentialV3 } from "@castalia/membership-contract";
import type { WebWalletIdentity } from "./custody-protocol.js";

export type StoredWebWallet = {
  schema: "castalia.web-wallet.v1";
  encryptedCustody: string;
  identity: WebWalletIdentity;
  backupConfirmed: boolean;
  membership: ZenithMembershipCredentialV3 | null;
  encryptedIdentitySection: string | null;
};

export interface WebWalletStorage {
  load(): Promise<StoredWebWallet | null>;
  save(value: StoredWebWallet): Promise<void>;
  clear(): Promise<void>;
}

const DATABASE = "castalia-web-wallet";
const STORE = "wallet";
const RECORD = "primary";
const HEX32 = /^[0-9a-f]{64}$/u;
const ML_DSA_65_PUBLIC_KEY = /^[A-Za-z0-9_-]{2603}$/u;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener(
      "success",
      () => {
        resolve(request.result);
      },
      { once: true },
    );
    request.addEventListener(
      "error",
      () => {
        reject(request.error ?? new Error("wallet storage failed"));
      },
      { once: true },
    );
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.addEventListener("upgradeneeded", () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE);
    });
    request.addEventListener(
      "success",
      () => {
        resolve(request.result);
      },
      { once: true },
    );
    request.addEventListener(
      "error",
      () => {
        reject(request.error ?? new Error("wallet storage unavailable"));
      },
      { once: true },
    );
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  try {
    return await requestResult(
      operation(database.transaction(STORE, mode).objectStore(STORE)),
    );
  } finally {
    database.close();
  }
}

type CompatibleStoredWebWallet = Omit<
  StoredWebWallet,
  "encryptedIdentitySection"
> & {
  encryptedIdentitySection?: string | null;
};

function isStoredWebWallet(value: unknown): value is CompatibleStoredWebWallet {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const record = value as Partial<StoredWebWallet>;
  const identity = record.identity as
    | Partial<WebWalletIdentity>
    | null
    | undefined;
  return (
    [
      "backupConfirmed,encryptedCustody,identity,membership,schema",
      "backupConfirmed,encryptedCustody,encryptedIdentitySection,identity,membership,schema",
    ].includes(Object.keys(record).sort().join(",")) &&
    record.schema === "castalia.web-wallet.v1" &&
    typeof record.encryptedCustody === "string" &&
    record.encryptedCustody.length > 0 &&
    record.encryptedCustody.length <= 1_048_576 &&
    typeof record.backupConfirmed === "boolean" &&
    typeof identity === "object" &&
    identity !== null &&
    Object.keys(identity).sort().join(",") ===
      "mlDsa65PublicKey,mlDsa65PublicKeyCommitment,ownerPublicKey" &&
    typeof identity.ownerPublicKey === "string" &&
    HEX32.test(identity.ownerPublicKey) &&
    typeof identity.mlDsa65PublicKey === "string" &&
    ML_DSA_65_PUBLIC_KEY.test(identity.mlDsa65PublicKey) &&
    typeof identity.mlDsa65PublicKeyCommitment === "string" &&
    HEX32.test(identity.mlDsa65PublicKeyCommitment) &&
    (record.encryptedIdentitySection === undefined ||
      record.encryptedIdentitySection === null ||
      (typeof record.encryptedIdentitySection === "string" &&
        record.encryptedIdentitySection.length > 0 &&
        record.encryptedIdentitySection.length <= 1_048_576)) &&
    (record.membership === null || typeof record.membership === "object")
  );
}

export function parseStoredWebWallet(value: unknown): StoredWebWallet {
  if (!isStoredWebWallet(value))
    throw new Error("stored Web wallet record is malformed");
  return structuredClone({
    ...value,
    encryptedIdentitySection: value.encryptedIdentitySection ?? null,
  });
}

export function createIndexedDbWebWalletStorage(): WebWalletStorage {
  return {
    async load() {
      const value = await withStore<unknown>("readonly", (store) =>
        store.get(RECORD),
      );
      if (value === undefined) return null;
      return parseStoredWebWallet(value);
    },
    async save(value) {
      await withStore("readwrite", (store) =>
        store.put(structuredClone(value), RECORD),
      );
    },
    async clear() {
      await withStore("readwrite", (store) => store.delete(RECORD));
    },
  };
}
