'use client'

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth';

interface ProvidersProps {
    children: React.ReactNode;
    session: Session | null;
}

// AUTH BYPASS: Mocked session for fully authenticated user
const mockedSession: Session = {
    user: {
        name: "Mocked User",
        email: "mocked@g.rit.edu",
        image: null,
    },
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
};

export function Providers({ children, session }: ProvidersProps): JSX.Element {
    // AUTH BYPASS: Always use mocked session instead of real session
    const effectiveSession = mockedSession;
    // ORIGINAL: const effectiveSession = session;
    
    return (
        <SessionProvider session={effectiveSession}>
            <ThemeProvider 
                attribute="data-theme"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </SessionProvider>
    )
}