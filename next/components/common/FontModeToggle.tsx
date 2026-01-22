"use client"

import * as React from "react"
import { Type } from "lucide-react"
import { useFontMode } from "@/contexts/FontModeContext"

export default function FontModeToggle() {
  const { fontMode, toggleFontMode } = useFontMode()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
        <span className="sr-only">Toggle font</span>
      </button>
    )
  }

  return (
    <button 
      className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      onClick={toggleFontMode}
      aria-label={`Switch to ${fontMode === "rethink" ? "PT Serif" : "Rethink Sans"} font`}
      title={fontMode === "rethink" ? "Switch to PT Serif" : "Switch to Rethink Sans"}
    >
      <Type className="h-5 w-5" />
    </button>
  )
}
