# Project Documentation

Use this folder as the source of truth for onboarding, architecture context, and development process.

## Read Order for New Members

1. [Vision and Scope](./VisionAndScope.md)
2. [Environment Setup](./EnvironmentSetup.md)
3. [Contributing Guide](../CONTRIBUTING.md)
4. [Coding Style Guide](./CodingStyle.md)

## Documents in This Folder

- `VisionAndScope.md`: product goals, scope boundaries, and project intent.
- `EnvironmentSetup.md`: local environment setup, required secrets, and local parity workflow.
- `CodingStyle.md`: coding conventions for TypeScript, React/Next, API routes, and testing.
- `ArchivedSchema.sql`: historical schema snapshot.
- Diagram/image files: ERD/domain model references.

## Documentation Standards

- Keep docs in sync with real workflows. Do not keep "future state" instructions here.
- If a PR changes setup/dependencies/env vars/developer flow, update docs in the same PR.
- Prefer precise commands over general advice.
- Prefer "how to verify" sections so contributors can confirm behavior locally.

## Process Conventions

- Every implementation idea should be represented as a story/ticket.
- Work should be tracked in the GitHub Project storyboard and assigned to the person doing it.
- Branching, PR, and merge rules are defined in [CONTRIBUTING.md](../CONTRIBUTING.md).
