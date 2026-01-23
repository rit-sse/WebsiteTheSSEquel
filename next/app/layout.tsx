// This file defines the base layout of all pages in the application.

import "./globals.scss";
import type { Metadata } from "next";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/Footer";
import { Inter, Rethink_Sans, PT_Serif } from 'next/font/google'
import { Providers } from "./Providers";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/authOptions';
import ScrollToTopButton from "@/components/nav/ScrollToTopButton";
import { Toaster } from "@/components/ui/sonner";


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
  verification: {
    google: 'dGS9b_vMzsYfXBoSiy8kKUJboKK0UF_yQM1fQow19mw',
  },
}

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
          <Navbar />
          <main className="flex flex-col grow items-center px-2 py-2 md:px-3 md:py-3 lg:px-4 lg:py-4 w-full overflow-x-hidden">
            {children}
          </main>
          <ScrollToTopButton/>
          <Footer />
          <Toaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}