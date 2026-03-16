"use client"

import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as React from "react"

import { PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const SIZE_CLASS_NAMES = {
  sm: "w-48",
  md: "w-64",
  lg: "w-80",
} as const

type TooltipSize = keyof typeof SIZE_CLASS_NAMES

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  size?: TooltipSize
  side?: React.ComponentProps<typeof PopoverContent>["side"]
  align?: React.ComponentProps<typeof PopoverContent>["align"]
  disabled?: boolean
  className?: string
  contentClassName?: string
}

function Tooltip({
  children,
  content,
  size = "md",
  side = "top",
  align = "center",
  disabled = false,
  className,
  contentClassName,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  const closeTimeoutRef = React.useRef<number | null>(null)

  const clearCloseTimeout = React.useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const openTooltip = React.useCallback(() => {
    clearCloseTimeout()
    setOpen(true)
  }, [clearCloseTimeout])

  const closeTooltip = React.useCallback(() => {
    clearCloseTimeout()
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false)
      closeTimeoutRef.current = null
    }, 40)
  }, [clearCloseTimeout])

  React.useEffect(() => {
    return () => clearCloseTimeout()
  }, [clearCloseTimeout])

  if (disabled) return <>{children}</>

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <div
          className={cn(className)}
          onMouseEnter={openTooltip}
          onMouseLeave={closeTooltip}
          onFocus={openTooltip}
          onBlur={closeTooltip}
        >
          {children}
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        className={cn(
          "pointer-events-none border-border/60 bg-background/95 px-3 py-2 text-xs text-foreground backdrop-blur-sm",
          SIZE_CLASS_NAMES[size],
          contentClassName,
        )}
      >
        {content}
      </PopoverContent>
    </PopoverPrimitive.Root>
  )
}

export { Tooltip }
