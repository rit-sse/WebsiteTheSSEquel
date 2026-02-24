import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getImageProps } from "next/image";
import { resolveUserImage } from "./s3Utils";
import { maybeCreateAlumniCandidate } from "@/lib/services/alumniCandidateService";

// OAuth scopes for authentication
const scopes = "openid email profile";
const adapter = PrismaAdapter(prisma);

export const authOptions: AuthOptions = {
  adapter: { ...adapter,
    createUser: async (data: any) => {
      const { image, ...rest } = data as any;
      return prisma.user.create({
        data: {
          ...rest,
          googleImageURL: image ?? null,
        },
      }) as any;
    }
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
  callbacks: {
    async session({ session }) {
      if (!session.user?.email) return session;
      
      const dbUser = await prisma.user.findUnique({
        where: {email: session.user.email }, 
        select: {
          profileImageKey: true,
          googleImageURL: true,
        }
      });

      if (dbUser) {
        session.user.image = resolveUserImage(dbUser.profileImageKey, dbUser.googleImageURL);
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
                gte: new Date()
              }
            }
          });
          
          if (pendingInvites > 0) {
            console.log(`User ${user.email} has ${pendingInvites} pending invitation(s)`);
          }
        } catch (error) {
          console.error('Error checking pending invitations:', error);
        }
      }
      
      return true;
    },
  },
};
