// This file defines a plane layout for all pages in the application, meant to be extended by children layouts.

import "./globals.scss";
import type { Metadata } from "next";
import { Inter, Rethink_Sans, PT_Serif } from 'next/font/google';
import { Providers } from "./Providers";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/authOptions';


const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const rethinkSans = Rethink_Sans({
    subsets: ['latin'],
    variable: '--font-rethink',
});

const ptSerif = PT_Serif({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-pt-serif',
});

export const metadata: Metadata = {
    title: 'Society of Software Engineers',
    description: 'The Society of Software Engineers (SSE) is an academic organization at the Rochester Institute of Technology (RIT) that provides mentoring and support for students in the Golisano College for Computing and Information Sciences (GCCIS).',
    icons: ["./icon.png"],
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // https://next-auth.js.org/configuration/nextjs#getserversession
    const session = await getServerSession(authOptions);

    return (
        // details on suppressHydrationWarning: https://github.com/pacocoursey/next-themes#html--css (scroll up a bit)
        // Also: https://www.reddit.com/r/nextjs/comments/138smpm/how_to_fix_extra_attributes_from_the_server_error/
        <html lang="en" data-theme="dark" className={`${inter.variable} ${rethinkSans.variable} ${ptSerif.variable}`} suppressHydrationWarning>
            <body
                className={`min-h-screen flex flex-col bg-gradient-to-b from-background to-muted overflow-x-hidden`}
            >
                <Providers session={session}>
                    {children}
                </Providers>
            </body>
        </html>
    );
}