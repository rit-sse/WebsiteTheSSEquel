"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { StyleModeProvider } from "@/contexts/StyleModeContext";
import { FontModeProvider } from "@/contexts/FontModeContext";
import { ProfileImageProvider } from "@/contexts/ProfileImageContext";
import { ThemeModeProvider } from "@/contexts/ThemeModeContext";

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export function Providers({
  children,
  session,
}: ProvidersProps): React.JSX.Element {
  return (
    <SessionProvider session={session}>
      <ProfileImageProvider>
        <StyleModeProvider defaultMode="neo">
          <FontModeProvider defaultMode="pt-serif">
            <ThemeModeProvider defaultMode="dark">{children}</ThemeModeProvider>
          </FontModeProvider>
        </StyleModeProvider>
      </ProfileImageProvider>
    </SessionProvider>
  );
}
