import { describe, expect, it } from "vitest";

import { resolveReleaseVersion } from "@/lib/releaseVersion";

describe("release version", () => {
  it("uses the version shared by both package files", () => {
    expect(resolveReleaseVersion("1.2.3", "1.2.3")).toBe("1.2.3");
  });

  it("supports prerelease versions", () => {
    expect(resolveReleaseVersion("2.0.0-rc.1", "2.0.0-rc.1")).toBe(
      "2.0.0-rc.1"
    );
  });

  it("supports SemVer build metadata", () => {
    expect(resolveReleaseVersion("2.0.0+linux", "2.0.0+linux")).toBe(
      "2.0.0+linux"
    );
  });

  it("rejects an invalid release version", () => {
    expect(() => resolveReleaseVersion("v1.2", "v1.2")).toThrow(
      "Invalid application version"
    );
  });

  it("rejects mismatched workspace and application versions", () => {
    expect(() => resolveReleaseVersion("1.2.3", "1.2.4")).toThrow(
      "Application version mismatch"
    );
  });
});
