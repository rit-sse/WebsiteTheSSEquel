# Coding Style Guide

This guide defines coding conventions for this repository so contributions stay consistent and reviewable.

## Core Principles

- Optimize for readability over cleverness.
- Prefer simple, testable functions.
- Keep changes scoped to one concern per PR.
- Match existing patterns in nearby files before introducing new patterns.

## TypeScript Conventions

- Use TypeScript for new code; avoid adding new plain JavaScript files.
- Keep `strict` mode compatibility (no `any` unless there is a clear reason).
- Prefer explicit types at API boundaries (request/response payloads, service interfaces).
- Use the `@/*` import alias for app-internal imports in `next/`.
- Use semicolons and keep formatting consistent with existing files.

## Naming Conventions

- `PascalCase` for React components and component files.
- `camelCase` for variables, functions, and hooks.
- `UPPER_SNAKE_CASE` for module-level constants.
- Use descriptive names that reflect behavior (avoid abbreviations unless standard).

## React and Next.js Conventions

- Keep route UI in `next/app/**/page.tsx` and route handlers in `next/app/api/**/route.ts`.
- Keep reusable UI in `next/components/` and shared logic in `next/lib/`.
- Prefer server-first patterns unless interactivity requires a client component.
- Keep components focused; split large components into smaller units when logic/UI becomes hard to scan.
- Avoid unnecessary client-side state when data can be derived from props or fetched server-side.

## API Route Conventions

- Validate request inputs and return clear `4xx` errors for invalid payloads.
- Use consistent status codes and response shapes.
- Avoid leaking internal errors to clients; log details server-side.
- Keep route handlers thin and move reusable business logic into `next/lib/services/` when practical.

## Database and Prisma Conventions

- Treat schema changes as first-class: include migrations with code changes.
- Keep queries intentional: select only fields you need.
- Prefer transactions for multi-step write operations that must succeed together.
- Seed/test data should stay in Prisma seed scripts, not hardcoded in route handlers.

## Testing Conventions

- Add tests for behavior changes and bug fixes when feasible.
- Keep tests focused and deterministic.
- Mock external dependencies (SMTP, S3, third-party APIs) in tests.
- Place tests under `next/__tests__/` and use `*.test.ts` naming.

## Before Opening a PR

From `next/`, run:

1. `npm run lint`
2. `npm run test`
3. `npm run build`

If your change affects setup/process, update docs in the same PR.
