import type { Prisma } from "@prisma/client";
import { resolveUserImage } from "@/lib/s3Utils";

// Only select the fields used by the public mentoring UI.
export const mentorProfileSelect = {
  id: true,
  user: {
    select: {
      name: true,
      profileImageKey: true,
      googleImageURL: true,
      mentorApplications: {
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          major: true,
          yearLevel: true,
          coursesJson: true,
          skillsText: true,
          toolsComfortable: true,
        },
      },
    },
  },
  mentorSkill: {
    select: { skill: { select: { id: true, skill: true } } },
  },
  courseTaken: {
    select: {
      course: {
        select: {
          title: true,
          code: true,
          department: { select: { shortTitle: true } },
        },
      },
    },
  },
} satisfies Prisma.MentorSelect;

type MentorRecord = Prisma.MentorGetPayload<{
  select: typeof mentorProfileSelect;
}>;

export interface MentorProfile {
  id: number;
  name: string;
  image: string | null;
  major: string | null;
  yearLevel: string | null;
  skills: string[];
  courses: string[];
}

function uniqueLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  return labels
    .map((label) => label.trim())
    .filter((label) => {
      const key = label.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function parseCourses(value: string | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((course): course is string => typeof course === "string")
      : [];
  } catch {
    return [];
  }
}

export function toMentorProfile(mentor: MentorRecord): MentorProfile {
  const application = mentor.user.mentorApplications[0];
  const assignedSkills = mentor.mentorSkill.map(({ skill }) => skill.skill);
  const assignedCourses = mentor.courseTaken.map(
    ({ course }) =>
      `${course.department.shortTitle}-${course.code}: ${course.title}`
  );

  return {
    id: mentor.id,
    name: mentor.user.name,
    image: resolveUserImage(
      mentor.user.profileImageKey,
      mentor.user.googleImageURL
    ),
    major: application?.major || null,
    yearLevel: application?.yearLevel || null,
    skills: uniqueLabels(
      assignedSkills.length
        ? assignedSkills
        : [application?.skillsText, application?.toolsComfortable]
            .filter(Boolean)
            .join(",")
            .split(/[,;\n]+/)
    ),
    courses: uniqueLabels(
      assignedCourses.length
        ? assignedCourses
        : parseCourses(application?.coursesJson)
    ),
  };
}
