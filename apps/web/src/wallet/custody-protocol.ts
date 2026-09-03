export type WebWalletIdentity = {
  ownerPublicKey: string;
  mlDsa65PublicKey: string;
  mlDsa65PublicKeyCommitment: string;
};

export type CustodyRequest =
  | {
      id: number;
      operation: "create";
      passphrase: string;
      createdAt: number;
    }
  | {
      id: number;
      operation: "restore-recovery-key";
      recoveryKey: string;
      passphrase: string;
      createdAt: number;
    }
  | {
      id: number;
      operation: "unlock";
      encryptedCustody: string;
      passphrase: string;
    }
  | { id: number; operation: "identity" }
  | { id: number; operation: "recovery-key" }
  | { id: number; operation: "export"; passphrase: string }
  | { id: number; operation: "sign-membership-join" }
  | { id: number; operation: "lock" };

export type CustodyResponse =
  | { id: number; ok: true; value: unknown }
  | { id: number; ok: false; error: "wallet-operation-failed" };
