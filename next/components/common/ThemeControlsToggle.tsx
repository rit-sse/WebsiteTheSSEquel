"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Type, LayoutGrid, Circle } from "lucide-react"
import { useFontMode } from "@/contexts/FontModeContext"
import { useStyleMode } from "@/contexts/StyleModeContext"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export default function ThemeControlsToggle() {
  const { theme, setTheme } = useTheme()
  const { fontMode, setFontMode } = useFontMode()
  const { styleMode, setStyleMode } = useStyleMode()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        <div className="w-9 h-9" />
        <div className="w-9 h-9" />
        <div className="w-9 h-9" />
      </div>
    )
  }

  return (
    <ToggleGroup type="multiple" className="gap-1 bg-transparent">
      <ToggleGroupItem
        value="theme"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="bg-transparent hover:bg-transparent data-[state=on]:bg-transparent hover:text-foreground/70"
      >
        {theme === "dark" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </ToggleGroupItem>

      <ToggleGroupItem
        value="style"
        aria-label={`Switch to ${styleMode === "neo" ? "clean" : "neobrutalist"} style`}
        title={`Switch to ${styleMode === "neo" ? "clean" : "neobrutalist"} style`}
        onClick={() => setStyleMode(styleMode === "neo" ? "clean" : "neo")}
        className="bg-transparent hover:bg-transparent data-[state=on]:bg-transparent hover:text-foreground/70"
      >
        {styleMode === "neo" ? (
          <LayoutGrid className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </ToggleGroupItem>

      <ToggleGroupItem
        value="font"
        aria-label={`Switch to ${fontMode === "rethink" ? "PT Serif" : "Rethink Sans"} font`}
        title={`Switch to ${fontMode === "rethink" ? "PT Serif" : "Rethink Sans"} font`}
        onClick={() => setFontMode(fontMode === "rethink" ? "pt-serif" : "rethink")}
        className="bg-transparent hover:bg-transparent data-[state=on]:bg-transparent hover:text-foreground/70"
      >
        <Type className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
