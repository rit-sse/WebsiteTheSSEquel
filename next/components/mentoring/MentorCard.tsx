import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCategoricalColorFromSeed } from "@/lib/categoricalColors";
import { getInitials } from "@/lib/userDisplay";
import type { MentorProfile } from "@/lib/mentorProfiles";

// Keep the schedule palette while ensuring small badge text meets AA contrast.
function getMentorColor(seed: string | number) {
  const color = getCategoricalColorFromSeed(seed);
  const channels = color.hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return { ...color, foreground: luminance > 0.179 ? "#000000" : "#ffffff" };
}

export function MentorIdentity({
  mentor,
  headingLevel: Heading = "h3",
}: {
  mentor: MentorProfile;
  headingLevel?: "h2" | "h3";
}) {
  const color = getMentorColor(mentor.id);

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
        {mentor.image && (
          <AvatarImage src={mentor.image} alt="" className="object-cover" />
        )}
        <AvatarFallback
          className="text-xl font-bold"
          style={{ backgroundColor: color.fill, color: color.foreground }}
        >
          {getInitials(mentor.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-1">
        <Heading className="break-words font-display text-xl font-bold leading-tight">
          {mentor.name}
        </Heading>
        {(mentor.major || mentor.yearLevel) && (
          <p className="break-words text-sm text-muted-foreground">
            {[mentor.major, mentor.yearLevel].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

export function MentorSpecialties({
  skills,
  limit = skills.length,
}: {
  skills: string[];
  limit?: number;
}) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Specialties
      </p>
      {skills.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Mentor specialties">
          {skills.slice(0, limit).map((skill) => {
            const color = getMentorColor(skill);
            return (
              <li key={skill} className="max-w-full">
                <Badge
                  className="max-w-full break-words border-transparent font-medium"
                  style={{
                    backgroundColor: color.fill,
                    color: color.foreground,
                  }}
                >
                  {skill}
                </Badge>
              </li>
            );
          })}
          {skills.length > limit && (
            <li className="self-center text-xs text-muted-foreground">
              +{skills.length - limit} more
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No specialties listed yet.
        </p>
      )}
    </div>
  );
}

export function MentorCourses({
  courses,
  limit = courses.length,
}: {
  courses: string[];
  limit?: number;
}) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        Courses taken
      </p>
      {courses.length ? (
        <ul className="space-y-1 text-sm" aria-label="Courses taken">
          {courses.slice(0, limit).map((course) => (
            <li key={course} className="break-words">
              {course}
            </li>
          ))}
          {courses.length > limit && (
            <li className="text-xs text-muted-foreground">
              +{courses.length - limit} more on profile
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No courses listed yet.</p>
      )}
    </div>
  );
}

export function MentorCard({ mentor }: { mentor: MentorProfile }) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-surface-2 shadow-sm neo:border-2 neo:border-black neo:shadow-[3px_3px_0_0_#000]">
      <div className="h-1.5 bg-primary" />
      <div className="flex flex-1 flex-col gap-5 p-5">
        <MentorIdentity mentor={mentor} />
        <MentorSpecialties skills={mentor.skills} limit={4} />
        <MentorCourses courses={mentor.courses} limit={3} />
        <Link
          href={`/mentoring/mentors/${mentor.id}`}
          aria-label={`View ${mentor.name}'s mentor profile`}
          className="mt-auto flex min-h-[44px] items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2"
        >
          View mentor profile
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
