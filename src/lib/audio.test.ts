import { describe, expect, it } from "vitest";
import { clickVolumeToGain } from "./audio";

describe("clickVolumeToGain", () => {
  it("returns 0 at the bottom of the range", () => {
    expect(clickVolumeToGain(0)).toBe(0);
  });

  it("returns the peak gain at the top of the range", () => {
    expect(clickVolumeToGain(100)).toBeCloseTo(0.3);
  });

  it("clamps values below 0 to silence", () => {
    expect(clickVolumeToGain(-25)).toBe(0);
  });

  it("clamps values above 100 to the peak", () => {
    expect(clickVolumeToGain(250)).toBeCloseTo(0.3);
  });

  it("applies a squared curve so 50% sits well below half of peak", () => {
    expect(clickVolumeToGain(50)).toBeCloseTo(0.075);
  });

  it("is monotonically non-decreasing across the range", () => {
    let prev = -Infinity;
    for (let p = 0; p <= 100; p += 5) {
      const g = clickVolumeToGain(p);
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
  });
});
