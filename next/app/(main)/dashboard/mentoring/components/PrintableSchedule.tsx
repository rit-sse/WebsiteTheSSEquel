"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"

interface ScheduleBlock {
  id: number
  weekday: number
  startHour: number
  mentor: {
    id: number
    name: string
    email: string
    image: string
  }
}

interface MentorSchedule {
  id: number
  name: string
  isActive: boolean
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const HOURS = [
  { hour: 10, label: "10am - 11am" },
  { hour: 11, label: "11am - 12pm" },
  { hour: 12, label: "12pm - 1pm" },
  { hour: 13, label: "1pm - 2pm" },
  { hour: 14, label: "2pm - 3pm" },
  { hour: 15, label: "3pm - 4pm" },
  { hour: 16, label: "4pm - 5pm" },
  { hour: 17, label: "5pm - 6pm" },
]

// Color palette for mentors - print-friendly colors with good contrast
const MENTOR_COLORS = [
  { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },   // Red
  { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },   // Blue
  { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },   // Green
  { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },   // Amber
  { bg: "#E9D5FF", border: "#A855F7", text: "#6B21A8" },   // Purple
  { bg: "#CFFAFE", border: "#06B6D4", text: "#155E75" },   // Cyan
  { bg: "#FCE7F3", border: "#EC4899", text: "#9D174D" },   // Pink
  { bg: "#FED7AA", border: "#F97316", text: "#9A3412" },   // Orange
  { bg: "#E0E7FF", border: "#6366F1", text: "#3730A3" },   // Indigo
  { bg: "#ECFCCB", border: "#84CC16", text: "#3F6212" },   // Lime
]

interface PrintableScheduleProps {
  scheduleId?: number
}

export default function PrintableSchedule({ scheduleId }: PrintableScheduleProps) {
  const [schedule, setSchedule] = useState<MentorSchedule | null>(null)
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      // If scheduleId is provided, fetch that schedule
      // Otherwise fetch active schedule
      let scheduleData: MentorSchedule | null = null
      
      if (scheduleId) {
        const res = await fetch(`/api/mentorSchedule?id=${scheduleId}`)
        if (res.ok) {
          scheduleData = await res.json()
        }
      } else {
        const res = await fetch("/api/mentorSchedule")
        if (res.ok) {
          const schedules = await res.json()
          scheduleData = schedules.find((s: MentorSchedule) => s.isActive) || null
        }
      }

      if (scheduleData) {
        setSchedule(scheduleData)
        
        // Fetch blocks for this schedule
        const blocksRes = await fetch(`/api/scheduleBlock?scheduleId=${scheduleData.id}`)
        if (blocksRes.ok) {
          const data = await blocksRes.json()
          setBlocks(data.blocks || [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error)
    } finally {
      setIsLoading(false)
    }
  }, [scheduleId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Build a color map for unique mentors
  const mentorColorMap = useMemo(() => {
    const uniqueMentorIds = Array.from(new Set(blocks.map((b) => b.mentor.id)))
    const colorMap = new Map<number, typeof MENTOR_COLORS[0]>()
    
    uniqueMentorIds.forEach((mentorId, index) => {
      colorMap.set(mentorId, MENTOR_COLORS[index % MENTOR_COLORS.length])
    })
    
    return colorMap
  }, [blocks])

  // Get unique mentors for the legend
  const uniqueMentors = useMemo(() => {
    const mentorMap = new Map<number, { id: number; name: string }>()
    blocks.forEach((block) => {
      if (!mentorMap.has(block.mentor.id)) {
        mentorMap.set(block.mentor.id, { id: block.mentor.id, name: block.mentor.name })
      }
    })
    return Array.from(mentorMap.values())
  }, [blocks])

  const getBlocksForSlot = (weekday: number, hour: number): ScheduleBlock[] => {
    return blocks.filter((b) => b.weekday === weekday && b.startHour === hour)
  }

  const getMentorColor = (mentorId: number) => {
    return mentorColorMap.get(mentorId) || MENTOR_COLORS[0]
  }

  const handlePrint = () => {
    window.print()
  }

  const handleClose = () => {
    window.close()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No schedule found</p>
      </div>
    )
  }

  return (
    <>
      {/* Printable content */}
      <div data-theme="light" data-style="neo" className="min-h-screen bg-background text-foreground">
        <div id="printable-schedule" className="p-4 print:p-0 w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-6 print:mb-2">
          <h1 className="text-3xl font-bold print:text-xl">SSE Mentor Schedule</h1>
          <p className="text-muted-foreground text-lg print:text-sm">{schedule.name}</p>
        </div>

        {/* Legend - shows which color belongs to which mentor */}
        <div className="mb-4 print:mb-1">
          <div className="flex flex-wrap gap-2 justify-center">
            {uniqueMentors.map((mentor) => {
              const color = getMentorColor(mentor.id)
              return (
                <div
                  key={mentor.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: color.bg,
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderColor: color.border,
                    color: color.text,
                  }}
                >
                  {mentor.name}
                </div>
              )
            })}
          </div>
        </div>

        {/* Schedule grid - days as columns */}
        <div className="border-2 border-black rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/60">
                <th className="border-b-2 border-r-2 border-black p-4 text-base font-bold w-28">
                  Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="border-b-2 border-black p-4 text-base font-bold text-center"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(({ hour, label }) => (
                <tr key={hour}>
                  <td className="border-r-2 border-b border-black p-3 text-sm font-bold text-center whitespace-nowrap bg-muted/30">
                    {label}
                  </td>
                  {DAYS.map((_, dayIndex) => {
                    const weekday = dayIndex + 1
                    const slotBlocks = getBlocksForSlot(weekday, hour)
                    
                    return (
                      <td
                        key={dayIndex}
                        className="border-b border-black p-2 align-middle"
                        style={{ height: "80px" }}
                      >
                        {slotBlocks.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {slotBlocks.map((block) => {
                              const color = getMentorColor(block.mentor.id)
                              return (
                                <div
                                  key={block.id}
                                  className="text-sm font-bold px-3 py-2 rounded text-center truncate"
                                  style={{
                                    backgroundColor: color.bg,
                                    borderWidth: "2px",
                                    borderStyle: "solid",
                                    borderColor: color.border,
                                    color: color.text,
                                  }}
                                >
                                  {block.mentor.name.split(" ")[0]}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground/30">—</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-6 print:mt-2 text-center text-sm print:text-xs text-muted-foreground">
          <p className="font-medium">Society of Software Engineers • Golisano Hall</p>
          <p className="mt-1">Questions? Visit sse.rit.edu or join our Discord</p>
        </div>

        {/* Print controls - hidden when printing */}
        <div className="print:hidden flex justify-center gap-3 mt-8 pt-6 border-t">
          <Button onClick={handlePrint} size="lg">
            <Printer className="h-5 w-5 mr-2" />
            Print Schedule
          </Button>
          <Button variant="outline" size="lg" onClick={handleClose}>
            <X className="h-5 w-5 mr-2" />
            Close
          </Button>
        </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-scheme: light;
            background: #ffffff !important;
            color: #000000 !important;
          }
          
          @page {
            size: portrait;
            margin: 0.15in 0.4in 0.2in 0.4in; /* top right bottom left */
          }
          
          /* Hide buttons when printing */
          .print\\:hidden,
          button {
            display: none !important;
          }
          
          /* Ensure the schedule fills the page */
          body, html {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          #printable-schedule {
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          
          #printable-schedule table {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  )
}
