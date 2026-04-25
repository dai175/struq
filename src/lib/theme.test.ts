import { describe, expect, it } from "vitest";
import { resolveAppearance } from "./theme";

describe("resolveAppearance", () => {
  it("returns dark when appearance is DARK regardless of OS preference", () => {
    expect(resolveAppearance("DARK", false)).toBe("dark");
    expect(resolveAppearance("DARK", true)).toBe("dark");
  });

  it("returns light when appearance is LIGHT regardless of OS preference", () => {
    expect(resolveAppearance("LIGHT", false)).toBe("light");
    expect(resolveAppearance("LIGHT", true)).toBe("light");
  });

  it("follows OS preference when appearance is AUTO", () => {
    expect(resolveAppearance("AUTO", false)).toBe("dark");
    expect(resolveAppearance("AUTO", true)).toBe("light");
  });
});
