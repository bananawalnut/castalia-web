export type MembershipClass = 1 | 2;

export type CastaliaMemberApplicationV1 = {
  factoryId: string;
  programId: string;
  applicantOfficialDreggCellId: string;
  ownerPublicKey: string;
  applicationKind: 7;
  applicationVersion: 1;
  applicationNonce: number;
  membershipClass: MembershipClass;
  jurisdictionCode: number;
  applicationFlags: 0;
  createdAt: number;
};

export type MembershipEnrollmentChallengeV2 = {
  version: 2;
  challengeId: string;
  nonce: string;
  origin: string;
  audience: string;
  operation: "castalia.membership.enroll";
  ownerPublicKey: string;
  applicationCommitment: string;
  signatureSuite: 1;
  issuedAt: number;
  expiresAt: number;
};

export type MembershipChallengeResponseV2 = {
  challengeId: string;
  application: CastaliaMemberApplicationV1;
  applicationCommitment: string;
  challenge: MembershipEnrollmentChallengeV2;
  expiresAt: number;
};

export type MembershipPresentationV2 = {
  schema: "castalia.wallet-membership-presentation.v2";
  ownerPublicKey: string;
  challenge: MembershipEnrollmentChallengeV2;
  signatureSuite: "Ed25519";
  signature: string;
};

export type IssuedCastaliaMembership = {
  cellId: string;
  ownerPublicKey: string;
  state: "active";
  generation: number;
  changedAt: number;
  lastReceiptHash: string;
};

const HEX32 = /^[0-9a-f]{64}$/u;
const BASE64URL16 = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const BASE64URL64 = /^[A-Za-z0-9_-]{85}[AQgw]$/u;
const APPLICATION_KEYS = [
  "factoryId",
  "programId",
  "applicantOfficialDreggCellId",
  "ownerPublicKey",
  "applicationKind",
  "applicationVersion",
  "applicationNonce",
  "membershipClass",
  "jurisdictionCode",
  "applicationFlags",
  "createdAt",
] as const;
const CHALLENGE_KEYS = [
  "version",
  "challengeId",
  "nonce",
  "origin",
  "audience",
  "operation",
  "ownerPublicKey",
  "applicationCommitment",
  "signatureSuite",
  "issuedAt",
  "expiresAt",
] as const;
const PRESENTATION_KEYS = [
  "schema",
  "ownerPublicKey",
  "challenge",
  "signatureSuite",
  "signature",
] as const;

function frozen<T extends object>(value: T): T {
  return Object.freeze(value);
}

