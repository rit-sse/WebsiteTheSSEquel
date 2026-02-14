import type { CollectionConfig } from "payload";

import { isOfficer } from "../access/isOfficer.ts";

/**
 * Payload auth collection that integrates with the existing next-auth
 * Google OAuth flow.  No local (email + password) strategy — officers
 * sign in with their RIT Google account on the main site and the
 * custom strategy reads the next-auth session cookie.
 */
export const PayloadUsers: CollectionConfig = {
  slug: "payload-users",
  auth: {
    // Disable the default email/password login – we use Google OAuth.
    disableLocalStrategy: true,
    strategies: [
      {
        name: "next-auth-session",
        /**
         * Authenticate a Payload admin request by reading the next-auth
         * session cookie, verifying the session in Prisma, confirming
         * officer status, and returning (or auto-creating) a matching
         * PayloadUsers document.
         */
        authenticate: async ({ payload, headers }) => {
          try {
            // --- 1. Extract session token from cookies ---
            const cookieHeader = headers.get("cookie") || "";
            const cookieName =
              process.env.SESSION_COOKIE_NAME || "next-auth.session-token";

            // Also check the __Secure- prefixed variant (production HTTPS)
            const secureName = `__Secure-${cookieName}`;

            let sessionToken: string | null = null;
            for (const pair of cookieHeader.split(";")) {
              const trimmed = pair.trim();
              const eqIdx = trimmed.indexOf("=");
              if (eqIdx === -1) continue;
              const key = trimmed.slice(0, eqIdx);
              const val = trimmed.slice(eqIdx + 1);
              if (key === cookieName || key === secureName) {
                sessionToken = decodeURIComponent(val);
                break;
              }
            }

            if (!sessionToken) {
              return { user: null };
            }

            // --- 2. Look up the session in Prisma ---
            const prismaModule = await import("../../lib/prisma.ts");
            const prisma = prismaModule.default;

            const session = await prisma.session.findFirst({
              where: {
                sessionToken,
                expires: { gt: new Date() },
              },
              include: { user: true },
            });

            if (!session?.user?.email) {
              return { user: null };
            }

            // --- 3. Verify the user is an active officer ---
            const officer = await prisma.officer.findFirst({
              where: {
                is_active: true,
                user_id: session.user.id,
              },
              select: { id: true },
            });

            if (!officer) {
              return { user: null };
            }

            // --- 4. Find or create a matching PayloadUsers document ---
            const { docs: existing } = await payload.find({
              collection: "payload-users",
              where: { email: { equals: session.user.email } },
              limit: 1,
              overrideAccess: true,
            });

            if (existing.length > 0) {
              return { user: existing[0] };
            }

            const newUser = await payload.create({
              collection: "payload-users",
              data: {
                email: session.user.email,
                name: session.user.name || "",
              },
              overrideAccess: true,
            });

            return { user: newUser };
          } catch (error) {
            console.error(
              "[PayloadUsers] next-auth strategy error:",
              error,
            );
            return { user: null };
          }
        },
      },
    ],
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "updatedAt"],
    group: "System",
    description:
      "Admin users (auto-created when officers sign in via Google OAuth).",
  },
  access: {
    // The local API (used by the strategy) always calls with
    // overrideAccess: true, so these only gate the REST / GraphQL APIs.
    read: isOfficer,
    create: isOfficer,
    update: isOfficer,
    delete: isOfficer,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: false,
    },
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
    },
  ],
};
