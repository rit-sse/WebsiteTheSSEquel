# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router project. Keep route UI and route handlers under `app/` (for example, `app/(main)/events/page.tsx` and `app/api/*/route.ts`). Reusable UI belongs in `components/` (`components/ui` for shared primitives, `components/common` for site-wide widgets). Shared logic lives in `lib/`, cross-cutting React state in `contexts/`, and hooks in `hooks/`.

Database code is in `prisma/` (`schema.prisma`, `migrations/`, `seed.ts`). Static files go in `public/`. Tests currently live in `__tests__/`.

## Build, Test, and Development Commands

- `npm run dev`: start local dev server on `http://localhost:3000` with required env defaults.
- `npm run build`: production Next.js build.
- `npm run start`: run the production server.
- `npm run lint`: run ESLint (`next/core-web-vitals`).
- `npm test`: run Vitest tests.
- `npx prisma migrate dev`: create/apply local schema migrations.
- `npx prisma db seed`: seed development data.

## Coding Style & Naming Conventions

TypeScript is strict (`tsconfig.json`) and uses the `@/*` import alias. Follow Prettier config: 2-space indentation, semicolons, double quotes, trailing commas (`es5`), 80-char line width. Use:

- `PascalCase` for React components (`ProjectCard.tsx`)
- `camelCase` for variables/functions
- `kebab-case` for route segment folders when appropriate

Run `npm run lint` before opening a PR.

## Testing Guidelines

Vitest is configured via `vitest.config.ts` with `vitest.setup.ts`, and tests run in a Node environment. Add tests in `__tests__/` using `*.test.ts` naming (example: `__tests__/api.test.ts`). Prefer focused route/unit tests with explicit mocks for Prisma and external services.

## Commit & Pull Request Guidelines

Recent history favors short, imperative commit subjects (for example, `fix prisma error`, `added mentoring hours to the website`). Keep commits small and scoped to one concern.

## Ticket-First Workflow (Required)

Before any implementation work starts, ensure there is a GitHub story/ticket for the change.

- If no ticket exists, create one using the repository issue templates (Story/Task/Bug as appropriate).
- Add the ticket to the GitHub Project storyboard and assign it to the implementer.
- Include the ticket link/ID in the PR description and reference it in branch naming when practical.
- Do not start coding until the ticket exists and is tracked on the project board.

PRs should include:

- clear description of behavior changes
- linked issue/ticket when available
- screenshots or recordings for UI updates
- notes for schema/env changes (migration name, new env vars)
