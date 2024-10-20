import prisma from '@/lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import NextAuth, { AuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            authorization: {
                params: {
                    hd: 'g.rit.edu', // restrict logins to rit.edu accounts
                },
            },
        }),
    ],
};

export default NextAuth(authOptions);
