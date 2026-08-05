import { describe, expect, it } from "vitest";
import {
  centerInlineTextInOccupiedRun,
  supportsPretextMeasurement,
} from "../src/text-layout.js";

describe("shared Pretext text layout boundary", () => {
  it("falls back deterministically when the runtime has no Canvas text engine", () => {
    expect(supportsPretextMeasurement()).toBe(false);
    expect(
      centerInlineTextInOccupiedRun(
        "    flowing river text    ",
        "[ stone ]",
        7,
        "16px Menlo",
      ),
    ).toEqual({ column: 7, engine: "fixed-cells" });
  });
});
