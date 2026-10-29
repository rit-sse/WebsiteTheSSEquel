import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { resolveUserImage } from "./s3Utils";
import { maybeCreateAlumniCandidate } from "@/lib/services/alumniCandidateService";
import { claimPendingMembershipAwards } from "@/lib/services/membershipAwardService";

// OAuth scopes for authentication
const scopes = "openid email profile";
const adapter = PrismaAdapter(prisma);

export const authOptions: AuthOptions = {
  adapter: {
    ...adapter,
    createUser: async (data: any) => {
      const { image, ...rest } = data as any;
      return prisma.user.create({
        data: {
          ...rest,
          googleImageURL: image ?? null,
        },
      }) as any;
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Keep Google's verification result here; the sign-in event doesn't
          // receive the original email_verified field.
          emailVerified: profile.email_verified === true ? new Date() : null,
        };
      },
      // Allow linking OAuth accounts to existing users with matching email
      // This is safe because we restrict to @g.rit.edu which is verified by Google
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          hd: "g.rit.edu", // restrict logins to rit.edu accounts
          scope: scopes,
        },
      },
    }),
  ],
  events: {
    async signIn({ user, account, profile }) {
      const googleProfile = profile as
        | { email?: string; emailVerified?: Date | null }
        | undefined;
      // We need the saved account ID, so claim in the event rather than the
      // callback, which runs before a new account exists.
      if (
        account?.provider === "google" &&
        googleProfile?.emailVerified instanceof Date &&
        user.email &&
        googleProfile.email?.toLowerCase() === user.email.toLowerCase()
      ) {
        try {
          await claimPendingMembershipAwards(Number(user.id), user.email);
        } catch (error) {
          // A failed claim shouldn't block sign-in. We can retry next time.
          console.error("Failed to claim pending membership awards", error);
        }
      }
    },
  },
  callbacks: {
    async session({ session }) {
      if (!session.user?.email) return session;

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          profileImageKey: true,
          googleImageURL: true,
        },
      });

      if (dbUser) {
        session.user.image = resolveUserImage(
          dbUser.profileImageKey,
          dbUser.googleImageURL
        );
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      // Monitor sign ins
      console.log(`Sign-in attempt: ${user.email} via ${account?.provider}`);

      if (user.email && account?.provider === "google") {
        try {
          const googleImage = (profile as { picture?: string })?.picture;
          console.log("Google image URL:", googleImage);
          if (googleImage) {
            // Only update googleImageURL, don't overwrite a custom profileImageKey
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: { id: true },
            });

            if (existingUser) {
              await prisma.user.update({
                where: { email: user.email },
                data: { googleImageURL: googleImage },
              });
            }
            // If user doesn't exist yet, the PrismaAdapter will create them.
            // We handle that in the createUser event below.
          }
        } catch (err) {
          console.error("Error saving Google profile image:", err);
        }
      }

      if (user.email) {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true },
          });
          if (existing) {
            await maybeCreateAlumniCandidate(existing.id);
          }
        } catch (err) {
          console.error("Error creating alumni candidate on sign-in:", err);
        }

        // Upgrade legacy-imported stub users with real Google name
        try {
          const stub = await prisma.user.findUnique({
            where: { email: user.email },
            select: { isImported: true },
          });
          if (stub?.isImported && (profile as any)?.name) {
            await prisma.user.update({
              where: { email: user.email },
              data: {
                name: (profile as any).name,
                isImported: false,
              },
            });
            console.log(`Upgraded legacy import user: ${user.email}`);
          }
        } catch (err) {
          console.error("Error upgrading legacy import user:", err);
        }
      }

      // Check for pending invitations
      if (user.email) {
        try {
          const pendingInvites = await prisma.invitation.count({
            where: {
              invitedEmail: user.email,
              expiresAt: {
                gte: new Date(),
              },
            },
          });

          if (pendingInvites > 0) {
            console.log(
              `User ${user.email} has ${pendingInvites} pending invitation(s)`
            );
          }
        } catch (error) {
          console.error("Error checking pending invitations:", error);
        }
      }

      return true;
    },
  },
};
