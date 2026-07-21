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
