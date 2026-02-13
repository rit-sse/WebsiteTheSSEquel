"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

interface ProfileImageContextType {
  /** The current user's resolved profile image URL (or null) */
  profileImage: string | null;
  /** Update the profile image globally — all consumers re-render instantly */
  setProfileImage: (url: string | null) => void;
}

const ProfileImageContext = React.createContext<ProfileImageContextType | undefined>(undefined);

interface ProfileImageProviderProps {
  children: React.ReactNode;
}

export function ProfileImageProvider({ children }: ProfileImageProviderProps) {
  const { data: session } = useSession();
  const [profileImage, setProfileImageState] = React.useState<string | null>(null);

  // Sync from session whenever it changes (login, session refresh, etc.)
  React.useEffect(() => {
    if (session?.user?.image !== undefined) {
      setProfileImageState(session.user.image ?? null);
    }
  }, [session?.user?.image]);

  // Imperative setter that immediately propagates to all consumers
  const setProfileImage = React.useCallback((url: string | null) => {
    setProfileImageState(url);
  }, []);

  const value = React.useMemo(
    () => ({ profileImage, setProfileImage }),
    [profileImage, setProfileImage]
  );

  return (
    <ProfileImageContext.Provider value={value}>
      {children}
    </ProfileImageContext.Provider>
  );
}

/**
 * Hook to read and update the current user's profile image.
 * Must be used within a ProfileImageProvider.
 */
export function useProfileImage() {
  const context = React.useContext(ProfileImageContext);
  if (context === undefined) {
    throw new Error("useProfileImage must be used within a ProfileImageProvider");
  }
  return context;
}

export { ProfileImageContext };
