// This file defines a plain layout for all pages in the application, meant to be extended by children layouts.

import "./globals.scss";
import type { Metadata } from "next";
import { Inter, Rethink_Sans, PT_Serif } from "next/font/google";
import { Providers } from "./Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Script from "next/script";
import { readFileSync } from "node:fs";
import path from "node:path";
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

// Read the FOUC-preventing theme/font init script at build time so we can
// inline it into the <head>. In Next.js 16, <Script strategy="beforeInteractive">
// placed in <body> warns with a hydration mismatch and "Scripts inside React
// components are never executed when rendering on the client"; the idiomatic
// pattern for a pre-hydration theme-init script is an inline <script> in
// <head> (same approach `next-themes` uses).
const initStyleFontSource = readFileSync(
  path.join(process.cwd(), "public", "init-style-font.js"),
  "utf8"
);

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
        {/*
          FOUC-preventing theme/font init. `next/script` with
          `strategy="beforeInteractive"` is the Next.js-16–blessed way to
          run a script before React hydrates; a raw <script> element in
          the React tree triggers a "Scripts inside React components are
          never executed when rendering on the client" warning. We pass
          the contents inline (read once at build time) so there's no
          extra network round-trip.
        */}
        <Script
          id="sse-init-style-font"
          strategy="beforeInteractive"
          nonce={nonce}
        >
          {initStyleFontSource}
        </Script>
        <Providers session={session} nonce={nonce}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
