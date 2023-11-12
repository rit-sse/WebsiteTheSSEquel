import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const prisma = new PrismaClient()

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    hd: "g.rit.edu" // restrict logins to rit.edu accounts
                }
            }
        })
    ],
    // callbacks: {
    //     session: async ({ session, user }) => {
    //         console.log("session callback", session, user)
    //         return Promise.resolve(session)
    //     }
    // }
};

export const handler = NextAuth(authOptions)

export { handler as GET, handler as POST };
