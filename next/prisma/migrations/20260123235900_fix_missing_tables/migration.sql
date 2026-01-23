-- Fix missing tables - uses IF NOT EXISTS to be safe

-- CreateTable Alumni (from 20260113020722_init)
CREATE TABLE IF NOT EXISTS "Alumni" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "linkedIn" TEXT,
    "gitHub" TEXT,
    "description" TEXT,
    "image" TEXT NOT NULL DEFAULT 'https://source.boringavatars.com/beam/',
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "quote" TEXT NOT NULL DEFAULT '',
    "previous_roles" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable AlumniRequest (from 20260115065828_add_alumni_request_model)
CREATE TABLE IF NOT EXISTS "AlumniRequest" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "linkedIn" TEXT,
    "gitHub" TEXT,
    "description" TEXT,
    "image" TEXT NOT NULL DEFAULT 'https://source.boringavatars.com/beam/',
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "quote" TEXT NOT NULL DEFAULT '',
    "previous_roles" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlumniRequest_pkey" PRIMARY KEY ("id")
);