function hasAsciiAtOrBelow(value: string, maximum: number): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= maximum || code === 0x7f) return true;
  }
  return false;
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
  name: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error(`${name} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  )
    throw new Error(`${name} fields are invalid`);
  return value as Record<string, unknown>;
}

function safeUnsigned(value: unknown, name: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new Error(`${name} must be a safe unsigned integer`);
  return value as number;
}

function hex32(value: unknown, name: string): string {
  if (typeof value !== "string" || !HEX32.test(value))
    throw new Error(`${name} must be lowercase hex32`);
  return value;
}

function base64url16(value: unknown, name: string): string {
  if (typeof value !== "string" || !BASE64URL16.test(value))
    throw new Error(`${name} must be canonical base64url16`);
  return value;
}

function base64url64(value: unknown, name: string): string {
  if (typeof value !== "string" || !BASE64URL64.test(value))
    throw new Error(`${name} must be canonical base64url64`);
  return value;
}

function canonicalOrigin(value: unknown): string {
  if (typeof value !== "string" || hasAsciiAtOrBelow(value, 0x20))
    throw new Error("origin must be a canonical string");
  const url = new URL(value);
  if (
    url.origin !== value ||
    url.username !== "" ||
    url.password !== "" ||
    url.hostname.endsWith(".") ||
    !["http:", "https:"].includes(url.protocol)
  )
    throw new Error("origin must be canonical");
  return value;
}

function parseApplication(value: unknown): CastaliaMemberApplicationV1 {
  const input = exactRecord(value, APPLICATION_KEYS, "application");
  const membershipClass = safeUnsigned(
    input.membershipClass,
    "membershipClass",
  );
  const applicationKind = safeUnsigned(
    input.applicationKind,
    "applicationKind",
  );
  const applicationVersion = safeUnsigned(
    input.applicationVersion,
    "applicationVersion",
  );
  const applicationFlags = safeUnsigned(
    input.applicationFlags,
    "applicationFlags",
  );
  if (
    applicationKind !== 7 ||
    applicationVersion !== 1 ||
    input.applicationNonce === 0 ||
    ![1, 2].includes(membershipClass) ||
    applicationFlags !== 0
  )
    throw new Error("application literals are invalid");
  return frozen({
    factoryId: hex32(input.factoryId, "factoryId"),
    programId: hex32(input.programId, "programId"),
    applicantOfficialDreggCellId: hex32(
      input.applicantOfficialDreggCellId,
      "applicantOfficialDreggCellId",
    ),
    ownerPublicKey: hex32(input.ownerPublicKey, "ownerPublicKey"),
    applicationKind: 7,
    applicationVersion: 1,
    applicationNonce: safeUnsigned(input.applicationNonce, "applicationNonce"),
    membershipClass: membershipClass as MembershipClass,
    jurisdictionCode: safeUnsigned(input.jurisdictionCode, "jurisdictionCode"),
    applicationFlags: 0,
    createdAt: safeUnsigned(input.createdAt, "createdAt"),
  });
}

function parseChallenge(value: unknown): MembershipEnrollmentChallengeV2 {
  const input = exactRecord(value, CHALLENGE_KEYS, "challenge");
  const version = safeUnsigned(input.version, "version");
  const signatureSuite = safeUnsigned(input.signatureSuite, "signatureSuite");
  if (
    version !== 2 ||
    signatureSuite !== 1 ||
    input.operation !== "castalia.membership.enroll"
  )
    throw new Error("challenge literals are invalid");
  if (
    typeof input.audience !== "string" ||
    input.audience === "" ||
    input.audience !== input.audience.normalize("NFC") ||
    hasAsciiAtOrBelow(input.audience, 0x1f)
  )
    throw new Error("challenge audience is invalid");
  return frozen({
    version: 2,
    challengeId: base64url16(input.challengeId, "challengeId"),
    nonce: base64url16(input.nonce, "nonce"),
    origin: canonicalOrigin(input.origin),
    audience: input.audience,
    operation: "castalia.membership.enroll",
    ownerPublicKey: hex32(input.ownerPublicKey, "ownerPublicKey"),
    applicationCommitment: hex32(
      input.applicationCommitment,
      "applicationCommitment",
    ),
    signatureSuite: 1,
    issuedAt: safeUnsigned(input.issuedAt, "issuedAt"),
    expiresAt: safeUnsigned(input.expiresAt, "expiresAt"),
  });
}

function rejectDuplicateKeys(encoded: string): void {
  const stack: Array<Set<string> | null> = [];
  let index = 0;
  const skipWhitespace = () => {
    while (/\s/u.test(encoded[index] ?? "")) index += 1;
  };
  const readString = (): string => {
    const start = index;
    index += 1;
    let escaped = false;
    while (index < encoded.length) {
      const character = encoded[index];
      index += 1;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"')
        return JSON.parse(encoded.slice(start, index)) as string;
    }
    throw new Error("invalid JSON");
  };
  while (index < encoded.length) {
    skipWhitespace();
    const character = encoded[index];
    if (character === "{") {
      stack.push(new Set());
      index += 1;
    } else if (character === "[") {
      stack.push(null);
      index += 1;
    } else if (character === "}" || character === "]") {
      stack.pop();
      index += 1;
    } else if (character === '"') {
      const key = readString();
      skipWhitespace();
      if (encoded[index] === ":" && stack.at(-1) instanceof Set) {
        const keys = stack.at(-1) as Set<string>;
        if (keys.has(key)) throw new Error("duplicate JSON field");
        keys.add(key);
      }
    } else index += 1;
  }
}

function parseStrictJson(encoded: string): unknown {
  rejectDuplicateKeys(encoded);
  return JSON.parse(encoded) as unknown;
}

export function parseMembershipChallengeResponse(
  encoded: string,
  expected: {
    origin: string;
    audience: string;
    ownerPublicKey: string;
    nowMs: number;
  },
): MembershipChallengeResponseV2 {
  const input = exactRecord(
    parseStrictJson(encoded),
    [
      "challengeId",
      "application",
      "applicationCommitment",
      "challenge",
      "expiresAt",
    ],
    "challenge response",
  );
  const application = parseApplication(input.application);
  const challenge = parseChallenge(input.challenge);
  const challengeId = base64url16(input.challengeId, "challengeId");
  const applicationCommitment = hex32(
    input.applicationCommitment,
    "applicationCommitment",
  );
  const expiresAt = safeUnsigned(input.expiresAt, "expiresAt");
  if (
    challengeId !== challenge.challengeId ||
    applicationCommitment !== challenge.applicationCommitment ||
    expiresAt !== challenge.expiresAt ||
    application.ownerPublicKey !== expected.ownerPublicKey ||
    challenge.ownerPublicKey !== expected.ownerPublicKey ||
    challenge.origin !== expected.origin ||
    challenge.audience !== expected.audience ||
    challenge.issuedAt > expected.nowMs + 5_000 ||
    expected.nowMs > challenge.expiresAt ||
    challenge.expiresAt <= challenge.issuedAt ||
    challenge.expiresAt - challenge.issuedAt > 300_000
  )
    throw new Error(
      "challenge response does not match trusted request context",
    );
  return frozen({
    challengeId,
    application: frozen(application),
    applicationCommitment,
    challenge,
    expiresAt,
  });
}

export function parseMembershipPresentation(
  encoded: string,
): MembershipPresentationV2 {
  const input = exactRecord(
    parseStrictJson(encoded),
    PRESENTATION_KEYS,
    "presentation",
  );
  if (
    input.schema !== "castalia.wallet-membership-presentation.v2" ||
    input.signatureSuite !== "Ed25519"
  )
    throw new Error("presentation literals are invalid");
  const ownerPublicKey = hex32(input.ownerPublicKey, "ownerPublicKey");
  const challenge = parseChallenge(input.challenge);
  if (ownerPublicKey !== challenge.ownerPublicKey)
    throw new Error("presentation owner does not match challenge");
  return frozen({
    schema: "castalia.wallet-membership-presentation.v2",
    ownerPublicKey,
    challenge,
    signatureSuite: "Ed25519",
    signature: base64url64(input.signature, "signature"),
  });
}

export function parseIssuedCastaliaMembership(
  encoded: string,
): IssuedCastaliaMembership {
  const input = exactRecord(
    parseStrictJson(encoded),
    [
      "cellId",
      "ownerPublicKey",
      "state",
      "generation",
      "changedAt",
      "lastReceiptHash",
    ],
    "membership response",
  );
  if (input.state !== "active")
    throw new Error("membership response state is invalid");
  return frozen({
    cellId: hex32(input.cellId, "cellId"),
    ownerPublicKey: hex32(input.ownerPublicKey, "ownerPublicKey"),
    state: "active",
    generation: safeUnsigned(input.generation, "generation"),
    changedAt: safeUnsigned(input.changedAt, "changedAt"),
    lastReceiptHash: hex32(input.lastReceiptHash, "lastReceiptHash"),
  });
}
