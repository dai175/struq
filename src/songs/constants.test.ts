import { describe, expect, it } from "vitest";
import { SECTION_TYPES } from "@/i18n/types";
import { DEFAULT_BARS, SECTION_COLORS } from "./constants";

describe("SECTION_COLORS", () => {
  it("defines a color for every section type", () => {
    for (const type of SECTION_TYPES) {
      expect(SECTION_COLORS[type]).toBeDefined();
    }
  });

  it("uses CSS variable format for every color value", () => {
    for (const type of SECTION_TYPES) {
      expect(SECTION_COLORS[type]).toMatch(/^var\(--color-section-/);
    }
  });

  it("maps each section type to the correct CSS variable name", () => {
    expect(SECTION_COLORS.intro).toBe("var(--color-section-intro)");
    expect(SECTION_COLORS.chorus).toBe("var(--color-section-chorus)");
    expect(SECTION_COLORS.custom).toBe("var(--color-section-custom)");
  });
});

describe("DEFAULT_BARS", () => {
  it("defines a default bar count for every section type", () => {
    for (const type of SECTION_TYPES) {
      expect(DEFAULT_BARS[type]).toBeDefined();
    }
  });

  it("has a positive integer for every default bar count", () => {
    for (const type of SECTION_TYPES) {
      const bars = DEFAULT_BARS[type];
      expect(bars).toBeGreaterThan(0);
      expect(Number.isInteger(bars)).toBe(true);
    }
  });

  it("defaults intro and outro to 4 bars", () => {
    expect(DEFAULT_BARS.intro).toBe(4);
    expect(DEFAULT_BARS.outro).toBe(4);
  });

  it("defaults chorus, a, b, bridge, and solo to 8 bars", () => {
    expect(DEFAULT_BARS.chorus).toBe(8);
    expect(DEFAULT_BARS.a).toBe(8);
    expect(DEFAULT_BARS.b).toBe(8);
    expect(DEFAULT_BARS.bridge).toBe(8);
    expect(DEFAULT_BARS.solo).toBe(8);
  });
});
