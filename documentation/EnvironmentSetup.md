# Environment Setup

This guide should mirror what is needed to safely run and validate changes before merging into `dev`.

## Local-Prod Parity Policy

- Local setup should reflect production-relevant dependencies and configuration as closely as practical.
- If you add/change infrastructure assumptions (env vars, integrations, runtime requirements), update this document in the same PR.
- Do not merge setup-affecting changes without verifying local behavior end to end.

## Pre-Merge Validation (Required)

Before requesting review, validate from the `next/` directory:

1. `npm run env:check`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. `npx prisma migrate dev` (if schema changed)
6. `npx prisma db seed` (if your change requires seeded test data)

If any step fails, fix or document why it is intentionally skipped.

1. Install Node.js. This repo defaults to Node.js `25.9.0` for forward-compatibility testing and also supports Node.js `24.x` LTS for contributors who prefer the current long-term support line.

   > [!NOTE]
   > We recommend using [`fnm`](https://www.fnmnode.com/guide/install.html) so your shell automatically switches to the default version in [`next/.nvmrc`](../next/.nvmrc) when you enter the app directory.

   On macOS with Homebrew:

   ```bash
   brew install fnm
   ```

   On macOS or Linux without Homebrew:

   ```bash
   curl -fsSL https://fnm.vercel.app/install | bash
   ```

   On Windows with Winget:

   ```powershell
   winget install Schniz.fnm
   ```

   Add fnm auto-switching to your Zsh or Bash profile:

   ```bash
   eval "$(fnm env --use-on-cd)"
   ```

   On Windows PowerShell, add fnm auto-switching to your PowerShell profile:

   ```powershell
   fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
   ```

   Then install and use the project Node version:

   ```bash
   cd next
   fnm install
   fnm use
   node -v
   ```

   > [!IMPORTANT]
   > `node -v` should print `v25.9.0` when using the repo default. If you use another Node version manager, install Node.js `25.9.0` or Node.js `24.x` LTS and switch to it before running npm commands.

   If you already use [`nvm`](https://github.com/nvm-sh/nvm), you can use the same version file instead:

   ```bash
   cd next
   nvm install
   nvm use
   ```

2. Clone or fork this repository. You can do this by running `git clone https://github.com/rit-sse/WebsiteTheSSEquel.git` in your terminal in the directory you want to clone the repository to.

3. Run `npm run setup:dev` to install app dependencies, start local Docker services, and run database setup commands.

4. Navigate to the directory you cloned the repository to and run `cd ./next`. This will take you to the `next` directory, which is where the Next.js application is located.

5. Copy the environment template and fill in your local values:

   - `cp .env.example .env`

6. Run `npm run env:check` to validate required environment variables before starting the app.

7. Run `npm run dev` to start the development server. You can view the website at `localhost:3000`.

At this point, you should be able to explore the site without logging in or having to set up a database. In order to have authentication and access to the database, you will need to set up a `.env` file. This file is not included in the repository because it contains sensitive information. Start by copying `.env.example` to `.env`, then update values for your local environment. The `.env` file should be located in the `next` directory. Use this template (matching `next/.env.example`):

```
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ssequel_dev"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
SESSION_COOKIE_NAME="next-auth.session-token"
GITHUB_APP_ID=""
GITHUB_APP_PRIVATE_KEY=""
GITHUB_APP_INSTALLATION_ID=""
GITHUB_WEBHOOK_SECRET=""
GITHUB_PAT=""

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Google Calendar
GCAL_CLIENT_EMAIL=""
GCAL_PRIVATE_KEY=""
GCAL_CAL_ID=""

# AWS S3
AWS_S3_BUCKET_NAME=""
AWS_S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=""
NEXT_PUBLIC_AWS_S3_REGION=""

# SMTP
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_USER="dev"
SMTP_PASS="dev"

# Runtime
INTERNAL_API_URL="http://localhost:3000"
STAGING_PROXY_AUTH="false"
NEXT_PUBLIC_ENV="dev"
NEXT_PUBLIC_COMMIT_HASH="dev"
PORT="3000"
```

The above is just a placeholder, you'll need to fill in each entry with the appropriate information. First, let's step through setting up a local database.

## Setting up a local database

### Option A (Recommended): Docker Compose local services

You do **not** need PostgreSQL installed directly on your computer if you use Docker.

**Ensure you have docker installed if you use this option**

1. Start local services from the repo root:
   - `docker compose -f docker-compose.dev.yml up -d`
2. Use this `DATABASE_URL` in `next/.env`:
   - `postgresql://postgres:postgres@localhost:5432/ssequel_dev`
3. (Optional) Use MailHog UI for local email testing:
   - `http://localhost:8025`
4. If you want to inspect the DB with pgAdmin, connect to:
   - Host: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Password: `postgres`
   - Database: `ssequel_dev`
   
     1. If port `5432` is already used on your machine, update `docker-compose.dev.yml` to map another host port (for example `5433:5432`) and update `DATABASE_URL` accordingly.*
5. When finished, in the repo root run the following to shut down services when not needed:
   - `docker compose down`
### Option B: Native PostgreSQL install

1. Download and install [PostgreSQL](https://www.postgresql.org/download/) 14. *Make sure you're installing 14, not any higher versions!* This is the database management system we are using for the project. When you visit the downloads page, click on your operating system and look for the following in the subsequent page: [![PostgreSQL 14 Download Page](https://i.imgur.com/VlfCWO6.png)](https://www.postgresql.org/download/)

2. Run the installer and follow the instructions to install PostgreSQL. Make sure you remember the password you set for the database superuser.

3. Open up pgAdmin 4. This should have been installed along with PostgreSQL. Click on the `Servers` dropdown in the top left corner and select `PostgreSQL 14`. You will be prompted to enter the password you set for the database superuser.

4. Create a new database by right clicking on `Databases` and selecting `Create > Database...`. Name the database something like `ssequel-dev` and click `Save`.

5. Fill in the `DATABASE_URL` entry in `.env`. The `DATABASE_URL` format is: `postgresql://<username>:<password>@localhost:5432/<database name>`.

### Amendment feature setup

If you are using the constitution amendment workflow:

- Preferred: create a private GitHub App installed on `rit-sse/governing-docs`.
- Grant repository permissions:
  - `Contents: Read and write`
  - `Pull requests: Read and write`
- Set these runtime env vars on the Next.js container:
  - `GITHUB_APP_ID`
  - `GITHUB_APP_PRIVATE_KEY`
  - `GITHUB_WEBHOOK_SECRET`
- Optional:
  - `GITHUB_APP_INSTALLATION_ID` if you want to pin the installation instead of letting the app auto-discover its installation on `rit-sse/governing-docs`
- Legacy fallback:
  - `GITHUB_PAT` still works if GitHub App env vars are not set, but the GitHub App flow is the deployment target going forward.
- Keep all secrets out of source control and never expose them in client-side code.

Example compose-style deployment snippet:

```yaml
services:
  website:
    environment:
      GITHUB_APP_ID: ${GITHUB_APP_ID}
      GITHUB_APP_PRIVATE_KEY: ${GITHUB_APP_PRIVATE_KEY}
      GITHUB_WEBHOOK_SECRET: ${GITHUB_WEBHOOK_SECRET}
      GITHUB_APP_INSTALLATION_ID: ${GITHUB_APP_INSTALLATION_ID}
```

## Setting up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project. Name the project something like `ssequel-dev`.

2. Navigate to `APIs & Services` and go to the [Credentials tab](https://console.cloud.google.com/apis/credentials). Click on `Create Credentials` and select `OAuth client ID`.

3. On the next screen, select `Configure consent screen`.

4. Select `External` and click `Create`.

5. Fill in the `Application name` field with something like `SSEquel Dev`, and your email for the required `User support email` and `Developer contact information` fields. You can leave the other fields blank. Click `Save and Continue`.

6. On the Scopes page, click `Save and Continue`.

7. On the Test users page, click `Save and Continue`.

8. On the Summary page, click `Back to Dashboard`.

9. Now that you've configured the consent screen, you can create the OAuth client ID. Back on the [Credentials tab](https://console.cloud.google.com/apis/credentials) page, click on `Create Credentials` and select `OAuth client ID`.

10. On the next screen, select `Web application`. Name the OAuth client ID something like `SSEquel Dev`. Under `Authorized JavaScript origins`, add `http://localhost:3000`. Under `Authorized redirect URIs`, add `http://localhost:3000/api/auth/callback/google`. Click `Create`. You should be presented with a modal titled `OAuth client created`.

11. Congratulations, you've created a Google OAuth client ID! You can now fill in the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` entries in the `.env` file.

The `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` can be found again later by going to the [Credentials tab](https://console.cloud.google.com/apis/credentials) and clicking on the client ID under `OAuth 2.0 Client IDs`.

## Setting up Google Calendar

1. Go to the [Google Service Accounts](https://console.developers.google.com/iam-admin/serviceaccounts) page and select/create a project.

2. Click `+ Create Service Account`. Enter any name, id, and description.

3. Click `Create and Continue`, then `Continue`, then `Done`.

4. Click the email address of the account you just created and click the `Keys` tab.

5. In the `Add Key` drop-down list, select `Create new Key` and click `Create`. Your browser will download a JSON file. Keep this somewhere safe.

6. Copy the `client_email` from this file to the `GCAL_CLIENT_EMAIL` entry in the `.env` file. Copy the `private_key` to the `GCAL_PRIVATE_KEY` entry.

## Setting up the email service (SMTP)

The app sends transactional emails (for example alumni mail and purchasing emails) through SMTP.

Required env vars:

- `SMTP_HOST`: SMTP server hostname
- `SMTP_USER`: SMTP username/login
- `SMTP_PASS`: SMTP password

Optional env vars:

- `SMTP_PORT`: SMTP port (defaults to `587`)
- `SMTP_SECURE`: set to `true` for implicit TLS (typically port `465`), otherwise `false`

If you are using `docker-compose.dev.yml` with MailHog, set:

- `SMTP_HOST=localhost`
- `SMTP_PORT=1025`
- `SMTP_SECURE=false`
- `SMTP_USER=dev`
- `SMTP_PASS=dev`

How to configure:

1. Create or obtain SMTP credentials from the team-approved provider.
2. Add the SMTP values to your `next/.env`.
3. Restart `npm run dev` after changing `.env`.

Local verification checklist:

1. Confirm app boots with SMTP values present.
2. Use a feature that sends mail:
   - Alumni page mass email flow (`/api/alumni/email`)
   - Purchasing request email flow (`/api/purchasing/[id]/email`)
3. Confirm mail is delivered in your provider inbox/logs (or sandbox inbox, if using a test provider).

If SMTP is missing or invalid, email endpoints will fail with configuration/authentication errors.

## Building the Local Database

If you run the project now, you'll encounter schema errors. This is because the local database hasn't been built. We use Prisma for managing the Postgres database, so we'll use [Prisma's migrate command](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production) to build the db tables using the schema defined in the [schema.prisma](../next/prisma/schema.prisma) file.

In the /next/ directory, run `npx prisma migrate dev`. Then run `npx prisma db seed` to populate the database with test data.

That's it! You should now be able to run `npm run dev` and view the website at `localhost:3000` with authentication and access to your local database instance. Try logging in with your RIT email.

## Keeping This Guide Accurate

Update this document whenever you change:

- Required environment variables
- Third-party credentials or setup steps
- Database setup and migration flow
- Local commands required for test/build validation

Any PR that changes setup without updating this file should be considered incomplete.

## Alumni lifecycle migrations

If your branch includes alumni/profile lifecycle changes, apply migrations before running:

1. `npm --prefix next run prisma:migrate`
2. `npm --prefix next exec prisma generate`

This ensures new academic term fields, alumni candidate queue tables, and enums are available locally.
