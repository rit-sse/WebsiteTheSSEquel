"use client"

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from "@/components/ui/neo-card"
import { toast } from "sonner"
import { Plus, X, User, Clock, Calendar, Users, Check, Printer } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { AvailabilitySlot, aggregateAvailability, getSlotAvailability } from "./AvailabilityGrid"

// Schedule types
interface ScheduleBlock {
  id: number
  weekday: number
  startHour: number
  mentor: {
    id: number
    name: string
    email: string
    image: string
    isActive: boolean
    skills: { id: number; name: string }[]
    courses: { id: number; title: string; code: string; department: string }[]
  }
}

interface MentorSchedule {
  id: number
  name: string
  isActive: boolean
}

interface Mentor {
  id: number
  user: {
    id: number
    name: string
    email: string
    image: string
  }
  isActive: boolean
  expirationDate: string
}

// Availability data from built-in system
interface AvailabilityData {
  userId: number
  user: { id: number; name: string; email: string; image: string }
  slots: AvailabilitySlot[]
}

interface MentorSemester {
  id: number
  name: string
  isActive: boolean
}

interface TrafficDatum {
  weekday: number
  hour: number
  averagePeopleInLab: number
  sampleCount: number
}

// Day and hour labels
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

// Mentor colors for visual distinction
const MENTOR_COLORS = [
  "bg-orange-500/80",
  "bg-fuchsia-500/80",
  "bg-sky-500/80",
  "bg-red-500/80",
  "bg-violet-500/80",
  "bg-emerald-500/80",
  "bg-indigo-500/80",
  "bg-green-500/80",
  "bg-cyan-500/80",
]

function getMentorColor(mentorId: number): string {
  return MENTOR_COLORS[mentorId % MENTOR_COLORS.length]
}

