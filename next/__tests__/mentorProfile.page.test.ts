import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, notFound } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));
vi.mock("@/lib/prisma", () => ({ default: { mentor: { findFirst } } }));
vi.mock("next/navigation", () => ({ notFound }));

import MentorProfilePage from "@/app/(main)/mentoring/mentors/[id]/page";
import { mentorProfileSelect } from "@/lib/mentorProfiles";

describe("public mentor profile page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid mentor IDs before querying the database", async () => {
    for (const id of ["abc", "0", "-1", "1.5", "9007199254740992"]) {
      await expect(
        MentorProfilePage({ params: Promise.resolve({ id }) })
      ).rejects.toThrow("NOT_FOUND");
    }
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("returns not found for missing, inactive, or expired mentors", async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      MentorProfilePage({ params: Promise.resolve({ id: "12" }) })
    ).rejects.toThrow("NOT_FOUND");
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 12,
        isActive: true,
        expirationDate: { gt: expect.any(Date) },
      },
      select: mentorProfileSelect,
    });
  });

  it("renders an active mentor without requiring access to private user profiles", async () => {
    findFirst.mockResolvedValue({
      id: 12,
      user: {
        name: "Jane Doe",
        profileImageKey: null,
        googleImageURL: null,
        mentorApplications: [],
      },
      mentorSkill: [],
      courseTaken: [],
    });
    const page = await MentorProfilePage({
      params: Promise.resolve({ id: "12" }),
    });
    expect(page).toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
    expect(Object.keys(mentorProfileSelect.user.select).sort()).toEqual([
      "googleImageURL",
      "mentorApplications",
      "name",
      "profileImageKey",
    ]);
    expect(
      Object.keys(
        mentorProfileSelect.user.select.mentorApplications.select
      ).sort()
    ).toEqual([
      "coursesJson",
      "major",
      "skillsText",
      "toolsComfortable",
      "yearLevel",
    ]);
  });
});
