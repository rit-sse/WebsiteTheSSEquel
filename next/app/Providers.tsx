"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { StyleModeProvider } from "@/contexts/StyleModeContext";
import { FontModeProvider } from "@/contexts/FontModeContext";
import { ProfileImageProvider } from "@/contexts/ProfileImageContext";

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
  nonce?: string;
}

export function Providers({
  children,
  session,
  nonce,
}: ProvidersProps): React.JSX.Element {
  return (
    <SessionProvider session={session}>
      <ProfileImageProvider>
        <StyleModeProvider defaultMode="neo">
          <FontModeProvider defaultMode="pt-serif">
            <ThemeProvider
              attribute="data-theme"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
              nonce={nonce}
            >
              {children}
            </ThemeProvider>
          </FontModeProvider>
        </StyleModeProvider>
      </ProfileImageProvider>
    </SessionProvider>
  );
}
