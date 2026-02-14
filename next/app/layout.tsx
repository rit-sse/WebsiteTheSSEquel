/**
 * Minimal root layout shared by ALL route groups.
 *
 * - (main)   – the SSE frontend, wrapped in its own Providers (session, theme, etc.)
 * - (payload) – Payload CMS admin, which needs a clean React tree (no foreign context providers)
 *
 * Only fonts, global CSS, and the tiny localStorage script live here.
 * Everything else (SessionProvider, ThemeProvider, …) lives in (main)/layout.tsx.
 */

import "./globals.scss";
import type { Metadata } from "next";
import { Inter, Rethink_Sans, PT_Serif } from "next/font/google";
import Script from "next/script";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const rethinkSans = Rethink_Sans({
    subsets: ["latin"],
    variable: "--font-rethink",
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
    icons: ["./icon.png"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            data-theme="dark"
            data-style="neo"
            data-font="pt-serif"
            className={`${inter.variable} ${rethinkSans.variable} ${ptSerif.variable}`}
            suppressHydrationWarning
        >
            <body>
                {/* Inline script reads localStorage before first paint to avoid FOUC */}
                <Script id="init-style-font" strategy="beforeInteractive">
                    {`try {
  var styleMode = localStorage.getItem("sse-style-mode");
  if (styleMode === "neo" || styleMode === "clean") {
    document.documentElement.setAttribute("data-style", styleMode);
  }
  var fontMode = localStorage.getItem("sse-font-mode");
  if (fontMode === "rethink" || fontMode === "pt-serif") {
    document.documentElement.setAttribute("data-font", fontMode);
  }
} catch (e) {}`}
                </Script>
                {children}
            </body>
        </html>
    );
}