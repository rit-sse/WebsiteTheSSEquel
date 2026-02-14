-- Backfill mentoring schema for environments that missed mentoring-branch migrations.
-- This migration is additive only (no drops), designed to avoid data loss.

-- Add missing Invitation column used by mentor invitations.
ALTER TABLE "Invitation"
ADD COLUMN IF NOT EXISTS "applicationId" INTEGER;

-- MentorSchedule
CREATE TABLE IF NOT EXISTS "MentorSchedule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MentorSchedule_pkey" PRIMARY KEY ("id")
);

-- MentorSemester
CREATE TABLE IF NOT EXISTS "MentorSemester" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "when2meetUrl" TEXT,
    "applicationOpen" TIMESTAMP(3),
    "applicationClose" TIMESTAMP(3),
    "semesterStart" TIMESTAMP(3),
    "semesterEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "scheduleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MentorSemester_pkey" PRIMARY KEY ("id")
);

-- MentorApplication
CREATE TABLE IF NOT EXISTS "MentorApplication" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "discordUsername" TEXT NOT NULL,
    "pronouns" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "yearLevel" TEXT NOT NULL,
    "coursesJson" TEXT NOT NULL,
    "skillsText" TEXT NOT NULL,
    "toolsComfortable" TEXT NOT NULL,
    "toolsLearning" TEXT NOT NULL,
    "previousSemesters" INTEGER NOT NULL DEFAULT 0,
    "whyMentor" TEXT NOT NULL,
    "comments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MentorApplication_pkey" PRIMARY KEY ("id")
);

-- MentorAvailability
CREATE TABLE IF NOT EXISTS "MentorAvailability" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "slots" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MentorAvailability_pkey" PRIMARY KEY ("id")
);

-- MentorHeadcountEntry
CREATE TABLE IF NOT EXISTS "MentorHeadcountEntry" (
    "id" SERIAL NOT NULL,
    "semesterId" INTEGER,
    "peopleInLab" INTEGER NOT NULL,
    "feeling" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentorHeadcountEntry_pkey" PRIMARY KEY ("id")
);

-- MentorHeadcountMentor
CREATE TABLE IF NOT EXISTS "MentorHeadcountMentor" (
    "id" SERIAL NOT NULL,
    "entryId" INTEGER NOT NULL,
    "mentorId" INTEGER NOT NULL,
    CONSTRAINT "MentorHeadcountMentor_pkey" PRIMARY KEY ("id")
);

-- MenteeHeadcountEntry
CREATE TABLE IF NOT EXISTS "MenteeHeadcountEntry" (
    "id" SERIAL NOT NULL,
    "semesterId" INTEGER,
    "studentsMentoredCount" INTEGER NOT NULL,
    "testsCheckedOutCount" INTEGER NOT NULL,
    "otherClassText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenteeHeadcountEntry_pkey" PRIMARY KEY ("id")
);

-- MenteeHeadcountMentor
CREATE TABLE IF NOT EXISTS "MenteeHeadcountMentor" (
    "id" SERIAL NOT NULL,
    "entryId" INTEGER NOT NULL,
    "mentorId" INTEGER NOT NULL,
    CONSTRAINT "MenteeHeadcountMentor_pkey" PRIMARY KEY ("id")
);

-- MenteeHeadcountCourse
CREATE TABLE IF NOT EXISTS "MenteeHeadcountCourse" (
    "id" SERIAL NOT NULL,
    "entryId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    CONSTRAINT "MenteeHeadcountCourse_pkey" PRIMARY KEY ("id")
);

