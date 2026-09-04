/// <reference lib="webworker" />

import init, * as walletWasm from "../generated/castalia-wallet-wasm/castalia_wallet_wasm.js";
import type {
  CustodyRequest,
  CustodyResponse,
  WebWalletIdentity,
} from "./custody-protocol.js";

const scope = self as DedicatedWorkerGlobalScope;
type WasmCustody = {
  create(passphrase: string, createdAt: bigint): string;
  restoreFromRecoveryKey(
    recoveryKey: string,
    passphrase: string,
    createdAt: bigint,
  ): string;
  unlock(encrypted: Uint8Array, passphrase: string): string;
  exportRandomized(passphrase: string): string;
  sealIdentitySection(contents: string): string;
  openIdentitySection(encrypted: Uint8Array): string;
  exportCastaway(
    contents: string,
    passphrase: string,
    exportedAt: bigint,
  ): string;
  importCastaway(encrypted: Uint8Array, passphrase: string): string;
  recoveryKey(): string;
  publicKey(): string;
  mlDsaPublicKey(): string;
  mlDsaPublicKeyCommitment(): string;
  signZenithMembershipJoin(): Uint8Array;
  lock(): void;
};

const wasmReady = init().then(() => {
  const module = walletWasm as unknown as {
    WebWalletCustody: new () => WasmCustody;
  };
  return new module.WebWalletCustody();
});
let custody: WasmCustody | undefined;

async function getCustody(): Promise<WasmCustody> {
  custody ??= await wasmReady;
  return custody;
}

function identity(wallet: WasmCustody): WebWalletIdentity {
  return {
    ownerPublicKey: wallet.publicKey(),
    mlDsa65PublicKey: wallet.mlDsaPublicKey(),
    mlDsa65PublicKeyCommitment: wallet.mlDsaPublicKeyCommitment(),
  };
}

async function execute(request: CustodyRequest): Promise<unknown> {
  const wallet = await getCustody();
  switch (request.operation) {
    case "create":
      return {
        encryptedCustody: wallet.create(
          request.passphrase,
          BigInt(request.createdAt),
        ),
        identity: identity(wallet),
        recoveryKey: wallet.recoveryKey(),
      };
    case "restore-recovery-key":
      return {
        encryptedCustody: wallet.restoreFromRecoveryKey(
          request.recoveryKey,
          request.passphrase,
          BigInt(request.createdAt),
        ),
        identity: identity(wallet),
      };
    case "unlock":
      wallet.unlock(
        new TextEncoder().encode(request.encryptedCustody),
        request.passphrase,
      );
      return identity(wallet);
    case "identity":
      return identity(wallet);
    case "recovery-key":
      return wallet.recoveryKey();
    case "export":
      return wallet.exportRandomized(request.passphrase);
    case "seal-identity-section":
      return wallet.sealIdentitySection(request.contents);
    case "open-identity-section":
      return wallet.openIdentitySection(
        new TextEncoder().encode(request.encrypted),
      );
    case "export-castaway":
      return wallet.exportCastaway(
        request.contents,
        request.passphrase,
        BigInt(request.exportedAt),
      );
    case "import-castaway":
      return wallet.importCastaway(
        new TextEncoder().encode(request.encrypted),
        request.passphrase,
      );
    case "sign-membership-join":
      return wallet.signZenithMembershipJoin();
    case "lock":
      wallet.lock();
      return null;
  }
}

scope.addEventListener("message", (event: MessageEvent<CustodyRequest>) => {
  const request = event.data;
  void execute(request).then(
    (value) => {
      const response: CustodyResponse = { id: request.id, ok: true, value };
      scope.postMessage(response);
    },
    () => {
      custody?.lock();
      const response: CustodyResponse = {
        id: request.id,
        ok: false,
        error: "wallet-operation-failed",
      };
      scope.postMessage(response);
    },
  );
});
