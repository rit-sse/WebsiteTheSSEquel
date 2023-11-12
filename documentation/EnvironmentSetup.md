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
```

The above is just a placeholder, you'll need to fill in each entry with the appropriate information. First, let's step through setting up a local database.

## Setting up a local database

1. Download and install [PostgreSQL](https://www.postgresql.org/download/) 14. This is the database management system we are using for the project. When you visit the downloads page, click on your operating system and look for the following in the subsequent page: [![PostgreSQL 14 Download Page](https://i.imgur.com/VlfCWO6.png)](https://www.postgresql.org/download/)

2. Run the installer and follow the instructions to install PostgreSQL. Make sure you remember the password you set for the database superuser.

3. Open up pgAdmin 4. This should have been installed along with PostgreSQL. Click on the `Servers` dropdown in the top left corner and select `PostgreSQL 14`. You will be prompted to enter the password you set for the database superuser.

4. Create a new database by right clicking on `Databases` and selecting `Create > Database...`. Name the database something like `ssequel-dev` and click `Save`.

5. Now that you have a database, you can fill in the `DATABASE_URL` entry in the `.env` file. The `DATABASE_URL` should be in the following format: `postgresql://<username>:<password>@localhost:5432/<database name>`, where `<username>` is the username of the database superuser, `<password>` is the password you set for the database superuser, and `<database name>` is the name of the database you created in step 4. The default username for the database superuser is `postgres`.

## Setting up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project. Name the project something like `ssequel-dev`.

2. Click on the `APIs & Services` dropdown in the top left corner and select `OAuth consent screen`. Select `External` and click `Create`.

3. Fill in the `Application name` field with something like `SSEquel Dev`. Fill in the `Authorized domains` field with `localhost`. Click `Save and continue`.

