# Contributing to WebsiteTheSSEquel

This document defines how we plan, build, and merge work so new contributors can onboard quickly and safely.

## Start Here

- Read [Vision and Scope](./documentation/VisionAndScope.md) for project intent.
- Use the GitHub Project storyboard as the source of truth for work: <https://github.com/orgs/rit-sse/projects/2/views/10>.
- Follow the local setup guide: [Environment Setup](./documentation/EnvironmentSetup.md).
- Follow implementation conventions in [Coding Style Guide](./documentation/CodingStyle.md).

## Required Workflow

Every change follows this flow:

1. Create or find a story/ticket in GitHub Projects.
2. Assign yourself to that story before starting work.
3. Create a branch from the story.
4. Implement and test locally.
5. Open a pull request linked to the story.
6. Merge only after review and passing checks.

Do not start or merge undocumented work. If it is not tracked in a story, create one first.

## Branch Naming Convention

Branch names must follow:

`<type>/<story-id>-<short-kebab-summary>`

Allowed `type` values:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `hotfix`
- `dev`

Examples:

- `feat/142-add-alumni-request-approval`
- `fix/315-handle-null-sponsor-logo`
- `docs/402-update-environment-setup`

## Stories and Tickets

Create a ticket/story for every idea, feature, bug, refactor, or docs change.

Each story should include:

- Problem or goal
- Scope (what is in/out)
- Acceptance criteria
- Any dependencies or blockers
- Validation notes (how to verify it works)

Project board expectations:

- Move cards as work progresses (`Backlog` -> `Ready` -> `In Progress` -> `In Review` -> `Done`).
- Keep assignee current (assign yourself when you pick up work).
- Link the PR to the story so status is traceable.

## Pull Request Requirements

Before opening a PR:

1. Rebase or merge latest `dev` into your branch.
2. Commit locally and verify pre-commit hooks run successfully.
   - Pre-commit runs staged-file checks via `lint-staged` from `next/`.
   - If hooks are not installed yet, run `npm install` in `next/`.
3. Run local checks from `next/`:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
4. Run database migration/seed commands if schema changed:
   - `npx prisma migrate dev`
   - `npx prisma db seed` (only when needed for test data validation)

PR description must include:

- Linked story/ticket
- Summary of behavior changes
- Testing completed
- Screenshots for UI changes (if applicable)
- Docs updates made (or reason none were needed)

## Definition of Done

Work is done when:

- Story acceptance criteria are met
- Code review feedback is addressed
- Checks pass
- Documentation is updated
- Story is moved to `Done`

## Documentation Expectations

If your change affects setup, deployment assumptions, dependencies, env vars, or team process:

- Update [Environment Setup](./documentation/EnvironmentSetup.md) in the same PR.
- Update [Coding Style Guide](./documentation/CodingStyle.md) when coding conventions change.
- Update [documentation/README.md](./documentation/README.md) if docs structure changed.
- Call out the docs change in the PR description.
