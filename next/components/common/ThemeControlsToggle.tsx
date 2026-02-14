"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useFontMode } from "@/contexts/FontModeContext"
import { useStyleMode } from "@/contexts/StyleModeContext"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export default function ThemeControlsToggle() {
  const { theme, setTheme } = useTheme()
  const { fontMode, setFontMode } = useFontMode()
  const { styleMode, setStyleMode } = useStyleMode()
  const isMobile = useIsMobile()
  const [mounted, setMounted] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isNudging, setIsNudging] = React.useState(false)
  const [hasPeeked, setHasPeeked] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted || hasPeeked) return

    setIsExpanded(true)
    setIsNudging(true)
    const shakeTimer = setTimeout(() => setIsNudging(false), 900)
    const collapseTimer = setTimeout(() => {
      setIsExpanded(false)
      setHasPeeked(true)
    }, 1800)

    return () => {
      clearTimeout(shakeTimer)
      clearTimeout(collapseTimer)
    }
  }, [mounted, hasPeeked])

  if (!mounted) {
    return (
      <div className="inline-flex h-9 items-center justify-center rounded-full border border-border/50 bg-muted px-2 text-muted-foreground">
        <div className="h-7 w-7 rounded-full bg-muted-foreground/20" />
      </div>
    )
  }

  const handleThemeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile && !isExpanded) {
      event.preventDefault()
      event.stopPropagation()
      setIsExpanded(true)
      return
    }

    setTheme(theme === "dark" ? "light" : "dark")
    if (isMobile) {
      setIsExpanded(false)
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border/60 bg-background/90 py-1 text-foreground shadow-sm backdrop-blur transition-all",
        isExpanded ? "gap-1.5 px-1.5" : "gap-0.5 pl-1.5 pr-1"
      )}
      onMouseEnter={() => !isMobile && setIsExpanded(true)}
      onMouseLeave={() => !isMobile && setIsExpanded(false)}
    >
      <button
        type="button"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        onClick={handleThemeClick}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted/60",
          isNudging && "animate-shake"
        )}
      >
        {theme === "dark" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </button>

      <div
        className={cn(
          "inline-flex items-center gap-1 overflow-hidden transition-all duration-300 ease-out",
          isExpanded ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0 pointer-events-none"
        )}
      >
        <button
          type="button"
          aria-label={`Switch to ${styleMode === "neo" ? "clean" : "neobrutalist"} style`}
          title={`Switch to ${styleMode === "neo" ? "clean" : "neobrutalist"} style`}
          onClick={() => {
            setStyleMode(styleMode === "neo" ? "clean" : "neo")
            if (isMobile) setIsExpanded(false)
          }}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted/60",
            isNudging && "animate-shake"
          )}
        >
          {styleMode === "neo" ? (
            <span className="h-4 w-4 rounded-[4px] border-2 border-current shadow-[2px_2px_0px_0px_currentColor]" />
          ) : (
            <span className="h-4 w-4 rounded-full border border-current" />
          )}
        </button>

        <button
          type="button"
          aria-label={`Switch to ${fontMode === "rethink" ? "PT Serif" : "Rethink Sans"} font`}
          title={`Switch to ${fontMode === "rethink" ? "PT Serif" : "Rethink Sans"} font`}
          onClick={() => {
            setFontMode(fontMode === "rethink" ? "pt-serif" : "rethink")
            if (isMobile) setIsExpanded(false)
          }}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted/60",
            isNudging && "animate-shake"
          )}
        >
          <span
            className={cn(
              "text-[13px] font-semibold leading-none",
              fontMode === "rethink" ? "font-sans" : "font-display"
            )}
          >
            T
          </span>
        </button>
      </div>
    </div>
  )
}
