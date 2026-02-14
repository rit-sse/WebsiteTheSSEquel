"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"
import { getCategoricalColorFromSeed } from "@/lib/categoricalColors"

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

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "?"
  )
}

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

  const getBlocksForSlot = (weekday: number, hour: number): ScheduleBlock[] => {
    return blocks.filter((b) => b.weekday === weekday && b.startHour === hour)
  }

  const getMentorColor = (mentorId: number) => {
    return getCategoricalColorFromSeed(mentorId)
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
      <div data-theme="light" data-style="neo" className="min-h-screen bg-white text-black">
        <div id="printable-schedule" className="p-4 print:p-0 w-full mx-auto print:h-screen print:flex print:flex-col">
        {/* Header */}
        <div className="text-center mb-4 print:mb-1">
          <h1 className="text-2xl font-bold print:text-lg print:leading-tight">SSE Mentor Schedule</h1>
          <p className="text-muted-foreground text-base print:text-xs print:leading-tight">{schedule.name}</p>
        </div>

        {/* Schedule grid */}
        <div className="border-2 border-black rounded-lg overflow-hidden print:flex-1 print:flex print:flex-col">
          <table className="w-full border-collapse table-fixed print:h-full">
            <thead>
              <tr className="bg-white">
                <th className="border-b-2 border-r-2 border-black p-2 print:p-1 text-sm font-bold w-20 print:w-16">
                  Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="border-b-2 border-black p-2 print:p-1 text-sm font-bold text-center"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(({ hour, label }) => {
                const shortLabel = label.replace("am", "").replace("pm", "").replace(" - ", "-")
                return (
                <tr key={hour} className="print-row">
                  <td className="border-r-2 border-b border-black p-1.5 print:p-1 text-xs font-bold text-center whitespace-nowrap bg-white">
                    {shortLabel}
                  </td>
                  {DAYS.map((_, dayIndex) => {
                    const weekday = dayIndex + 1
                    const slotBlocks = getBlocksForSlot(weekday, hour)
                    
                    return (
                      <td
                        key={dayIndex}
                        className="border-b border-r border-black/20 p-0.5 align-top"
                      >
                        {slotBlocks.length > 0 ? (
                          <div className="flex flex-col gap-0.5 h-full">
                            {slotBlocks.map((block) => {
                              const color = getMentorColor(block.mentor.id)
                              return (
                                <div
                                  key={block.id}
                                  className="text-xs font-semibold px-1 py-1.5 print:py-1 rounded-sm flex items-center gap-1.5 min-w-0 flex-1"
                                  style={{
                                    backgroundColor: color.fill,
                                    borderLeft: `3px solid ${color.fill}`,
                                    color: color.foreground,
                                  }}
                                >
                                  <span className="h-6 w-6 rounded-full overflow-hidden bg-white border border-black/20 shrink-0 flex items-center justify-center text-[10px] font-bold">
                                    {block.mentor.image ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={block.mentor.image}
                                        alt={block.mentor.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span>{getInitials(block.mentor.name)}</span>
                                    )}
                                  </span>
                                  <span className="truncate">{block.mentor.name}</span>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-3 print:mt-1 text-center text-xs print:text-[10px] text-muted-foreground">
          <p className="font-medium">Society of Software Engineers • Golisano Hall • sse.rit.edu</p>
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
            margin: 0.15in 0.4in 0.15in 0.4in;
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
            height: 100% !important;
          }
          
          #printable-schedule {
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          #printable-schedule table {
            width: 100% !important;
            height: 100% !important;
          }

          /* Distribute row height evenly across the page */
          .print-row {
            height: calc((100vh - 4.5rem) / 8);
          }

          .print-row td {
            vertical-align: middle;
          }
        }
      `}</style>
    </>
  )
}
