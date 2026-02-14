"use client"

import * as React from "react"

type StyleMode = "neo" | "clean"

interface StyleModeContextType {
  styleMode: StyleMode
  setStyleMode: (mode: StyleMode) => void
  toggleStyleMode: () => void
}

const StyleModeContext = React.createContext<StyleModeContextType | undefined>(undefined)

const STORAGE_KEY = "sse-style-mode"

interface StyleModeProviderProps {
  children: React.ReactNode
  defaultMode?: StyleMode
}

export function StyleModeProvider({ 
  children, 
  defaultMode = "neo" 
}: StyleModeProviderProps) {
  const [styleMode, setStyleModeState] = React.useState<StyleMode>(defaultMode)

  // Sync React state from localStorage before the browser paints.
  // The DOM attribute is already set correctly by the synchronous <Script>
  // in layout.tsx, so we only need to align the React state here.
  React.useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as StyleMode | null
    if (stored && (stored === "neo" || stored === "clean")) {
      setStyleModeState(stored)
    }
  }, [])

  // Update localStorage and DOM when styleMode changes
  const setStyleMode = React.useCallback((mode: StyleMode) => {
    setStyleModeState(mode)
    localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.setAttribute("data-style", mode)
  }, [])

  const toggleStyleMode = React.useCallback(() => {
    const newMode = styleMode === "neo" ? "clean" : "neo"
    setStyleMode(newMode)
  }, [styleMode, setStyleMode])

  const value = React.useMemo(
    () => ({
      styleMode,
      setStyleMode,
      toggleStyleMode,
    }),
    [styleMode, setStyleMode, toggleStyleMode]
  )

  return (
    <StyleModeContext.Provider value={value}>
      {children}
    </StyleModeContext.Provider>
  )
}

export function useStyleMode() {
  const context = React.useContext(StyleModeContext)
  if (context === undefined) {
    throw new Error("useStyleMode must be used within a StyleModeProvider")
  }
  return context
}

export { StyleModeContext }
export type { StyleMode }
