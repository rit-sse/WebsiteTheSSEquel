'use client'

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth';

interface ProvidersProps {
    children: React.ReactNode;
    session: any;
}

export function Providers({ children, session }: ProvidersProps): JSX.Element {
    return (
        <SessionProvider session={session}>
            <ThemeProvider enableSystem={false}>{children}</ThemeProvider>
        </SessionProvider>
    )
}