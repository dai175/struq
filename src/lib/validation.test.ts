import { describe, expect, it } from "vitest";
import { isValidUrl } from "./validation";

describe("isValidUrl", () => {
  it("returns true for an https URL", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("returns true for an http URL", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("returns false for an ftp URL", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });

  it("returns false for an invalid string", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isValidUrl("")).toBe(false);
  });

  it("returns true for a URL with path and query string", () => {
    expect(isValidUrl("https://example.com/path?q=1#hash")).toBe(true);
  });
});
