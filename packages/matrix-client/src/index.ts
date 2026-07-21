export interface MatrixCommunityReadPort {
  readCommunity(slug: string): Promise<Readonly<{
    slug: "zenith";
    name: "Zenith";
    availability: "unavailable";
  }> | null>;
  readForum(
    slug: string,
  ): Promise<Readonly<{ status: "unavailable"; reason: "fixture_only" }>>;
}

export function createFixtureMatrixReader(): MatrixCommunityReadPort {
  return {
    readCommunity(slug) {
      return Promise.resolve(
        slug === "zenith"
          ? { slug: "zenith", name: "Zenith", availability: "unavailable" }
          : null,
      );
    },
    readForum() {
      return Promise.resolve({ status: "unavailable", reason: "fixture_only" });
    },
  };
}

export interface FixtureSynapseUser {
  readonly userId: string;
  readonly displayName: string;
  readonly publicCommunity: boolean;
}

export interface FixtureCommunityRegistry {
  listCommunities(): Promise<
    readonly Readonly<{
      slug: "zenith";
      name: "Zenith";
      availability: "unavailable";
    }>[]
  >;
}

const fixtureUserKeys = ["displayName", "publicCommunity", "userId"];
const fixtureUserId = /^@([a-z0-9]+(?:-[a-z0-9]+)*):fixture\.invalid$/;

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && (codePoint <= 31 || codePoint === 127))
      return true;
  }
  return false;
}

function parseFixtureSynapseUser(value: unknown): FixtureSynapseUser {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("fixture Synapse user must be an object");

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (
    keys.length !== fixtureUserKeys.length ||
    keys.some((key, index) => key !== fixtureUserKeys[index])
  )
    throw new Error("fixture Synapse user has unexpected fields");

  if (typeof record.userId !== "string" || !fixtureUserId.test(record.userId))
    throw new Error(
      "invalid fixture Synapse user id; expected @localpart:fixture.invalid",
    );
  if (
    typeof record.displayName !== "string" ||
    record.displayName.length === 0 ||
    record.displayName.length > 100 ||
    record.displayName !== record.displayName.trim() ||
    hasControlCharacter(record.displayName)
  )
    throw new Error("invalid fixture Synapse display name");
  if (typeof record.publicCommunity !== "boolean")
    throw new Error("fixture public-community marker must be boolean");

  return {
    userId: record.userId,
    displayName: record.displayName,
    publicCommunity: record.publicCommunity,
  };
}

export function createFixtureSynapseUserRegistry(
  values: readonly unknown[],
): FixtureCommunityRegistry {
  const users = values.map(parseFixtureSynapseUser);
  const identities = new Set<string>();
  for (const user of users) {
    if (identities.has(user.userId))
      throw new Error(`duplicate fixture Synapse user id: ${user.userId}`);
    identities.add(user.userId);
  }

  const communities = users
    .filter((user) => user.publicCommunity)
    .map((user) => {
      if (
        user.userId !== "@zenith:fixture.invalid" ||
        user.displayName !== "Zenith"
      )
        throw new Error("unsupported public fixture Synapse user identity");
      return {
        slug: "zenith",
        name: "Zenith",
        availability: "unavailable",
      } as const;
    });

  return {
    listCommunities() {
      return Promise.resolve(communities);
    },
  };
}
