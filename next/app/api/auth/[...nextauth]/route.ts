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
    callbacks: {
        jwt: async({ token, user } : any) => {
            // the user object is what returned from the Credentials login, it has `accessToken` from the server `/login` endpoint
            // assign the accessToken to the `token` object, so it will be available on the `session` callback
            if (user) {
                token.accessToken = user.accessToken
            }
            return token
        },
        session: async({ session, token } : any) => {
            // the token object is what returned from the `jwt` callback, it has the `accessToken` that we assigned before
            // Assign the accessToken to the `session` object, so it will be available on our app through `useSession` hooks
            if (token) {
                session.accessToken = token.accessToken
            }
            return session
        }
    }
};

export const handler = NextAuth(authOptions)

export { handler as GET, handler as POST };
