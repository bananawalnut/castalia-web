import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const VECTOR_PATH = resolve(
  process.cwd(),
  "../../docs/vectors/castalia-permissionless-membership-v2.vector.json",
);
const CHECKSUM_PATH = resolve(
  process.cwd(),
  "../../docs/vectors/castalia-permissionless-membership-v2.vector.sha256",
);

describe("permissionless membership v2 contract vector", () => {
  it("pins the canonical producer bytes and identifiers", () => {
    const bytes = readFileSync(VECTOR_PATH);
    const checksum = readFileSync(CHECKSUM_PATH, "utf8").trim();
    const vector = JSON.parse(bytes.toString("utf8")) as Record<string, string>;

    expect(createHash("sha256").update(bytes).digest("hex")).toBe(checksum);
    expect(vector).toMatchObject({
      schema: "castalia.permissionless-membership.v2.vector",
      joinDomainUtf8: "castalia/permissionless-membership-join/v2\u0000",
      factoryId:
        "7ad3af1ba0e83ad560a881780295706073c1a0c9fe8656310051f62444903554",
      programId:
        "6c37adae385c40894127e766deb9aff54e4cd01b0ccf01aff1ac7c12e24441fd",
      tokenId:
        "7f66eec85e99cd49ef3c8d733b8c489defe0a721f03fb2c3dd4bea04b1710d1f",
      membershipCellId:
        "e4eea3e7352a5c8591508e880ce095421e472946dd3c1936e3efa05870447522",
    });
  });
});
