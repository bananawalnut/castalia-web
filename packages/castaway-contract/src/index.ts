export const CASTAWAY_CONTENTS_SCHEMA =
  "castalia.castaway-contents.v1" as const;
export const CASTAWAY_ENVELOPE_SCHEMA = "castalia.castaway.v1" as const;
export const ZENITH_IDENTITY_SCHEMA = "zenith.identity-section.v1" as const;
export const ZENITH_IDENTITY_DISCLOSURE_SCHEMA =
  "zenith.identity-disclosure.v1" as const;

export const ZENITH_PERSON_ROLES = ["Author", "Researcher", "Student"] as const;
export type ZenithPersonRole = (typeof ZENITH_PERSON_ROLES)[number];
export type ClaimDisclosure = "private" | "selected";

export type ZenithTextClaim = {
  value: string;
  disclosure: ClaimDisclosure;
};

export type ZenithIdentityFields = {
  displayName: ZenithTextClaim;
  givenName: ZenithTextClaim;
  familyName: ZenithTextClaim;
  headline: ZenithTextClaim;
  biography: ZenithTextClaim;
  website: ZenithTextClaim;
  orcid: ZenithTextClaim;
};

export type ZenithRoleClaim = {
  role: ZenithPersonRole;
  disclosure: ClaimDisclosure;
};

export type ZenithAcademicInstitutionAffiliation = {
  type: "AcademicInstitution";
  name: string;
  department: string;
  position: string;
  identifier: string;
  website: string;
  disclosure: ClaimDisclosure;
};

export type ZenithJournalRelationship = {
  type: "Journal";
  name: string;
  relationship: "Author" | "Editor" | "Reviewer" | "Contributor";
  identifier: string;
  website: string;
  disclosure: ClaimDisclosure;
};

export type ZenithIdentitySectionV1 = {
  schema: typeof ZENITH_IDENTITY_SCHEMA;
  version: 1;
  subject: {
    type: "Person";
    memberKey: string;
    fields: ZenithIdentityFields;
    roles: ZenithRoleClaim[];
    affiliations: ZenithAcademicInstitutionAffiliation[];
    journals: ZenithJournalRelationship[];
  };
  updatedAt: number;
};

export type CastawayContentsV1 = {
  schema: typeof CASTAWAY_CONTENTS_SCHEMA;
  version: 1;
  sections: {
    identity: ZenithIdentitySectionV1;
  };
};

export type CastawayEnvelopeV1 = {
  schema: typeof CASTAWAY_ENVELOPE_SCHEMA;
  contentsSchema: typeof CASTAWAY_CONTENTS_SCHEMA;
  ownerPublicKey: string;
  exportedAt: number;
  kdf: {
    name: "Argon2id";
    version: 19;
    salt: string;
    memoryKiB: 65_536;
    iterations: 3;
    parallelism: 1;
    derivedKeyBytes: 32;
  };
  aead: {
    name: "AES-256-GCM";
    nonce: string;
    tagBits: 128;
  };
  ciphertext: string;
};

export type ZenithIdentityDisclosureV1 = {
  schema: typeof ZENITH_IDENTITY_DISCLOSURE_SCHEMA;
  version: 1;
  assurance: "self-asserted";
  subject: {
    type: "Person";
    memberKey: string;
  };
  claims: {
    fields: Partial<Record<keyof ZenithIdentityFields, string>>;
    roles: ZenithPersonRole[];
    affiliations: Omit<ZenithAcademicInstitutionAffiliation, "disclosure">[];
    journals: Omit<ZenithJournalRelationship, "disclosure">[];
  };
  createdAt: number;
};

const HEX_32 = /^[0-9a-f]{64}$/u;
const ORCID = /^(?:\d{4}-){3}\d{3}[\dX]$/u;
const BASE64URL = /^[A-Za-z0-9_-]+$/u;
const FIELD_NAMES = [
  "displayName",
  "givenName",
  "familyName",
  "headline",
  "biography",
  "website",
  "orcid",
] as const satisfies readonly (keyof ZenithIdentityFields)[];
const JOURNAL_RELATIONSHIPS = [
  "Author",
  "Editor",
  "Reviewer",
  "Contributor",
] as const;

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("identity value must be an object");
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  if (Object.keys(value).sort().join(",") !== [...keys].sort().join(","))
    throw new Error("identity value contains missing or unknown fields");
}

function text(value: unknown, name: string, maximum: number): string {
  if (typeof value !== "string" || value.length > maximum)
    throw new Error(`${name} is malformed`);
  return value;
}

function disclosure(value: unknown): ClaimDisclosure {
  if (value !== "private" && value !== "selected")
    throw new Error("claim disclosure is malformed");
  return value;
}

function timestamp(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new Error("identity timestamp is malformed");
  return value as number;
}

function textClaim(value: unknown, name: string): ZenithTextClaim {
  const candidate = record(value);
  exactKeys(candidate, ["value", "disclosure"]);
  const maximum = name === "biography" ? 4_000 : 320;
  return {
    value: text(candidate.value, name, maximum),
    disclosure: disclosure(candidate.disclosure),
  };
}

