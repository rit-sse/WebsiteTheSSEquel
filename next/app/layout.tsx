// This file defines the base layout of all pages in the application.

import "./globals.scss";
import type { Metadata } from "next";
import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/Footer";
import { Inter } from 'next/font/google'
import { Providers } from "./Providers";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/authOptions';
import ScrollToTopButton from "@/components/nav/ScrollToTopButton";
import { Toaster } from "@/components/ui/sonner";


const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Society of Software Engineers',
  description: 'The Society of Software Engineers (SSE) is an academic organization at the Rochester Institute of Technology (RIT) that provides mentoring and support for students in the Golisano College for Computing and Information Sciences (GCCIS).',
  icons: ["./icon.png"],
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
    <html lang="en" data-theme="dark" className={`${inter.className}`} suppressHydrationWarning>
      <body
        className={`min-h-screen flex flex-col bg-gradient-to-b from-background to-muted`}
      >
        <Providers session={session}>
          <Navbar />
          <main className="flex flex-col grow items-center p-2 md:p-4 lg:p-6 xl:p-8">
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