import { describe, expect, it } from "vitest";
import {
  filterVisibleSections,
  type DashboardAuthFlags,
} from "@/lib/dashboardSections";

const baseAuth: DashboardAuthFlags = {
  isOfficer: false,
  isMentor: false,
  isPrimary: false,
  isMentoringHead: false,
  isSeAdmin: false,
  isTechCommitteeHead: false,
  isTechCommitteeDivisionManager: false,
};

const idsFor = (auth: Partial<DashboardAuthFlags>) =>
  filterVisibleSections({ ...baseAuth, ...auth }).map((s) => s.id);

describe("filterVisibleSections", () => {
  it("hides gated sections from a user with no role flags", () => {
    const ids = idsFor({});
    // Universal sections (no `visibleFor`) always show.
    expect(ids).toEqual(
      expect.arrayContaining([
        "purchasing",
        "attendance",
        "mentoring",
        "positions",
        "users",
        "sponsors",
        "alumni",
      ])
    );
    // Gated sections must not leak through when flags are off.
    expect(ids).not.toContain("tech-committee");
    expect(ids).not.toContain("committee-head-nominations");
    expect(ids).not.toContain("elections");
    expect(ids).not.toContain("announcements");
    expect(ids).not.toContain("photos");
  });

  it("shows every section to a primary officer", () => {
    const ids = idsFor({ isOfficer: true, isPrimary: true });
    expect(ids).toEqual([
      "purchasing",
      "attendance",
      "mentoring",
      "tech-committee",
      "committee-head-nominations",
      "positions",
      "users",
      "sponsors",
      "alumni",
      "elections",
      "announcements",
      "photos",
    ]);
  });

  it("shows Photos to SE admins but not Elections / Announcements", () => {
    const ids = idsFor({ isSeAdmin: true });
    expect(ids).toContain("photos");
    expect(ids).not.toContain("elections");
    expect(ids).not.toContain("announcements");
    expect(ids).not.toContain("tech-committee");
  });

  it("unlocks Tech Committee Apps for the tech head", () => {
    expect(idsFor({ isTechCommitteeHead: true })).toContain("tech-committee");
  });

  it("unlocks Tech Committee Apps for a division manager", () => {
    expect(idsFor({ isTechCommitteeDivisionManager: true })).toContain(
      "tech-committee"
    );
  });

  it("does not unlock Tech Committee Apps for a plain officer", () => {
    expect(idsFor({ isOfficer: true })).not.toContain("tech-committee");
  });

  it("Photos shows for officers even without SE-admin status", () => {
    expect(idsFor({ isOfficer: true })).toContain("photos");
  });

  it("Elections / Announcements stay primary-only", () => {
    expect(idsFor({ isOfficer: true })).not.toContain("elections");
    expect(idsFor({ isOfficer: true })).not.toContain("announcements");
    expect(idsFor({ isOfficer: true })).not.toContain(
      "committee-head-nominations"
    );
    expect(idsFor({ isPrimary: true })).toContain("elections");
    expect(idsFor({ isPrimary: true })).toContain("announcements");
    expect(idsFor({ isPrimary: true })).toContain(
      "committee-head-nominations"
    );
  });
});