function safeUrl(value: string, name: string): string {
  if (!value) return value;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTPS URL`);
  }
  if (parsed.protocol !== "https:")
    throw new Error(`${name} must be an absolute HTTPS URL`);
  return value;
}

function parseIdentity(value: unknown): ZenithIdentitySectionV1 {
  const identity = record(value);
  exactKeys(identity, ["schema", "version", "subject", "updatedAt"]);
  if (identity.schema !== ZENITH_IDENTITY_SCHEMA || identity.version !== 1)
    throw new Error("identity schema is unsupported");
  const subject = record(identity.subject);
  exactKeys(subject, [
    "type",
    "memberKey",
    "fields",
    "roles",
    "affiliations",
    "journals",
  ]);
  if (subject.type !== "Person")
    throw new Error("identity subject is not a Person");
  const memberKey = text(subject.memberKey, "member key", 64);
  if (!HEX_32.test(memberKey))
    throw new Error("identity member key is malformed");

  const fieldsValue = record(subject.fields);
  exactKeys(fieldsValue, FIELD_NAMES);
  const fields = Object.fromEntries(
    FIELD_NAMES.map((name) => [name, textClaim(fieldsValue[name], name)]),
  ) as ZenithIdentityFields;
  safeUrl(fields.website.value, "website");
  if (fields.orcid.value && !ORCID.test(fields.orcid.value))
    throw new Error("ORCID is malformed");

  if (!Array.isArray(subject.roles) || subject.roles.length > 3)
    throw new Error("identity roles are malformed");
  const roles = subject.roles.map((value): ZenithRoleClaim => {
    const role = record(value);
    exactKeys(role, ["role", "disclosure"]);
    if (!ZENITH_PERSON_ROLES.includes(role.role as ZenithPersonRole))
      throw new Error("identity role is unsupported");
    return {
      role: role.role as ZenithPersonRole,
      disclosure: disclosure(role.disclosure),
    };
  });
  if (new Set(roles.map(({ role }) => role)).size !== roles.length)
    throw new Error("identity roles contain duplicates");

  if (!Array.isArray(subject.affiliations) || subject.affiliations.length > 12)
    throw new Error("identity affiliations are malformed");
  const affiliations = subject.affiliations.map(
    (value): ZenithAcademicInstitutionAffiliation => {
      const affiliation = record(value);
      exactKeys(affiliation, [
        "type",
        "name",
        "department",
        "position",
        "identifier",
        "website",
        "disclosure",
      ]);
      if (affiliation.type !== "AcademicInstitution")
        throw new Error("affiliation type is unsupported");
      const website = text(affiliation.website, "institution website", 320);
      safeUrl(website, "institution website");
      return {
        type: "AcademicInstitution",
        name: text(affiliation.name, "institution name", 240),
        department: text(affiliation.department, "department", 240),
        position: text(affiliation.position, "institution position", 240),
        identifier: text(affiliation.identifier, "institution identifier", 240),
        website,
        disclosure: disclosure(affiliation.disclosure),
      };
    },
  );

  if (!Array.isArray(subject.journals) || subject.journals.length > 24)
    throw new Error("identity journals are malformed");
  const journals = subject.journals.map((value): ZenithJournalRelationship => {
    const journal = record(value);
    exactKeys(journal, [
      "type",
      "name",
      "relationship",
      "identifier",
      "website",
      "disclosure",
    ]);
    if (journal.type !== "Journal")
      throw new Error("journal type is unsupported");
    if (
      !JOURNAL_RELATIONSHIPS.includes(
        journal.relationship as (typeof JOURNAL_RELATIONSHIPS)[number],
      )
    )
      throw new Error("journal relationship is unsupported");
    const website = text(journal.website, "journal website", 320);
    safeUrl(website, "journal website");
    return {
      type: "Journal",
      name: text(journal.name, "journal name", 240),
      relationship:
        journal.relationship as ZenithJournalRelationship["relationship"],
      identifier: text(journal.identifier, "journal identifier", 240),
      website,
      disclosure: disclosure(journal.disclosure),
    };
  });

  return {
    schema: ZENITH_IDENTITY_SCHEMA,
    version: 1,
    subject: {
      type: "Person",
      memberKey,
      fields,
      roles,
      affiliations,
      journals,
    },
    updatedAt: timestamp(identity.updatedAt),
  };
}

export function parseZenithIdentitySection(
  value: unknown,
): ZenithIdentitySectionV1 {
  return parseIdentity(value);
}

export function parseCastawayContents(value: unknown): CastawayContentsV1 {
  const contents = record(value);
  exactKeys(contents, ["schema", "version", "sections"]);
  if (contents.schema !== CASTAWAY_CONTENTS_SCHEMA || contents.version !== 1)
    throw new Error("Castaway contents schema is unsupported");
  const sections = record(contents.sections);
  exactKeys(sections, ["identity"]);
  return {
    schema: CASTAWAY_CONTENTS_SCHEMA,
    version: 1,
    sections: { identity: parseIdentity(sections.identity) },
  };
}

export function parseCastawayEnvelope(value: unknown): CastawayEnvelopeV1 {
  const envelope = record(value);
  exactKeys(envelope, [
    "schema",
    "contentsSchema",
    "ownerPublicKey",
    "exportedAt",
    "kdf",
    "aead",
    "ciphertext",
  ]);
  if (
    envelope.schema !== CASTAWAY_ENVELOPE_SCHEMA ||
    envelope.contentsSchema !== CASTAWAY_CONTENTS_SCHEMA
  )
    throw new Error("Castaway envelope schema is unsupported");
  const ownerPublicKey = text(envelope.ownerPublicKey, "owner public key", 64);
  if (!HEX_32.test(ownerPublicKey))
    throw new Error("Castaway owner public key is malformed");
  const kdf = record(envelope.kdf);
  exactKeys(kdf, [
    "name",
    "version",
    "salt",
    "memoryKiB",
    "iterations",
    "parallelism",
    "derivedKeyBytes",
  ]);
  const salt = text(kdf.salt, "Castaway salt", 22);
  if (
    kdf.name !== "Argon2id" ||
    kdf.version !== 19 ||
    salt.length !== 22 ||
    !BASE64URL.test(salt) ||
    kdf.memoryKiB !== 65_536 ||
    kdf.iterations !== 3 ||
    kdf.parallelism !== 1 ||
    kdf.derivedKeyBytes !== 32
  )
    throw new Error("Castaway KDF is unsupported");
  const aead = record(envelope.aead);
  exactKeys(aead, ["name", "nonce", "tagBits"]);
  const nonce = text(aead.nonce, "Castaway nonce", 16);
  if (
    aead.name !== "AES-256-GCM" ||
    nonce.length !== 16 ||
    !BASE64URL.test(nonce) ||
    aead.tagBits !== 128
  )
    throw new Error("Castaway encryption is unsupported");
  const ciphertext = text(
    envelope.ciphertext,
    "Castaway ciphertext",
    1_048_576,
  );
  if (ciphertext.length < 22 || !BASE64URL.test(ciphertext))
    throw new Error("Castaway ciphertext is malformed");
  return {
    schema: CASTAWAY_ENVELOPE_SCHEMA,
    contentsSchema: CASTAWAY_CONTENTS_SCHEMA,
    ownerPublicKey,
    exportedAt: timestamp(envelope.exportedAt),
    kdf: {
      name: "Argon2id",
      version: 19,
      salt,
      memoryKiB: 65_536,
      iterations: 3,
      parallelism: 1,
      derivedKeyBytes: 32,
    },
    aead: { name: "AES-256-GCM", nonce, tagBits: 128 },
    ciphertext,
  };
}

const privateClaim = (): ZenithTextClaim => ({
  value: "",
  disclosure: "private",
});

export function createPrivateZenithIdentity(
  memberKey: string,
  updatedAt = Date.now(),
): ZenithIdentitySectionV1 {
  if (!HEX_32.test(memberKey))
    throw new Error("identity member key is malformed");
  return {
    schema: ZENITH_IDENTITY_SCHEMA,
    version: 1,
    subject: {
      type: "Person",
      memberKey,
      fields: {
        displayName: privateClaim(),
        givenName: privateClaim(),
        familyName: privateClaim(),
        headline: privateClaim(),
        biography: privateClaim(),
        website: privateClaim(),
        orcid: privateClaim(),
      },
      roles: [],
      affiliations: [],
      journals: [],
    },
    updatedAt,
  };
}

export function castawayContents(
  identity: ZenithIdentitySectionV1,
): CastawayContentsV1 {
  return {
    schema: CASTAWAY_CONTENTS_SCHEMA,
    version: 1,
    sections: { identity: parseIdentity(identity) },
  };
}

export function selectedIdentityDisclosure(
  identity: ZenithIdentitySectionV1,
  createdAt = Date.now(),
): ZenithIdentityDisclosureV1 {
  const parsed = parseIdentity(identity);
  const fields: Partial<Record<keyof ZenithIdentityFields, string>> = {};
  for (const name of FIELD_NAMES) {
    const claim = parsed.subject.fields[name];
    if (claim.disclosure === "selected" && claim.value)
      fields[name] = claim.value;
  }
  return {
    schema: ZENITH_IDENTITY_DISCLOSURE_SCHEMA,
    version: 1,
    assurance: "self-asserted",
    subject: { type: "Person", memberKey: parsed.subject.memberKey },
    claims: {
      fields,
      roles: parsed.subject.roles
        .filter(({ disclosure: state }) => state === "selected")
        .map(({ role }) => role),
      affiliations: parsed.subject.affiliations
        .filter(({ disclosure: state }) => state === "selected")
        .map(({ type, name, department, position, identifier, website }) => ({
          type,
          name,
          department,
          position,
          identifier,
          website,
        })),
      journals: parsed.subject.journals
        .filter(({ disclosure: state }) => state === "selected")
        .map(({ type, name, relationship, identifier, website }) => ({
          type,
          name,
          relationship,
          identifier,
          website,
        })),
    },
    createdAt: timestamp(createdAt),
  };
}
