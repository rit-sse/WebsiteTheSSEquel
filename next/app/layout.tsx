// This file defines a plain layout for all pages in the application, meant to be extended by children layouts.

import "./globals.scss";
import type { Metadata } from "next";
import { Inter, Rethink_Sans, PT_Serif } from "next/font/google";
import { Providers } from "./Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Script from "next/script";
import { headers } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const rethinkSans = Rethink_Sans({
  subsets: ["latin"],
  variable: "--font-rethink",
  adjustFontFallback: false,
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-serif",
});

export const metadata: Metadata = {
  title: "Society of Software Engineers",
  description:
    "The Society of Software Engineers (SSE) is an academic organization at the Rochester Institute of Technology (RIT) that provides mentoring and support for students in the Golisano College for Computing and Information Sciences (GCCIS).",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // https://next-auth.js.org/configuration/nextjs#getserversession
  const session = await getServerSession(authOptions);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // details on suppressHydrationWarning: https://github.com/pacocoursey/next-themes#html--css (scroll up a bit)
    // Also: https://www.reddit.com/r/nextjs/comments/138smpm/how_to_fix_extra_attributes_from_the_server_error/
    <html
      lang="en"
      data-theme="dark"
      data-style="neo"
      data-font="pt-serif"
      className={`${inter.variable} ${rethinkSans.variable} ${ptSerif.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`min-h-screen flex flex-col bg-gradient-to-b from-background to-muted overflow-x-hidden`}
      >
        <Script
          src="/init-style-font.js"
          strategy="beforeInteractive"
          nonce={nonce}
        />
        <Providers session={session} nonce={nonce}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