-- ScheduleBlock
CREATE TABLE IF NOT EXISTS "ScheduleBlock" (
    "id" SERIAL NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "mentorId" INTEGER NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    CONSTRAINT "ScheduleBlock_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Invitation_applicationId_key"
ON "Invitation"("applicationId");

CREATE UNIQUE INDEX IF NOT EXISTS "MentorApplication_userId_semesterId_key"
ON "MentorApplication"("userId", "semesterId");

CREATE UNIQUE INDEX IF NOT EXISTS "MentorAvailability_userId_semesterId_key"
ON "MentorAvailability"("userId", "semesterId");

CREATE UNIQUE INDEX IF NOT EXISTS "MentorHeadcountMentor_entryId_mentorId_key"
ON "MentorHeadcountMentor"("entryId", "mentorId");

CREATE UNIQUE INDEX IF NOT EXISTS "MenteeHeadcountMentor_entryId_mentorId_key"
ON "MenteeHeadcountMentor"("entryId", "mentorId");

CREATE UNIQUE INDEX IF NOT EXISTS "MenteeHeadcountCourse_entryId_courseId_key"
ON "MenteeHeadcountCourse"("entryId", "courseId");

CREATE UNIQUE INDEX IF NOT EXISTS "ScheduleBlock_scheduleId_weekday_startHour_mentorId_key"
ON "ScheduleBlock"("scheduleId", "weekday", "startHour", "mentorId");

-- Foreign keys (guarded for idempotency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invitation_applicationId_fkey') THEN
        ALTER TABLE "Invitation"
        ADD CONSTRAINT "Invitation_applicationId_fkey"
        FOREIGN KEY ("applicationId") REFERENCES "MentorApplication"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MentorSemester_scheduleId_fkey') THEN
        ALTER TABLE "MentorSemester"
        ADD CONSTRAINT "MentorSemester_scheduleId_fkey"
        FOREIGN KEY ("scheduleId") REFERENCES "MentorSchedule"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MentorApplication_userId_fkey') THEN
        ALTER TABLE "MentorApplication"
        ADD CONSTRAINT "MentorApplication_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MentorApplication_semesterId_fkey') THEN
        ALTER TABLE "MentorApplication"
        ADD CONSTRAINT "MentorApplication_semesterId_fkey"
        FOREIGN KEY ("semesterId") REFERENCES "MentorSemester"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MentorAvailability_userId_fkey') THEN
        ALTER TABLE "MentorAvailability"
        ADD CONSTRAINT "MentorAvailability_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MentorAvailability_semesterId_fkey') THEN
        ALTER TABLE "MentorAvailability"
        ADD CONSTRAINT "MentorAvailability_semesterId_fkey"
        FOREIGN KEY ("semesterId") REFERENCES "MentorSemester"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MentorHeadcountEntry_semesterId_fkey') THEN
        ALTER TABLE "MentorHeadcountEntry"
        ADD CONSTRAINT "MentorHeadcountEntry_semesterId_fkey"
        FOREIGN KEY ("semesterId") REFERENCES "MentorSemester"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MentorHeadcountMentor_entryId_fkey') THEN
        ALTER TABLE "MentorHeadcountMentor"
        ADD CONSTRAINT "MentorHeadcountMentor_entryId_fkey"
        FOREIGN KEY ("entryId") REFERENCES "MentorHeadcountEntry"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MentorHeadcountMentor_mentorId_fkey') THEN
        ALTER TABLE "MentorHeadcountMentor"
        ADD CONSTRAINT "MentorHeadcountMentor_mentorId_fkey"
        FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MenteeHeadcountEntry_semesterId_fkey') THEN
        ALTER TABLE "MenteeHeadcountEntry"
        ADD CONSTRAINT "MenteeHeadcountEntry_semesterId_fkey"
        FOREIGN KEY ("semesterId") REFERENCES "MentorSemester"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MenteeHeadcountMentor_entryId_fkey') THEN
        ALTER TABLE "MenteeHeadcountMentor"
        ADD CONSTRAINT "MenteeHeadcountMentor_entryId_fkey"
        FOREIGN KEY ("entryId") REFERENCES "MenteeHeadcountEntry"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MenteeHeadcountMentor_mentorId_fkey') THEN
        ALTER TABLE "MenteeHeadcountMentor"
        ADD CONSTRAINT "MenteeHeadcountMentor_mentorId_fkey"
        FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MenteeHeadcountCourse_entryId_fkey') THEN
        ALTER TABLE "MenteeHeadcountCourse"
        ADD CONSTRAINT "MenteeHeadcountCourse_entryId_fkey"
        FOREIGN KEY ("entryId") REFERENCES "MenteeHeadcountEntry"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MenteeHeadcountCourse_courseId_fkey') THEN
        ALTER TABLE "MenteeHeadcountCourse"
        ADD CONSTRAINT "MenteeHeadcountCourse_courseId_fkey"
        FOREIGN KEY ("courseId") REFERENCES "Course"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleBlock_mentorId_fkey') THEN
        ALTER TABLE "ScheduleBlock"
        ADD CONSTRAINT "ScheduleBlock_mentorId_fkey"
        FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ScheduleBlock_scheduleId_fkey') THEN
        ALTER TABLE "ScheduleBlock"
        ADD CONSTRAINT "ScheduleBlock_scheduleId_fkey"
        FOREIGN KEY ("scheduleId") REFERENCES "MentorSchedule"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
