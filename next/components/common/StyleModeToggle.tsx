"use client"

import * as React from "react"
import { LayoutGrid, Circle } from "lucide-react"
import { useStyleMode } from "@/contexts/StyleModeContext"

export default function StyleModeToggle() {
  const { styleMode, toggleStyleMode } = useStyleMode()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
        <span className="sr-only">Toggle style</span>
      </button>
    )
  }

  return (
    <button 
      className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      onClick={toggleStyleMode}
      aria-label={`Switch to ${styleMode === "neo" ? "clean" : "neobrutalist"} style`}
      title={styleMode === "neo" ? "Switch to clean style" : "Switch to neobrutalist style"}
    >
      {styleMode === "neo" ? (
        <LayoutGrid className="h-5 w-5" />
      ) : (
        <Circle className="h-5 w-5" />
      )}
    </button>
  )
}
