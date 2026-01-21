import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Determine if Gmail API mode is enabled for sending emails
const useGmailApi = process.env.EMAIL_PROVIDER === "gmail";

// Build OAuth scopes - add gmail.send if Gmail API mode is enabled
const scopes = useGmailApi
  ? "openid email profile https://www.googleapis.com/auth/gmail.send"
  : "openid email profile";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          hd: "g.rit.edu", // restrict logins to rit.edu accounts
          scope: scopes,
          // When using Gmail API, request offline access and prompt for consent
          // to ensure we get a refresh token
          ...(useGmailApi && {
            access_type: "offline",
            prompt: "consent",
          }),
        },
      },
    }),
  ],
};
