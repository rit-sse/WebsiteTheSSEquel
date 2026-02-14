"use client"

import * as React from "react"

type FontMode = "rethink" | "pt-serif"

interface FontModeContextType {
  fontMode: FontMode
  setFontMode: (mode: FontMode) => void
  toggleFontMode: () => void
}

const FontModeContext = React.createContext<FontModeContextType | undefined>(undefined)

const STORAGE_KEY = "sse-font-mode"

interface FontModeProviderProps {
  children: React.ReactNode
  defaultMode?: FontMode
}

export function FontModeProvider({ 
  children, 
  defaultMode = "rethink" 
}: FontModeProviderProps) {
  const [fontMode, setFontModeState] = React.useState<FontMode>(defaultMode)

  // Sync React state from localStorage before the browser paints.
  // The DOM attribute is already set correctly by the synchronous <Script>
  // in layout.tsx, so we only need to align the React state here.
  React.useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as FontMode | null
    if (stored && (stored === "rethink" || stored === "pt-serif")) {
      setFontModeState(stored)
    }
  }, [])

  // Update localStorage and DOM when fontMode changes
  const setFontMode = React.useCallback((mode: FontMode) => {
    setFontModeState(mode)
    localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.setAttribute("data-font", mode)
  }, [])

  const toggleFontMode = React.useCallback(() => {
    const newMode = fontMode === "rethink" ? "pt-serif" : "rethink"
    setFontMode(newMode)
  }, [fontMode, setFontMode])

  const value = React.useMemo(
    () => ({
      fontMode,
      setFontMode,
      toggleFontMode,
    }),
    [fontMode, setFontMode, toggleFontMode]
  )

  return (
    <FontModeContext.Provider value={value}>
      {children}
    </FontModeContext.Provider>
  )
}

export function useFontMode() {
  const context = React.useContext(FontModeContext)
  if (context === undefined) {
    throw new Error("useFontMode must be used within a FontModeProvider")
  }
  return context
}

export { FontModeContext }
export type { FontMode }
