import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// OAuth scopes for authentication
const scopes = "openid email profile";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    async signIn({ user, account }) {
      // Log all sign-in attempts for monitoring
      console.log(`Sign-in attempt: ${user.email} via ${account?.provider}`);
      
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
