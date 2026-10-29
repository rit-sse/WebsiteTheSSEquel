import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  default: { scheduleBlock: { findMany } },
}));

import {
  getCurrentMentoringSlot,
  getCurrentMentors,
} from "@/lib/currentMentors";
import { mentorProfileSelect, toMentorProfile } from "@/lib/mentorProfiles";

const mentor = {
  id: 12,
  user: {
    name: "Jane Doe",
    profileImageKey: null,
    googleImageURL: "/avatar.png",
    mentorApplications: [
      {
        major: "CS",
        yearLevel: "3rd Year",
        coursesJson: '["CSCI-141", "CSCI-142"]',
        skillsText: "Python, Java; Python\nGit",
        toolsComfortable: "Git, Linux",
      },
    ],
  },
  mentorSkill: [],
  courseTaken: [],
};

describe("current mentor profiles", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T18:30:00Z"));
    findMany.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("uses Rochester local time across winter, summer, and midnight", () => {
    expect(getCurrentMentoringSlot(new Date("2026-01-12T15:00:00Z"))).toEqual({
      weekday: 1,
      startHour: 10,
    });
    expect(getCurrentMentoringSlot(new Date("2026-07-13T14:00:00Z"))).toEqual({
      weekday: 1,
      startHour: 10,
    });
    expect(getCurrentMentoringSlot(new Date("2026-10-20T03:30:00Z"))).toEqual({
      weekday: 1,
      startHour: 23,
    });
  });

  it("loads only scheduled, active, unexpired mentors and deduplicates schedules", async () => {
    findMany.mockResolvedValue([{ mentor }, { mentor }]);
    const profiles = await getCurrentMentors();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe("Jane Doe");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          weekday: { equals: 1 },
          startHour: 14,
          schedule: { isActive: true },
          mentor: {
            isActive: true,
            expirationDate: { gt: new Date("2026-10-19T18:30:00Z") },
          },
        },
      })
    );
  });

  it("uses approved application specialties and courses when assignments are missing", () => {
    expect(toMentorProfile(mentor)).toEqual({
      id: 12,
      name: "Jane Doe",
      image: "/avatar.png",
      major: "CS",
      yearLevel: "3rd Year",
      skills: ["Python", "Java", "Git", "Linux"],
      courses: ["CSCI-141", "CSCI-142"],
    });
    expect(mentorProfileSelect.user.select.mentorApplications.where).toEqual({
      status: "approved",
    });
  });

  it("prefers curated mentoring assignments over application text", () => {
    const profile = toMentorProfile({
      ...mentor,
      mentorSkill: [{ skill: { id: 1, skill: "TypeScript" } }],
      courseTaken: [
        {
          course: {
            code: 261,
            title: "Introduction to Software Engineering",
            department: { shortTitle: "SWEN" },
          },
        },
      ],
    });
    expect(profile.skills).toEqual(["TypeScript"]);
    expect(profile.courses).toEqual([
      "SWEN-261: Introduction to Software Engineering",
    ]);
  });

  it("handles missing profiles and malformed or mixed course data", () => {
    const empty = toMentorProfile({
      ...mentor,
      user: { ...mentor.user, googleImageURL: null, mentorApplications: [] },
    });
    expect(empty).toMatchObject({
      image: null,
      major: null,
      yearLevel: null,
      skills: [],
      courses: [],
    });
    for (const coursesJson of [
      "invalid",
      "{}",
      '[null, 123, "CSCI-141", "CSCI-141", ""]',
    ]) {
      const profile = toMentorProfile({
        ...mentor,
        user: {
          ...mentor.user,
          mentorApplications: [
            { ...mentor.user.mentorApplications[0], coursesJson },
          ],
        },
      });
      expect(profile.courses).toEqual(
        coursesJson.startsWith("[") ? ["CSCI-141"] : []
      );
    }
  });

  it("returns an empty list when no mentors are scheduled", async () => {
    findMany.mockResolvedValue([]);
    expect(await getCurrentMentors()).toEqual([]);
  });
});
