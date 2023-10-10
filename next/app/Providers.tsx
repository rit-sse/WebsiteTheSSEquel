'use client'

import { ThemeProvider } from 'next-themes'

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
    return <ThemeProvider enableSystem={false}>{children}</ThemeProvider>
}