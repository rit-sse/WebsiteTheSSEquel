# New Member Onboarding

This guide gets a new contributor from zero to a first merged PR with the least possible setup friction.

## Audience

- New Technology Committee members contributing to this repository.
- Returning contributors who need a current setup reset.

## Day 1 Quickstart (60 Minutes)

Use this checklist in order. Do not skip steps.

1. Clone the repo and install dependencies:
   - `git clone https://github.com/rit-sse/WebsiteTheSSEquel.git`
   - `cd WebsiteTheSSEquel`
   - `npm install`
   - `cd next && npm install`
2. Run the app without auth/database first:
   - `npm run dev`
   - Open `http://localhost:3000`
3. Set up local services with Docker (recommended):
   - From repo root: `docker compose -f docker-compose.dev.yml up -d`
4. Create `next/.env` and add required variables (see [EnvironmentSetup.md](./EnvironmentSetup.md)).
5. Build local database:
   - From `next/`: `npx prisma migrate dev`
   - From `next/`: `npx prisma db seed`
6. Verify full local workflow:
   - From `next/`: `npm run lint`
   - From `next/`: `npm run test`
   - From `next/`: `npm run build`
7. Confirm you can sign in and access the pages required for your ticket.

If any step fails, use the troubleshooting section in this document before asking for help.

## Required Access Matrix

Request access on Day 1 so setup does not block your first PR.

| System | Why You Need It | Who Grants Access | What To Request |
| :--- | :--- | :--- | :--- |
| GitHub repo | Clone, branch, PRs | Tech Head or repo admin | Write access to `rit-sse/WebsiteTheSSEquel` |
| GitHub Project board | Story tracking workflow | Tech Head or project admin | Access to project board used in [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Google OAuth credentials | Local sign-in flow | Tech leadership / credential owner | Dev OAuth client ID + secret |
| Postgres (local Docker preferred) | Prisma schema + data | Self-serve | None if using local Docker |
| SMTP provider (or MailHog) | Email flow testing | Tech leadership / credential owner | Dev SMTP credentials, or confirm MailHog-only testing |
| AWS S3 credentials | File upload paths | Tech leadership / credential owner | Dev/test bucket key pair |
| Google Calendar service account | Event integrations | Tech leadership / credential owner | Service account email + private key |

## Minimal vs Full Setup

Use the right mode for your first contribution.

### Minimal mode (fastest path)

Use when working on UI, styles, and pages that do not require authentication or external integrations.

- Required: repo clone, `npm install`, `npm run dev`
- Not required immediately: Google OAuth, S3, SMTP, GCal
- Still required before merge: lint/test/build from `next/`

### Full mode (feature-complete local parity)

Use when working on auth, API routes, DB-backed features, uploads, or email/calendar behavior.

- Required: `next/.env` fully populated
- Required: Prisma migrate + seed
- Required: run and validate affected integration flows locally

## First PR Path

Follow this exact path for your first contribution.

1. Pick a starter issue from the GitHub Project board:
   - Prefer `docs`, small `fix`, or low-risk UI improvements.
2. Assign yourself to the story before coding.
3. Create a branch using the required format:
   - `<type>/<story-id>-<short-kebab-summary>`
   - Example: `docs/512-add-new-member-onboarding-guide`
4. Implement only the scoped change from the acceptance criteria.
5. Run required validation before opening PR:
   - From `next/`: `npm run lint`
   - From `next/`: `npm run test`
   - From `next/`: `npm run build`
6. Open PR and include:
   - Linked story/ticket
   - What changed
   - How you tested
   - Screenshots if UI changed
   - Docs updated (or why none needed)
7. Address review comments and re-run checks after updates.
8. Merge only after approval and passing checks.

## Definition Of Ready (Before You Start Coding)

A ticket is ready when all are true:

- Problem statement is clear.
- Scope and non-goals are explicit.
- Acceptance criteria are testable.
- Required access/secrets are available.
- You can describe how success will be verified locally.

If any item is missing, clarify it before implementation.

## Troubleshooting

### Port `5432` already in use

- Change host mapping in `docker-compose.dev.yml` (example `5433:5432`).
- Update `DATABASE_URL` in `next/.env` to match the new host port.

### `next/.env` values not taking effect

- Restart `npm run dev` after any `.env` change.
- Confirm `.env` is in `next/.env` (not repo root).

### OAuth login fails with redirect URI errors

- Confirm Google OAuth client has:
  - Origin: `http://localhost:3000`
  - Redirect URI: `http://localhost:3000/api/auth/callback/google`
- Confirm `NEXTAUTH_URL=http://localhost:3000`.

### Prisma migration/seed failures

- Confirm local DB is running (`docker compose -f docker-compose.dev.yml up -d`).
- Confirm `DATABASE_URL` points to the running DB.
- Re-run:
  - `npx prisma migrate dev`
  - `npx prisma db seed`

### Tests fail due to external integrations

- Ensure tests mock external providers (SMTP, S3, third-party APIs) per [CodingStyle.md](./CodingStyle.md).
- Avoid coupling tests to live credentials.

## Getting Help

Ask for help early when blocked longer than 30 minutes.

When asking, include:

- What you were trying to do
- The exact command run
- Full error output
- What you already tried

Use:

- GitHub issue/PR comments for ticket-specific questions
- Tech committee communication channel for setup blockers
- Mentoring lab for live debugging support

## Onboarding Completion Checklist

You are considered onboarded when all are true:

- Local app runs in your intended mode (minimal or full).
- You can run lint/test/build from `next/`.
- You can move a ticket through the project workflow.
- You opened at least one PR following [CONTRIBUTING.md](../CONTRIBUTING.md).
- You understand where to update docs when workflow/setup changes.