export default function MentorScheduleEditor() {
  const [activeSchedule, setActiveSchedule] = useState<MentorSchedule | null>(null)
  const [activeSemester, setActiveSemester] = useState<MentorSemester | null>(null)
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignSlot, setAssignSlot] = useState<{ weekday: number; hour: number } | null>(null)
  const [selectedMentorId, setSelectedMentorId] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)

  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [removeBlock, setRemoveBlock] = useState<ScheduleBlock | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [clearModalOpen, setClearModalOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Detail drawer state
  const [detailSlot, setDetailSlot] = useState<{ weekday: number; hour: number } | null>(null)
  const [detailBlocks, setDetailBlocks] = useState<ScheduleBlock[]>([])
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Availability overlay state
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([])
  const [showAvailability, setShowAvailability] = useState(false)

  // Traffic indicator state
  const [trafficData, setTrafficData] = useState<TrafficDatum[]>([])

  // Auto-fill schedule modal state
  const [autoFillOpen, setAutoFillOpen] = useState(false)
  const [autoFillMaxPerSlot, setAutoFillMaxPerSlot] = useState(2)
  const [autoFillSlotsPerMentor, setAutoFillSlotsPerMentor] = useState(4)
  const [autoFillEmptyOnly, setAutoFillEmptyOnly] = useState(true)
  const [autoFillReport, setAutoFillReport] = useState<{
    assignments: number
    unfilledSlots: string[]
    unassignedMentors: string[]
  } | null>(null)
  const [isAutoFilling, setIsAutoFilling] = useState(false)

  // Fetch the canonical schedule
  const fetchSchedule = useCallback(async () => {
    try {
      const response = await fetch("/api/mentorSchedule?activeOnly=true")
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setActiveSchedule(data[0])
          return
        }
      }

      const createResponse = await fetch("/api/mentorSchedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mentor Schedule", setActive: true }),
      })

      if (createResponse.ok) {
        const created = await createResponse.json()
        setActiveSchedule(created)
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error)
    }
  }, [])

  // Fetch active semester
  const fetchActiveSemester = useCallback(async () => {
    try {
      const semesterRes = await fetch("/api/mentor-semester?activeOnly=true")
      if (semesterRes.ok) {
        const semesters = await semesterRes.json()
        setActiveSemester(semesters[0] ?? null)
      }
    } catch (error) {
      console.error("Failed to fetch semester:", error)
    }
  }, [])

  // Fetch schedule blocks
  const fetchBlocks = useCallback(async () => {
    if (!activeSchedule) {
      setBlocks([])
      return
    }

    try {
      const response = await fetch(`/api/scheduleBlock?scheduleId=${activeSchedule.id}`)
      if (response.ok) {
        const data = await response.json()
        setBlocks(data.blocks || [])
      }
    } catch (error) {
      console.error("Failed to fetch blocks:", error)
    }
  }, [activeSchedule])

  // Fetch mentors
  const fetchMentors = useCallback(async () => {
    try {
      const response = await fetch("/api/mentor")
      if (response.ok) {
        const data = await response.json()
        const now = new Date()
        setMentors(
          data.filter(
            (mentor: Mentor) =>
              mentor.isActive && new Date(mentor.expirationDate) >= now
          )
        )
      }
    } catch (error) {
      console.error("Failed to fetch mentors:", error)
    }
  }, [])

  // Fetch availability data for active semester
  const fetchAvailability = useCallback(async () => {
    if (!activeSemester) {
      setAvailabilityData([])
      return
    }

    try {
      const availRes = await fetch(
        `/api/mentor-availability?semesterId=${activeSemester.id}`
      )
      if (availRes.ok) {
        const data = await availRes.json()
        setAvailabilityData(data)
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error)
    }
  }, [activeSemester])

  const fetchTraffic = useCallback(async () => {
    if (!activeSemester) {
      setTrafficData([])
      return
    }

    try {
      const response = await fetch(
        `/api/mentoring-headcount?traffic=true&semesterId=${activeSemester.id}`
      )
      if (response.ok) {
        const data = await response.json()
        setTrafficData(data)
      }
    } catch (error) {
      console.error("Failed to fetch traffic data:", error)
    }
  }, [activeSemester])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchSchedule(), fetchActiveSemester(), fetchMentors()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchSchedule, fetchActiveSemester, fetchMentors])

  // Load blocks when active schedule changes
  useEffect(() => {
    if (activeSchedule) {
      fetchBlocks()
    }
  }, [activeSchedule, fetchBlocks])

  // Refresh availability and traffic when semester changes
  useEffect(() => {
    fetchAvailability()
    fetchTraffic()
  }, [fetchAvailability, fetchTraffic])

  // Get blocks for a specific time slot
  const getBlocksForSlot = (weekday: number, hour: number): ScheduleBlock[] => {
    return blocks.filter((b) => b.weekday === weekday && b.startHour === hour)
  }

  const trafficBySlot = useMemo(() => {
    const map = new Map<string, TrafficDatum>()
    trafficData.forEach((entry) => {
      map.set(`${entry.weekday}-${entry.hour}`, entry)
    })
    return map
  }, [trafficData])

  const getTrafficForSlot = (weekday: number, hour: number) => {
    return trafficBySlot.get(`${weekday}-${hour}`)
  }

  const getTrafficLevel = (averagePeopleInLab: number) => {
    if (averagePeopleInLab <= 3) return { label: "Quiet", value: 25 }
    if (averagePeopleInLab <= 8) return { label: "Steady", value: 55 }
    return { label: "Busy", value: 85 }
  }

  // Handle opening assign modal
  const handleOpenAssignModal = (weekday: number, hour: number) => {
    setAssignSlot({ weekday, hour })
    setSelectedMentorId("")
    setAssignModalOpen(true)
  }

  const handleOpenDetail = (weekday: number, hour: number) => {
    const slotBlocks = getBlocksForSlot(weekday, hour)
    if (slotBlocks.length === 0) return
    setDetailSlot({ weekday, hour })
    setDetailBlocks(slotBlocks)
    setIsDetailOpen(true)
  }

  const assignMentorToSlot = async (mentorId: number, weekday: number, hour: number) => {
    if (!activeSchedule) return
    const response = await fetch("/api/scheduleBlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mentorId,
        weekday,
        startHour: hour,
        scheduleId: activeSchedule.id,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Failed to assign mentor")
    }
  }

  const moveScheduleBlock = async (blockId: number, weekday: number, hour: number) => {
    const response = await fetch("/api/scheduleBlock", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: blockId, weekday, startHour: hour }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Failed to move mentor")
    }
  }

  // Handle assign mentor
  const handleAssignMentor = async () => {
    if (!assignSlot || !selectedMentorId) return

    setIsAssigning(true)
    try {
      await assignMentorToSlot(
        parseInt(selectedMentorId),
        assignSlot.weekday,
        assignSlot.hour
      )
      toast.success("Mentor assigned to time slot")
      fetchBlocks()
      setAssignModalOpen(false)
    } catch (error) {
      console.error("Failed to assign mentor:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsAssigning(false)
    }
  }

  // Handle remove block
  const handleRemoveBlock = async () => {
    if (!removeBlock) return

    setIsRemoving(true)
    try {
      const response = await fetch("/api/scheduleBlock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: removeBlock.id }),
      })

      if (response.ok) {
        toast.success("Mentor removed from time slot")
        fetchBlocks()
        setRemoveModalOpen(false)
        setRemoveBlock(null)
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to remove mentor")
      }
    } catch (error) {
      console.error("Failed to remove mentor:", error)
      toast.error("An error occurred")
    } finally {
      setIsRemoving(false)
    }
  }

  const handleClearSchedule = async () => {
    if (!activeSchedule) return

    setIsClearing(true)
    try {
      const response = await fetch("/api/scheduleBlock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: activeSchedule.id }),
      })

      if (response.ok) {
        toast.success("Schedule cleared")
        fetchBlocks()
        setClearModalOpen(false)
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to clear schedule")
      }
    } catch (error) {
      console.error("Failed to clear schedule:", error)
      toast.error("An error occurred")
    } finally {
      setIsClearing(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const targetId = over.id.toString()
    if (!targetId.startsWith("slot-")) return

    const [weekdayString, hourString] = targetId.replace("slot-", "").split("-")
    const weekday = parseInt(weekdayString)
    const hour = parseInt(hourString)

    if (Number.isNaN(weekday) || Number.isNaN(hour)) return

    const mentorId = active.data.current?.mentorId as number | undefined
    const blockId = active.data.current?.blockId as number | undefined

    if (!mentorId) return

    try {
      if (blockId) {
        await moveScheduleBlock(blockId, weekday, hour)
        toast.success("Mentor moved to new time slot")
      } else {
        await assignMentorToSlot(mentorId, weekday, hour)
        toast.success("Mentor assigned to time slot")
      }
      fetchBlocks()
    } catch (error) {
      console.error("Drag assignment failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update slot")
    }
  }

  const runAutoFillSchedule = async () => {
    if (!activeSchedule) {
      toast.error("No active schedule available")
      return
    }
    if (!availabilityData.length) {
      toast.error("No availability submissions to use")
      return
    }

    setIsAutoFilling(true)
    setAutoFillReport(null)
    try {
      const mentorByUserId = new Map<number, Mentor>()
      mentors.forEach((mentor) => mentorByUserId.set(mentor.user.id, mentor))

      const mentorAvailability = new Map<number, AvailabilitySlot[]>()
      availabilityData.forEach((entry) => {
        const mentor = mentorByUserId.get(entry.userId)
        if (!mentor) return
        mentorAvailability.set(mentor.id, entry.slots)
      })

      const existingAssignments = new Set(
        blocks.map((block) => `${block.mentor.id}-${block.weekday}-${block.startHour}`)
      )

      const mentorAssignmentCounts = new Map<number, number>()
      mentors.forEach((mentor) => mentorAssignmentCounts.set(mentor.id, 0))
      blocks.forEach((block) => {
        mentorAssignmentCounts.set(
          block.mentor.id,
          (mentorAssignmentCounts.get(block.mentor.id) ?? 0) + 1
        )
      })

      const slotCounts = new Map<string, number>()
      blocks.forEach((block) => {
        const key = `${block.weekday}-${block.startHour}`
        slotCounts.set(key, (slotCounts.get(key) ?? 0) + 1)
      })

      const assignments: { mentorId: number; weekday: number; hour: number }[] = []
      const unfilledSlots: string[] = []

      for (const { hour, label } of HOURS) {
        for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
          const weekday = dayIndex + 1
          const slotKey = `${weekday}-${hour}`
          const currentCount = slotCounts.get(slotKey) ?? 0

          if (autoFillEmptyOnly && currentCount >= autoFillMaxPerSlot) {
            continue
          }

          const availableMentors = mentors.filter((mentor) => {
            const availability = mentorAvailability.get(mentor.id) || []
            const hasSlot = availability.some(
              (slot) => slot.weekday === weekday && slot.hour === hour
            )
            const alreadyAssigned = existingAssignments.has(
              `${mentor.id}-${weekday}-${hour}`
            )
            const assignmentCount = mentorAssignmentCounts.get(mentor.id) ?? 0
            return hasSlot && !alreadyAssigned && assignmentCount < autoFillSlotsPerMentor
          })

          availableMentors.sort((a, b) => {
            const aCount = mentorAssignmentCounts.get(a.id) ?? 0
            const bCount = mentorAssignmentCounts.get(b.id) ?? 0
            return aCount - bCount
          })

          let filled = currentCount
          for (const mentor of availableMentors) {
            if (filled >= autoFillMaxPerSlot) break
            assignments.push({ mentorId: mentor.id, weekday, hour })
            mentorAssignmentCounts.set(
              mentor.id,
              (mentorAssignmentCounts.get(mentor.id) ?? 0) + 1
            )
            existingAssignments.add(`${mentor.id}-${weekday}-${hour}`)
            filled += 1
          }

          if (filled < autoFillMaxPerSlot) {
            unfilledSlots.push(`${DAYS[dayIndex]} ${label}`)
          }
        }
      }

      for (const assignment of assignments) {
        await assignMentorToSlot(assignment.mentorId, assignment.weekday, assignment.hour)
      }

      const unassignedMentors = mentors
        .filter((mentor) => (mentorAssignmentCounts.get(mentor.id) ?? 0) === 0)
        .map((mentor) => mentor.user.name)

      setAutoFillReport({
        assignments: assignments.length,
        unfilledSlots,
        unassignedMentors,
      })
      fetchBlocks()
      toast.success(`Auto-fill completed (${assignments.length} assignments)`)
    } catch (error) {
      console.error("Auto-fill failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to auto-fill schedule")
    } finally {
      setIsAutoFilling(false)
    }
  }


  // Get mentors not already in this slot
  const getAvailableMentors = (weekday: number, hour: number) => {
    const slotMentorIds = getBlocksForSlot(weekday, hour).map((b) => b.mentor.id)
    return mentors.filter((m) => !slotMentorIds.includes(m.id))
  }

  // Get aggregated availability for display
  const aggregatedAvailability = aggregateAvailability(availabilityData)

  // Get available names for a slot from built-in availability
  const getAvailabilityForSlot = (weekday: number, hour: number): string[] => {
    if (!showAvailability) return []
    return getSlotAvailability(aggregatedAvailability, weekday, hour)
  }

  // Get mentors who are available for a slot
  const getAvailableMentorsForSlot = (weekday: number, hour: number): Mentor[] => {
    const availableNames = getAvailabilityForSlot(weekday, hour)
    // Find mentors whose names match the available names
    return mentors.filter((m) => 
      availableNames.some((name) => 
        m.user.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(m.user.name.toLowerCase())
      )
    )
  }

  // Handle print schedule
  const handlePrint = () => {
    const printUrl = `/print/mentor-schedule?scheduleId=${activeSchedule?.id}`
    window.open(printUrl, "_blank")
  }

  // Placeholder for When2Meet availability (for backward compatibility)
  const getWhen2MeetAvailability = (weekday: number, hour: number): string[] => {
    return getAvailabilityForSlot(weekday, hour)
  }

  // Get mentors who have availability at this slot (simplified)
  const getMappedAvailableMentors = (weekday: number, hour: number): Mentor[] => {
    return getAvailableMentorsForSlot(weekday, hour)
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm py-8 text-center">
        Loading schedule...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold">Mentor Schedule</h2>
            <p className="text-sm text-muted-foreground">
              {activeSemester ? `Active semester: ${activeSemester.name}` : "No active semester set"}
            </p>
          </div>
          {activeSchedule && (
            <Button size="sm" variant="outline" onClick={() => setClearModalOpen(true)}>
              Clear Schedule
            </Button>
          )}
        </div>
        {activeSchedule && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setAutoFillOpen(true)}>
              Auto-fill Schedule
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        )}
      </div>

      {/* Availability overlay toggle */}
      {availabilityData.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Mentor Availability
              </p>
              <p className="text-xs text-muted-foreground">
                {availabilityData.length} people have submitted their availability
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">Show on grid</span>
            <Switch
              id="show-availability"
              checked={showAvailability}
              onCheckedChange={setShowAvailability}
            />
          </div>
        </div>
      )}

      {!activeSchedule ? (
        <div className="text-center py-12 border rounded-lg bg-surface-1">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No schedule selected</p>
          <p className="text-sm text-muted-foreground mt-1">
            A canonical schedule will appear once it is initialized.
          </p>
        </div>
      ) : (
        <>
          <DndContext onDragEnd={handleDragEnd}>
            <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full min-w-[800px] table-fixed">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="w-24 p-2 text-left text-sm font-medium text-muted-foreground">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Time
                      </th>
                      {DAYS.map((day) => (
                        <th
                          key={day}
                          className="p-2 text-center text-sm font-medium text-muted-foreground"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map(({ hour, label }) => (
                      <tr key={hour} className="border-b last:border-b-0">
                        <td className="p-2 text-sm text-muted-foreground font-medium bg-muted/30">
                          {label}
                        </td>
                        {DAYS.map((_, dayIndex) => {
                          const weekday = dayIndex + 1
                          const slotBlocks = getBlocksForSlot(weekday, hour)
                          const availableNames = getWhen2MeetAvailability(weekday, hour)
                          const mappedAvailable = getMappedAvailableMentors(weekday, hour)

                          return (
                            <ScheduleSlotCell
                              key={dayIndex}
                              id={`slot-${weekday}-${hour}`}
                              className={cn(
                                "p-1 h-16 align-top",
                                showAvailability && availableNames.length > 0 && "bg-green-500/10"
                              )}
                            >
                              <div className="flex flex-col gap-1 min-h-[3.5rem] min-w-0">
                                <div className="flex flex-wrap gap-1">
                                  {slotBlocks.map((block) => (
                                    <DraggableMentorChip
                                      key={block.id}
                                      id={`block-${block.id}`}
                                      mentorId={block.mentor.id}
                                      blockId={block.id}
                                      colorClass={getMentorColor(block.mentor.id)}
                                      label={block.mentor.name.split(" ")[0]}
                                      onClick={() => handleOpenDetail(weekday, hour)}
                                      title={`${block.mentor.name} - Click for details`}
                                    />
                                  ))}
                                  {slotBlocks.length < 2 && (
                                    <button
                                      onClick={() => handleOpenAssignModal(weekday, hour)}
                                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs px-2 py-1 rounded-md border border-dashed border-border transition-colors flex items-center gap-1"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add
                                    </button>
                                  )}
                                </div>
                                {showAvailability && availableNames.length > 0 && (
                                  <div
                                    className="text-[10px] text-green-700 dark:text-green-400 truncate max-w-full overflow-hidden"
                                    title={`Available: ${availableNames.join(", ")}`}
                                  >
                                    {mappedAvailable.length > 0 ? (
                                      <span className="flex items-center gap-1 min-w-0 truncate">
                                        <Users className="h-3 w-3 shrink-0" />
                                        <span className="min-w-0 truncate">
                                          {mappedAvailable
                                            .map((m) => m.user.name.split(" ")[0])
                                            .join(", ")}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="opacity-60">
                                        {availableNames.length} available
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </ScheduleSlotCell>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <NeoCard>
                  <NeoCardHeader>
                    <NeoCardTitle>Mentor Pool</NeoCardTitle>
                  </NeoCardHeader>
                  <NeoCardContent className="flex flex-wrap gap-2">
                    {mentors.map((mentor) => (
                      <DraggableMentorChip
                        key={mentor.id}
                        id={`mentor-${mentor.id}`}
                        mentorId={mentor.id}
                        colorClass={getMentorColor(mentor.id)}
                        label={mentor.user.name.split(" ")[0]}
                        title={`Drag ${mentor.user.name} onto the schedule`}
                      />
                    ))}
                  </NeoCardContent>
                </NeoCard>
                <NeoCard>
                  <NeoCardHeader>
                    <NeoCardTitle>Headcount Forms</NeoCardTitle>
                  </NeoCardHeader>
                  <NeoCardContent className="space-y-2">
                    <Button asChild variant="outline" className="w-full">
                      <a href="/mentoring/headcount/mentors" target="_blank" rel="noreferrer">
                        30-min Mentor Headcount
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <a href="/mentoring/headcount/mentees" target="_blank" rel="noreferrer">
                        55-min Mentee Headcount
                      </a>
                    </Button>
                  </NeoCardContent>
                </NeoCard>
              </div>
            </div>
          </DndContext>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Assigned mentors:</span>
            {Array.from(new Set(blocks.map((b) => b.mentor.id))).map((mentorId) => {
              const mentor = blocks.find((b) => b.mentor.id === mentorId)?.mentor
              if (!mentor) return null
              return (
                <span
                  key={mentorId}
                  className={`${getMentorColor(mentorId)} text-white px-2 py-0.5 rounded`}
                >
                  {mentor.name}
                </span>
              )
            })}
          </div>
        </>
      )}

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>Slot Details</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 mt-4">
            {detailSlot && (
              <div className="text-sm text-muted-foreground">
                {DAYS[detailSlot.weekday - 1]} •{" "}
                {HOURS.find((h) => h.hour === detailSlot.hour)?.label}
              </div>
            )}

            {detailSlot && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expected traffic</span>
                  {(() => {
                    const traffic = getTrafficForSlot(detailSlot.weekday, detailSlot.hour)
                    if (!traffic) return <span className="text-xs text-muted-foreground">No data yet</span>
                    const level = getTrafficLevel(traffic.averagePeopleInLab)
                    return (
                      <span className="text-xs text-muted-foreground">
                        {level.label} · {traffic.averagePeopleInLab.toFixed(1)} avg
                      </span>
                    )
                  })()}
                </div>
                {(() => {
                  const traffic = detailSlot
                    ? getTrafficForSlot(detailSlot.weekday, detailSlot.hour)
                    : null
                  if (!traffic) return null
                  const level = getTrafficLevel(traffic.averagePeopleInLab)
                  return <Progress value={level.value} />
                })()}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Assigned mentors</h3>
              {detailBlocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mentors assigned yet.</p>
              ) : (
                detailBlocks.map((block) => (
                  <NeoCard key={block.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{block.mentor.name}</div>
                        <div className="text-xs text-muted-foreground">{block.mentor.email}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {block.mentor.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill.id} variant="outline" className="text-[10px]">
                              {skill.name}
                            </Badge>
                          ))}
                          {block.mentor.skills.length === 0 && (
                            <span className="text-xs text-muted-foreground">No skills listed</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {block.mentor.courses.slice(0, 4).map((course) => (
                            <Badge key={course.id} variant="secondary" className="text-[10px]">
                              {course.code}
                            </Badge>
                          ))}
                          {block.mentor.courses.length === 0 && (
                            <span className="text-xs text-muted-foreground">No courses listed</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRemoveBlock(block)
                          setRemoveModalOpen(true)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </NeoCard>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Auto-fill Schedule Modal */}
      <Modal
        open={autoFillOpen}
        onOpenChange={(open) => {
          setAutoFillOpen(open)
          if (!open) setAutoFillReport(null)
        }}
        title="Auto-fill Schedule"
        description="Generate schedule blocks from mentor availability."
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max mentors per slot</label>
              <Input
                type="number"
                min={1}
                max={3}
                value={autoFillMaxPerSlot}
                onChange={(e) => setAutoFillMaxPerSlot(parseInt(e.target.value || "1"))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max slots per mentor</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={autoFillSlotsPerMentor}
                onChange={(e) => setAutoFillSlotsPerMentor(parseInt(e.target.value || "1"))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Fill empty slots only</p>
              <p className="text-xs text-muted-foreground">
                Keep existing assignments and only add where capacity remains.
              </p>
            </div>
            <Switch checked={autoFillEmptyOnly} onCheckedChange={setAutoFillEmptyOnly} />
          </div>

          {autoFillReport && (
            <div className="space-y-3 rounded-md border bg-muted/40 p-3">
              <p className="text-sm font-medium">Auto-fill report</p>
              <p className="text-xs text-muted-foreground">
                Assignments created: {autoFillReport.assignments}
              </p>
              {autoFillReport.unassignedMentors.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Unassigned mentors: {autoFillReport.unassignedMentors.join(", ")}
                </div>
              )}
              {autoFillReport.unfilledSlots.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Unfilled slots: {autoFillReport.unfilledSlots.slice(0, 8).join(", ")}
                  {autoFillReport.unfilledSlots.length > 8 && "…"}
                </div>
              )}
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setAutoFillOpen(false)}>
            Close
          </Button>
          <Button onClick={runAutoFillSchedule} disabled={isAutoFilling}>
            {isAutoFilling ? "Auto-filling..." : "Run Auto-fill"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Assign Mentor Modal */}
      <Modal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        title="Assign Mentor"
        description={
          assignSlot
            ? `${DAYS[assignSlot.weekday - 1]} at ${HOURS.find((h) => h.hour === assignSlot.hour)?.label}`
            : ""
        }
      >
        <div className="space-y-4">
          <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a mentor" />
            </SelectTrigger>
            <SelectContent>
              {assignSlot &&
                getAvailableMentors(assignSlot.weekday, assignSlot.hour).map((mentor) => (
                  <SelectItem key={mentor.id} value={mentor.id.toString()}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {mentor.user.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {assignSlot &&
            getAvailableMentors(assignSlot.weekday, assignSlot.hour).length === 0 && (
              <p className="text-sm text-muted-foreground">
                All active mentors are already assigned to this time slot.
              </p>
            )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssignMentor} disabled={!selectedMentorId || isAssigning}>
            {isAssigning ? "Assigning..." : "Assign Mentor"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Remove Mentor Modal */}
      <Modal
        open={removeModalOpen}
        onOpenChange={setRemoveModalOpen}
        title="Remove Mentor"
        className="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          Remove <strong>{removeBlock?.mentor.name}</strong> from{" "}
          <strong>
            {removeBlock && DAYS[removeBlock.weekday - 1]} at{" "}
            {removeBlock && HOURS.find((h) => h.hour === removeBlock.startHour)?.label}
          </strong>
          ?
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setRemoveModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemoveBlock} disabled={isRemoving}>
            {isRemoving ? "Removing..." : "Remove"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Clear Schedule Modal */}
      <Modal
        open={clearModalOpen}
        onOpenChange={setClearModalOpen}
        title="Clear Schedule"
        className="max-w-md"
      >
        <p className="text-sm text-muted-foreground">
          This will remove all mentors from the schedule. This cannot be undone.
        </p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setClearModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleClearSchedule} disabled={isClearing}>
            {isClearing ? "Clearing..." : "Clear Schedule"}
          </Button>
        </ModalFooter>
      </Modal>

    </div>
  )
}

function ScheduleSlotCell({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <td
      ref={setNodeRef}
      className={cn(className, isOver && "bg-accent/20")}
    >
      {children}
    </td>
  )
}

function DraggableMentorChip({
  id,
  mentorId,
  blockId,
  label,
  colorClass,
  onClick,
  title,
}: {
  id: string
  mentorId: number
  blockId?: number
  label: string
  colorClass: string
  onClick?: () => void
  title?: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { mentorId, blockId },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={cn(
        `${colorClass} text-white text-xs px-2 py-1 rounded-md transition-opacity truncate max-w-[100px]`,
        isDragging && "opacity-60"
      )}
      onClick={onClick}
      title={title}
      {...attributes}
      {...listeners}
    >
      {label}
    </button>
  )
}
