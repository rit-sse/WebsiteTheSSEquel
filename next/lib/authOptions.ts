import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { AuthOptions } from "next-auth";
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
    callbacks: {
        session: async ({ session, user }) => {
            // fetch user roles from database
            // session.roles = ...
            return Promise.resolve(session)
        }
    }
};