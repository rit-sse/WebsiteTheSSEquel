# Society of Software Engineers Website: the SSEquel

This repo contains the source code for the Society of Software Engineers' website. Built using Next.js, the website is a hub for information about the SSE and provides tools to manage its various data needs.

## Directory Structure

- `next` directory holds the Next.js application bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
- `documentation` directory contains project documentation including wireframes, domain models, ERDs, etc.

## Quickstart

From the repository root:

1. Bootstrap local development:

   `pnpm run setup:dev`

   This command installs app dependencies, starts local Docker services, and runs database setup commands.

2. Start the app:

   `pnpm run dev`

3. Open the app at:

   `http://localhost:3000`

## Developer Commands (from repo root)

- `pnpm run dev` — start local development server
- `pnpm run lint` — run lint checks
- `pnpm run test` — run tests
- `pnpm run typecheck` — run TypeScript type checks
- `pnpm run build` — run production build
- `pnpm run check` — run lint + test + typecheck

## Environment Setup

Follow our [environment setup guide](documentation/EnvironmentSetup.md) to get started with the project.

After installing dependencies from the repository root, copy `next/.env.example` to `next/.env` and run `pnpm run env:check` before starting the dev server.

## Required VSCode Extensions

- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss): bradlc.vscode-tailwindcss (Tailwind CSS IntelliSense)
- [PostCSS Language Support](https://marketplace.visualstudio.com/items?itemName=csstools.postcss): csstools.postcss (required for Tailwind CSS IntelliSense)
- [Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma): Prisma.prisma (Prisma file syntax highlighting, formatting, completions, and linting)

Recommended VSCode Extensions:

- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens): eamodio.gitlens (GOATed extension for git)

## Contributing

If you wish to contribute to the project, please follow the guidelines in the [CONTRIBUTING.md](CONTRIBUTING.md) file. We welcome contributions of all kinds, including bug fixes, new features, and documentation improvements. Additionally, please stop by the mentoring lab at GOL-1670 to ask questions or get help with your contributions. We are happy to help you get started!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
