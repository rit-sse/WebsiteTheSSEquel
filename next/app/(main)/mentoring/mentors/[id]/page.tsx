import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { NeoCard } from "@/components/ui/neo-card";
import {
  MentorIdentity,
  MentorSpecialties,
  MentorCourses,
} from "@/components/mentoring/MentorCard";
import prisma from "@/lib/prisma";
import { mentorProfileSelect, toMentorProfile } from "@/lib/mentorProfiles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentor Profile | SSE" };

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mentorId = Number(id);
  if (!Number.isSafeInteger(mentorId) || mentorId <= 0) notFound();

  const record = await prisma.mentor.findFirst({
    where: {
      id: mentorId,
      isActive: true,
      expirationDate: { gt: new Date() },
    },
    select: mentorProfileSelect,
  });
  if (!record) notFound();
  const mentor = toMentorProfile(record);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4">
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-md text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>
      <NeoCard className="space-y-8 border-t-4 border-t-primary p-6 md:p-10">
        <div className="space-y-4">
          <h1 className="font-display text-3xl font-bold">Mentor profile</h1>
          <MentorIdentity mentor={mentor} headingLevel="h2" />
        </div>
        <MentorSpecialties skills={mentor.skills} />
        <MentorCourses courses={mentor.courses} />
        <div className="border-t border-border/50 pt-5">
          <Link
            href="/mentoring/schedule"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            View mentoring schedule
          </Link>
        </div>
      </NeoCard>
    </div>
  );
}
