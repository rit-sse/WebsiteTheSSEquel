import { describe, expect, it } from "vitest";
import { getInitials, getShortName } from "@/lib/userDisplay";

describe("getShortName", () => {
  it("returns first name plus last initial", () => {
    expect(getShortName("Sam Lavine")).toBe("Sam L.");
  });

  it("uses the last token and ignores extra whitespace", () => {
    expect(getShortName("  Thomas  A  lee ")).toBe("Thomas L.");
  });

  it("returns a single name unchanged", () => {
    expect(getShortName("Cher")).toBe("Cher");
  });

  it("returns an empty string for missing names", () => {
    expect(getShortName("")).toBe("");
    expect(getShortName(null)).toBe("");
  });
});

describe("getInitials", () => {
  it("still returns two-letter initials", () => {
    expect(getInitials("Jakob Langtry")).toBe("JL");
  });
});
