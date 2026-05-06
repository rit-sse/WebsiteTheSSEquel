import { describe, expect, it } from "vitest";
import {
  buildNavGroups,
  buildTopLevelNavItems,
  type CmsNavPage,
} from "@/lib/navbarConfig";

const groupTitles = (isSeAdmin = false) =>
  buildNavGroups({ isSeAdmin }).map((group) => group.label);

const studentTitles = (
  activeElection: { slug: string; status: string } | null = null
) =>
  buildNavGroups({
    isSeAdmin: false,
    activeElection: activeElection as Parameters<
      typeof buildNavGroups
    >[0]["activeElection"],
  })
    .find((group) => group.value === "students")
    ?.items.map((item) => item.title) ?? [];

describe("buildNavGroups", () => {
  it("hides SE Office links from non-SE Office users", () => {
    expect(groupTitles(false)).toEqual(["Students", "Alumni", "Companies"]);
  });

  it("shows SE Office links to SE Office users", () => {
    const groups = buildNavGroups({ isSeAdmin: true });
    expect(groups.map((group) => group.label)).toEqual([
      "Students",
      "Alumni",
      "Companies",
      "SE Office",
    ]);
    expect(
      groups
        .find((group) => group.value === "se-office")
        ?.items.map((item) => item.title)
    ).toEqual([
      "Leadership",
      "Committees",
      "Constitution",
      "Primary Policy",
    ]);
  });

  it("keeps the requested student links with compact labels", () => {
    expect(studentTitles()).toEqual([
      "Committee Head",
      "Tech Committee",
      "Mentor",
      "Get Involved",
      "Constitution",
      "Primary Policy",
      "Projects",
      "Events",
      "Membership Leaderboard",
      "Mentor Schedule",
      "Library",
    ]);
    expect(studentTitles()).not.toContain("Go Links");
    expect(studentTitles()).not.toContain("Leaderboard");
  });

  it("shows Elections only while nominations or voting are open", () => {
    for (const status of ["NOMINATIONS_OPEN", "VOTING_OPEN"]) {
      const titles = studentTitles({ slug: "spring-2026", status });
      expect(titles[0]).toBe("Elections");
    }
  });

  it("hides Elections outside public open election phases", () => {
    for (const status of [
      "DRAFT",
      "NOMINATIONS_CLOSED",
      "VOTING_CLOSED",
      "TIE_RUNOFF_REQUIRED",
      "CERTIFIED",
      "CANCELLED",
    ]) {
      expect(studentTitles({ slug: "spring-2026", status })).not.toContain(
        "Elections"
      );
    }
    expect(studentTitles(null)).not.toContain("Elections");
  });

  it("lets CMS page settings hide existing nav links", () => {
    const cmsPages: CmsNavPage[] = [
      {
        slug: "projects",
        title: "Projects",
        status: "DRAFT",
        showInNav: false,
        navSection: "STUDENTS",
        navLabel: null,
        navOrder: 700,
      },
    ];
    const students =
      buildNavGroups({ isSeAdmin: false, cmsPages })
        .find((group) => group.value === "students")
        ?.items.map((item) => item.title) ?? [];
    expect(students).not.toContain("Projects");
  });

  it("adds published CMS-only pages to the configured nav section", () => {
    const cmsPages: CmsNavPage[] = [
      {
        slug: "lab-rules",
        title: "Lab Rules",
        status: "PUBLISHED",
        showInNav: true,
        navSection: "STUDENTS",
        navLabel: "Lab Rules",
        navOrder: 50,
      },
    ];
    const students =
      buildNavGroups({ isSeAdmin: false, cmsPages })
        .find((group) => group.value === "students")
        ?.items.map((item) => item.title) ?? [];
    expect(students[0]).toBe("Lab Rules");
  });

  it("lets CMS settings control top-level shortcuts", () => {
    const cmsPages: CmsNavPage[] = [
      {
        slug: "photos",
        title: "Photos",
        status: "DRAFT",
        showInNav: false,
        navSection: "TOP_LEVEL",
        navLabel: null,
        navOrder: 200,
      },
    ];
    expect(buildTopLevelNavItems({ cmsPages }).map((item) => item.title)).toEqual([
      "About",
    ]);
  });
});
