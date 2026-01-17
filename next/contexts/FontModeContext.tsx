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
  const [mounted, setMounted] = React.useState(false)

  // Load from localStorage on mount
  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY) as FontMode | null
    if (stored && (stored === "rethink" || stored === "pt-serif")) {
      setFontModeState(stored)
      document.documentElement.setAttribute("data-font", stored)
    } else {
      document.documentElement.setAttribute("data-font", defaultMode)
    }
  }, [defaultMode])

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

  // Prevent hydration mismatch by setting initial attribute
  React.useEffect(() => {
    if (!mounted) {
      document.documentElement.setAttribute("data-font", defaultMode)
    }
  }, [mounted, defaultMode])

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
