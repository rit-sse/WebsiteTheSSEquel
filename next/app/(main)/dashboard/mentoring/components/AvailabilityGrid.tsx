"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

export interface AvailabilitySlot {
  weekday: number // 1-5 (Monday-Friday)
  hour: number    // 10-17 (10am-5pm)
}

interface AvailabilityGridProps {
  value: AvailabilitySlot[]
  onChange: (slots: AvailabilitySlot[]) => void
  readOnly?: boolean
  className?: string
}

const WEEKDAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
]

const HOURS = [
  { value: 10, label: "10am - 11am" },
  { value: 11, label: "11am - 12pm" },
  { value: 12, label: "12pm - 1pm" },
  { value: 13, label: "1pm - 2pm" },
  { value: 14, label: "2pm - 3pm" },
  { value: 15, label: "3pm - 4pm" },
  { value: 16, label: "4pm - 5pm" },
  { value: 17, label: "5pm - 6pm" },
]

/**
 * When2Meet-style availability grid
 * Click to toggle single cells, click and drag to select multiple
 */
export default function AvailabilityGrid({
  value,
  onChange,
  readOnly = false,
  className,
}: AvailabilityGridProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<"add" | "remove" | null>(null)
  const [dragStart, setDragStart] = useState<{ weekday: number; hour: number } | null>(null)
  const gridRef = useRef<HTMLTableElement>(null)

  // Check if a slot is selected
  const isSelected = useCallback(
    (weekday: number, hour: number) => {
      return value.some((s) => s.weekday === weekday && s.hour === hour)
    },
    [value]
  )

  // Toggle a single slot
  const toggleSlot = useCallback(
    (weekday: number, hour: number) => {
      if (readOnly) return

      const exists = isSelected(weekday, hour)
      if (exists) {
        onChange(value.filter((s) => !(s.weekday === weekday && s.hour === hour)))
      } else {
        onChange([...value, { weekday, hour }])
      }
    },
    [value, onChange, isSelected, readOnly]
  )

  // Set slot state (used during drag)
  const setSlotState = useCallback(
    (weekday: number, hour: number, selected: boolean) => {
      if (readOnly) return

      const exists = isSelected(weekday, hour)
      if (selected && !exists) {
        onChange([...value, { weekday, hour }])
      } else if (!selected && exists) {
        onChange(value.filter((s) => !(s.weekday === weekday && s.hour === hour)))
      }
    },
    [value, onChange, isSelected, readOnly]
  )

  // Handle mouse down on a cell
  const handleMouseDown = (weekday: number, hour: number) => {
    if (readOnly) return

    const currentlySelected = isSelected(weekday, hour)
    setIsDragging(true)
    setDragMode(currentlySelected ? "remove" : "add")
    setDragStart({ weekday, hour })
    setSlotState(weekday, hour, !currentlySelected)
  }

  // Handle mouse enter during drag
  const handleMouseEnter = (weekday: number, hour: number) => {
    if (!isDragging || !dragMode || readOnly) return
    setSlotState(weekday, hour, dragMode === "add")
  }

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false)
    setDragMode(null)
    setDragStart(null)
  }

  // Handle touch start
  const handleTouchStart = (weekday: number, hour: number) => {
    handleMouseDown(weekday, hour)
  }

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !gridRef.current) return

    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const cell = element?.closest("[data-slot]")
    if (cell) {
      const weekday = parseInt(cell.getAttribute("data-weekday") || "0")
      const hour = parseInt(cell.getAttribute("data-hour") || "0")
      if (weekday && hour) {
        handleMouseEnter(weekday, hour)
      }
    }
  }

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }

    window.addEventListener("mouseup", handleGlobalMouseUp)
    window.addEventListener("touchend", handleGlobalMouseUp)

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
      window.removeEventListener("touchend", handleGlobalMouseUp)
    }
  }, [isDragging])

  // Count selected slots
  const selectedCount = value.length
  const totalSlots = WEEKDAYS.length * HOURS.length

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
        <span className="sm:hidden">Tap time slots to set availability</span>
        <span className="hidden sm:inline">Click and drag to select your available times</span>
        <span>{selectedCount} / {totalSlots} slots selected</span>
      </div>

      {/* Mobile-friendly selector */}
      <div className="sm:hidden space-y-3">
        {WEEKDAYS.map((day) => (
          <div key={`mobile-${day.value}`} className="rounded-md border border-border/60 p-3">
            <p className="mb-2 text-sm font-medium">{day.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {HOURS.map((hour) => {
                const selected = isSelected(day.value, hour.value)
                return (
                  <button
                    key={`mobile-${day.value}-${hour.value}`}
                    type="button"
                    className={cn(
                      "rounded-md border px-2 py-2 text-xs text-left transition-colors",
                      selected
                        ? "border-green-600 bg-green-500/15 text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    )}
                    onClick={() => toggleSlot(day.value, hour.value)}
                    disabled={readOnly}
                    aria-pressed={selected}
                  >
                    {hour.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table
          ref={gridRef}
          className="w-full border-collapse select-none"
          onMouseLeave={() => {
            if (isDragging) {
              // Don't end drag when leaving table, only on mouse up
            }
          }}
          onTouchMove={handleTouchMove}
        >
          <thead>
            <tr>
              <th className="p-2 text-xs font-medium text-muted-foreground w-20"></th>
              {WEEKDAYS.map((day) => (
                <th
                  key={day.value}
                  className="p-2 text-xs font-medium text-center min-w-[80px]"
                >
                  <span className="hidden sm:inline">{day.label}</span>
                  <span className="sm:hidden">{day.short}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour.value}>
                <td className="p-1 text-xs text-muted-foreground text-right pr-2 whitespace-nowrap">
                  {hour.label}
                </td>
                {WEEKDAYS.map((day) => {
                  const selected = isSelected(day.value, hour.value)
                  return (
                    <td
                      key={`${day.value}-${hour.value}`}
                      data-slot
                      data-weekday={day.value}
                      data-hour={hour.value}
                      className={cn(
                        "p-0 border border-border/50",
                        !readOnly && "cursor-pointer"
                      )}
                      onMouseDown={() => handleMouseDown(day.value, hour.value)}
                      onMouseEnter={() => handleMouseEnter(day.value, hour.value)}
                      onTouchStart={() => handleTouchStart(day.value, hour.value)}
                    >
                      <div
                        className={cn(
                          "h-8 sm:h-10 transition-colors",
                          selected
                            ? "bg-green-500/70 hover:bg-green-500/80"
                            : "bg-muted/30 hover:bg-muted/50",
                          readOnly && "cursor-default"
                        )}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <p className="text-xs text-muted-foreground">
          <span className="sm:hidden">Tip: Tap a slot to toggle it on or off</span>
          <span className="hidden sm:inline">Tip: Click and drag to quickly select multiple time slots</span>
        </p>
      )}
    </div>
  )
}

/**
 * Utility to aggregate availability from multiple users
 * Returns a map of slot key to list of user names
 */
export function aggregateAvailability(
  availabilityData: Array<{
    userId: number
    user: { name: string }
    slots: AvailabilitySlot[]
  }>
): Map<string, string[]> {
  const aggregated = new Map<string, string[]>()

  for (const entry of availabilityData) {
    for (const slot of entry.slots) {
      const key = `${slot.weekday}-${slot.hour}`
      const existing = aggregated.get(key) || []
      existing.push(entry.user.name)
      aggregated.set(key, existing)
    }
  }

  return aggregated
}

/**
 * Get availability count for a specific slot
 */
export function getSlotAvailability(
  aggregated: Map<string, string[]>,
  weekday: number,
  hour: number
): string[] {
  return aggregated.get(`${weekday}-${hour}`) || []
}
