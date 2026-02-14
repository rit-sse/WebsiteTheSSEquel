import prisma from "@/lib/prisma";
import { AcademicTerm, hasTermPassed } from "@/lib/academicTerm";

function canCreateCandidate(user: {
  graduationTerm: AcademicTerm | null;
  graduationYear: number | null;
}) {
  return Boolean(
    user.graduationTerm &&
      user.graduationYear &&
      hasTermPassed(user.graduationTerm, user.graduationYear)
  );
}

export async function maybeCreateAlumniCandidate(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      linkedIn: true,
      gitHub: true,
      description: true,
      profileImageKey: true,
      graduationTerm: true,
      graduationYear: true,
      major: true,
      coopSummary: true,
      alumni: { select: { id: true } },
      alumniCandidates: { select: { id: true } },
    },
  });

  if (!user || !canCreateCandidate(user) || user.alumni || user.alumniCandidates.length > 0) {
    return;
  }

  await prisma.alumniCandidate.create({
    data: {
      userId: user.id,
      name: user.name,
      email: user.email,
      linkedIn: user.linkedIn,
      gitHub: user.gitHub,
      description: user.description,
      imageKey: user.profileImageKey,
      graduationTerm: user.graduationTerm,
      graduationYear: user.graduationYear,
      major: user.major,
      coopSummary: user.coopSummary,
      status: "pending",
    },
  });
}
