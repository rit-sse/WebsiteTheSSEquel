import { describe, expect, it } from "vitest";

import {
  assertMatchingReleaseVersions,
  createBuildVersion,
  normalizeGitCommit,
} from "@/lib/buildVersion";

describe("build version", () => {
  it("uses the package release version for local builds", () => {
    expect(createBuildVersion("1.2.3", undefined)).toBe("1.2.3");
  });

  it("adds the abbreviated commit as SemVer build metadata", () => {
    expect(
      createBuildVersion("1.2.3", "95FEB0ABEC3E190D4BF940425B122D1C0A1DE96C")
    ).toBe("1.2.3+95feb0a");
  });

  it("preserves prerelease identifiers", () => {
    expect(createBuildVersion("2.0.0-rc.1", "abcdef1234567890")).toBe(
      "2.0.0-rc.1+abcdef1"
    );
  });

  it("extends existing build metadata", () => {
    expect(createBuildVersion("2.0.0+linux", "abcdef1234567890")).toBe(
      "2.0.0+linux.abcdef1"
    );
  });

  it("rejects an invalid release version", () => {
    expect(() => createBuildVersion("v1.2", "abcdef1234567890")).toThrow(
      "Invalid application version"
    );
  });

  it("ignores invalid commit values", () => {
    expect(normalizeGitCommit("dev")).toBeUndefined();
    expect(createBuildVersion("1.2.3", "dev")).toBe("1.2.3");
  });

  it("rejects mismatched workspace and application versions", () => {
    expect(() => assertMatchingReleaseVersions("1.2.3", "1.2.4")).toThrow(
      "Application version mismatch"
    );
    expect(() => assertMatchingReleaseVersions("1.2.3", "1.2.3")).not.toThrow();
  });
});
