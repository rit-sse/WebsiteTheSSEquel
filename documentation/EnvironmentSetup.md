# Environment Setup

1. Make sure you have node installed. You can check this by running `node -v` in your terminal. If you don't have node installed, you can download it [here](https://nodejs.org/en/download/).

2. Clone or fork this repository. You can do this by running `git clone https://github.com/rit-sse/WebsiteTheSSEquel.git` in your terminal in the directory you want to clone the repository to.

3. Navigate to the directory you cloned the repository to and run `cd ./next`. This will take you to the `next` directory, which is where the Next.js application is located.

4. Run `npm install` to install all the dependencies for the project.

5. Run `npm run dev` to start the development server. You can view the website at `localhost:3000`.

At this point, you should be able to explore the site without logging in or having to set up a database. In order to have authentication and access to the database, you will need to set up a `.env` file. This file is not included in the repository because it contains sensitive information. The `.env` file should be located in the `next` directory. The contents of the `.env` file should be as follows:

```
DATABASE_URL="database url string"
GOOGLE_CLIENT_ID="google cloud OAuth client id"
GOOGLE_CLIENT_SECRET="google cloud OAuth client secret"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random string of characters used for encryption -- feel free to make this up or use openssl to generate one"

GCAL_CLIENT_EMAIL="gcal client email"
GCAL_PRIVATE_KEY="gcal private key"

AWS_S3_BUCKET_NAME="s3 bucket name"
AWS_S3_REGION="s3 region (for example us-east-1)"
AWS_ACCESS_KEY_ID="aws access key"
AWS_SECRET_ACCESS_KEY="aws secret key"
```

The above is just a placeholder, you'll need to fill in each entry with the appropriate information. First, let's step through setting up a local database.

## Setting up a local database

1. Download and install [PostgreSQL](https://www.postgresql.org/download/) 14. *Make sure you're installing 14, not any higher versions!* This is the database management system we are using for the project. When you visit the downloads page, click on your operating system and look for the following in the subsequent page: [![PostgreSQL 14 Download Page](https://i.imgur.com/VlfCWO6.png)](https://www.postgresql.org/download/)

2. Run the installer and follow the instructions to install PostgreSQL. Make sure you remember the password you set for the database superuser.

3. Open up pgAdmin 4. This should have been installed along with PostgreSQL. Click on the `Servers` dropdown in the top left corner and select `PostgreSQL 14`. You will be prompted to enter the password you set for the database superuser.

4. Create a new database by right clicking on `Databases` and selecting `Create > Database...`. Name the database something like `ssequel-dev` and click `Save`.

5. Now that you have a database, you can fill in the `DATABASE_URL` entry in the `.env` file. The `DATABASE_URL` should be in the following format: `postgresql://<username>:<password>@localhost:5432/<database name>`, where `<username>` is the username of the database superuser, `<password>` is the password you set for the database superuser, and `<database name>` is the name of the database you created in step 4. The default username for the database superuser is `postgres`.

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

## Building the Local Database

If you run the project now, you'll encounter schema errors. This is because the local database hasn't been built. We use Prisma for managing the Postgres database, so we'll use [Prisma's migrate command](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production) to build the db tables using the schema defined in the [schema.prisma](../next/prisma/schema.prisma) file.

In the /next/ directory, run `npx prisma migrate dev`. Then run `npx prisma db seed` to populate the database with test data.

That's it! You should now be able to run `npm run dev` and view the website at `localhost:3000` with authentication and access to your local database instance. Try logging in with your RIT email.

## Alumni lifecycle migrations

If your branch includes alumni/profile lifecycle changes, apply migrations before running:

1. `cd next`
2. `npx prisma migrate dev`
3. `npx prisma generate`

This ensures new academic term fields, alumni candidate queue tables, and enums are available locally.
