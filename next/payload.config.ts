import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { Media } from "./payload/collections/Media.ts";
import { Events } from "./payload/collections/Events.ts";
import { Pages } from "./payload/collections/Pages.ts";
import { PayloadUsers } from "./payload/collections/PayloadUsers.ts";
import { ProjectContent } from "./payload/collections/ProjectContent.ts";
import { Projects } from "./payload/collections/Projects.ts";
import { Quotes } from "./payload/collections/Quotes.ts";
import { Sponsors } from "./payload/collections/Sponsors.ts";
import { AboutPageGlobal } from "./payload/globals/AboutPageGlobal.ts";
import { CommitteesGlobal } from "./payload/globals/CommitteesGlobal.ts";
import { GetInvolvedGlobal } from "./payload/globals/GetInvolvedGlobal.ts";
import { HomepageGlobal } from "./payload/globals/HomepageGlobal.ts";
import { seedGlobals } from "./payload/seed/seedGlobals.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || process.env.NEXTAUTH_SECRET || "",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    // Pragmatic path: auto-create/update Payload schema in development only.
    // This runs against the isolated "payload" schema below, not Prisma's tables.
    push: process.env.NODE_ENV !== "production",
    // Keep Payload tables in their own schema to avoid collisions with Prisma tables.
    schemaName: "payload",
  }),
  collections: [
    PayloadUsers,
    Media,
    Pages,
    ProjectContent,
    Projects,
    Events,
    Sponsors,
    Quotes,
  ],
  globals: [
    HomepageGlobal,
    AboutPageGlobal,
    CommitteesGlobal,
    GetInvolvedGlobal,
  ],
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: "uploads/cms-media",
        },
      },
      bucket: process.env.AWS_S3_BUCKET_NAME || "",
      config: {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
        region: process.env.AWS_S3_REGION || "",
      },
    }),
  ],
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  // --- Admin panel configuration ---
  admin: {
    user: "payload-users",
    components: {
      // Show a "Sign in with Google" button instead of the disabled
      // email/password form (disableLocalStrategy hides the default form).
      beforeLogin: ["./payload/components/SSOLogin"],
    },
  },

  // Seed a placeholder user on first boot so Payload never shows the
  // "Create First User" page (real users are auto-created by the
  // custom next-auth strategy when officers access /admin).
  onInit: async (payload) => {
    // --- Seed a placeholder user so Payload never shows "Create First User" ---
    try {
      const { totalDocs } = await payload.count({
        collection: "payload-users",
      });

      if (totalDocs === 0) {
        await payload.create({
          collection: "payload-users",
          data: {
            email: "payload-system@g.rit.edu",
            name: "System (auto-seeded)",
          },
          overrideAccess: true,
        });
        payload.logger.info(
          "Seeded initial payload-users record to bypass create-first-user flow.",
        );
      }
    } catch (error) {
      payload.logger.error({ err: error }, "Failed to seed payload-users");
    }

    // --- Seed globals with existing hardcoded content if empty ---
    await seedGlobals(payload);
  },

  routes: {
    admin: "/admin",
    api: "/api/payload",
    graphQL: "/api/payload/graphql",
    graphQLPlayground: "/api/payload/graphql-playground",
  },
});
