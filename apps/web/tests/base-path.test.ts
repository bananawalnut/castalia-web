import { describe, expect, it } from "vitest";
import { deployedPath, routePath } from "../src/base-path.js";

describe("project-site base paths", () => {
  it("maps deployed project URLs to logical Castalia routes", () => {
    expect(routePath("/castalia-web/", "/castalia-web/")).toBe("/");
    expect(routePath("/castalia-web/tenders/tnd-0001", "/castalia-web/")).toBe(
      "/tenders/tnd-0001",
    );
  });

  it("maps logical routes and assets under the deployed project path", () => {
    expect(deployedPath("/", "/castalia-web/")).toBe("/castalia-web/");
    expect(deployedPath("/tenders", "/castalia-web/")).toBe(
      "/castalia-web/tenders",
    );
    expect(deployedPath("/brand/castalia-crest.svg", "/castalia-web/")).toBe(
      "/castalia-web/brand/castalia-crest.svg",
    );
  });

  it("keeps local-root development paths unchanged", () => {
    expect(routePath("/rfcs/rfc-0017", "/")).toBe("/rfcs/rfc-0017");
    expect(deployedPath("/docs", "/")).toBe("/docs");
  });
});
