"use client"

import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties, type ReactNode } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { X, User, Clock, Calendar, Users, Printer, Activity } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { getCategoricalColorFromSeed } from "@/lib/categoricalColors"
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

function getMentorColor(mentorId: number) {
  return getCategoricalColorFromSeed(mentorId)
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "?"
  )
}

interface MentorScheduleEditorProps {
  ToolbarPortal?: React.ComponentType<{ target: HTMLElement | null; children: React.ReactNode }>
  toolbarNode?: HTMLElement | null
}

export default function MentorScheduleEditor({ ToolbarPortal, toolbarNode }: MentorScheduleEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )
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
  const [showTraffic, setShowTraffic] = useState(true)

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

  // Headcount import state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importType, setImportType] = useState<"mentor" | "mentee">("mentor")
  const [importHeaders, setImportHeaders] = useState<string[]>([])
  const [importRows, setImportRows] = useState<Record<string, string>[]>([])
  const [importMapping, setImportMapping] = useState<Record<string, string>>({})
  const [importResult, setImportResult] = useState<{
    created: number
    skipped: number
    duplicates: number
    semestersUsed: string[]
    errors: string[]
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

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
    if (averagePeopleInLab < 6)  return { label: "<6",    value: 15, cellTint: "bg-blue-500/10" }
    if (averagePeopleInLab < 10) return { label: "6–10",  value: 33, cellTint: "bg-blue-500/22" }
    if (averagePeopleInLab < 16) return { label: "10–16", value: 55, cellTint: "bg-blue-500/35" }
    if (averagePeopleInLab < 20) return { label: "16–20", value: 75, cellTint: "bg-blue-500/50" }
    return                               { label: "20+",   value: 95, cellTint: "bg-blue-500/65" }
  }

  const getTrafficCellClass = (weekday: number, hour: number) => {
    if (!showTraffic) return ""
    const traffic = getTrafficForSlot(weekday, hour)
    if (!traffic) return ""
    return getTrafficLevel(traffic.averagePeopleInLab).cellTint
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

  const removeScheduleBlockById = async (blockId: number) => {
    const response = await fetch("/api/scheduleBlock", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: blockId }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Failed to remove mentor")
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
      await removeScheduleBlockById(removeBlock.id)
      toast.success("Mentor removed from time slot")
      fetchBlocks()
      setRemoveModalOpen(false)
      setRemoveBlock(null)
    } catch (error) {
      console.error("Failed to remove mentor:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred")
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
    const { active, over, delta } = event

    // Ignore zero-distance drags (clicks)
    if (Math.abs(delta.x) < 5 && Math.abs(delta.y) < 5) return

    const mentorId = active.data.current?.mentorId as number | undefined
    const blockId = active.data.current?.blockId as number | undefined

    if (!mentorId) return

    const targetId = over?.id?.toString()

    // If dropped on a schedule slot, assign or move
    if (targetId && targetId.startsWith("slot-")) {
      const [weekdayString, hourString] = targetId.replace("slot-", "").split("-")
      const weekday = parseInt(weekdayString)
      const hour = parseInt(hourString)

      if (Number.isNaN(weekday) || Number.isNaN(hour)) return

      // If moving an existing block, check it actually changed slots
      if (blockId) {
        const existingBlock = blocks.find((b) => b.id === blockId)
        if (existingBlock && existingBlock.weekday === weekday && existingBlock.startHour === hour) {
          return // Same slot, no move needed
        }
      }

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
      return
    }

    // Dropped anywhere else — if it was on the schedule, remove it
    if (blockId) {
      try {
        await removeScheduleBlockById(blockId)
        toast.success("Mentor removed from schedule")
        fetchBlocks()
      } catch (error) {
        console.error("Drag removal failed:", error)
        toast.error(error instanceof Error ? error.message : "Failed to remove mentor")
      }
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

      type CandidateSlot = { weekday: number; hour: number; dayIndex: number; label: string }
      const candidateSlots: CandidateSlot[] = []

      for (const { hour, label } of HOURS) {
        for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
          const weekday = dayIndex + 1
          const slotKey = `${weekday}-${hour}`
          const currentCount = slotCounts.get(slotKey) ?? 0

          // Strict mode: only touch completely empty slots.
          if (autoFillEmptyOnly && currentCount > 0) continue
          if (currentCount >= autoFillMaxPerSlot) continue

          candidateSlots.push({ weekday, hour, dayIndex, label })
        }
      }

      // Fill in passes so lower-coverage slots are always prioritized first:
      // pass 1 fills up to one mentor per slot, pass 2 fills up to two, etc.
      for (let targetCoverage = 1; targetCoverage <= autoFillMaxPerSlot; targetCoverage++) {
        candidateSlots.sort((a, b) => {
          const aCount = slotCounts.get(`${a.weekday}-${a.hour}`) ?? 0
          const bCount = slotCounts.get(`${b.weekday}-${b.hour}`) ?? 0
          return aCount - bCount
        })

        for (const slot of candidateSlots) {
          const slotKey = `${slot.weekday}-${slot.hour}`
          const currentCount = slotCounts.get(slotKey) ?? 0
          if (currentCount >= targetCoverage) continue
          if (currentCount >= autoFillMaxPerSlot) continue

          const availableMentors = mentors
            .filter((mentor) => {
              const availability = mentorAvailability.get(mentor.id) || []
              const hasSlot = availability.some(
                (entry) => entry.weekday === slot.weekday && entry.hour === slot.hour
              )
              const alreadyAssigned = existingAssignments.has(
                `${mentor.id}-${slot.weekday}-${slot.hour}`
              )
              const assignmentCount = mentorAssignmentCounts.get(mentor.id) ?? 0
              return hasSlot && !alreadyAssigned && assignmentCount < autoFillSlotsPerMentor
            })
            .sort((a, b) => {
              const aCount = mentorAssignmentCounts.get(a.id) ?? 0
              const bCount = mentorAssignmentCounts.get(b.id) ?? 0
              return aCount - bCount
            })

          const mentor = availableMentors[0]
          if (!mentor) continue

          assignments.push({ mentorId: mentor.id, weekday: slot.weekday, hour: slot.hour })
          mentorAssignmentCounts.set(
            mentor.id,
            (mentorAssignmentCounts.get(mentor.id) ?? 0) + 1
          )
          existingAssignments.add(`${mentor.id}-${slot.weekday}-${slot.hour}`)
          slotCounts.set(slotKey, currentCount + 1)
        }
      }

      for (const slot of candidateSlots) {
        const filled = slotCounts.get(`${slot.weekday}-${slot.hour}`) ?? 0
        if (filled < autoFillMaxPerSlot) {
          unfilledSlots.push(`${DAYS[slot.dayIndex]} ${slot.label}`)
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

  const guessHeader = (headers: string[], keywords: string[]) => {
    const lowerHeaders = headers.map((header) => header.toLowerCase())
    return (
      headers[
        lowerHeaders.findIndex((header) =>
          keywords.some((keyword) => header.includes(keyword))
        )
      ] || ""
    )
  }

  const handleImportFile = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        setImportHeaders(headers)
        setImportRows(results.data.filter((row) => Object.keys(row).length > 0))
        setImportMapping({
          createdAt: guessHeader(headers, ["timestamp", "time", "date"]),
          mentors: guessHeader(headers, ["mentor", "mentors", "on duty"]),
          peopleInLab: guessHeader(headers, ["people", "lab", "headcount"]),
          feeling: guessHeader(headers, ["feeling", "mood"]),
          studentsMentoredCount: guessHeader(headers, ["students", "mentee", "mentored"]),
          testsCheckedOutCount: guessHeader(headers, ["test", "checked out"]),
          classes: guessHeader(headers, ["class", "course", "courses"]),
          otherClassText: guessHeader(headers, ["other"]),
        })
        setImportResult(null)
      },
    })
  }

  const parseListField = (value: string) =>
    value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)

  const buildImportPayload = () => {
    return importRows.map((row) => {
      const getValue = (key: string) => row[importMapping[key] || ""] || ""
      const createdAt = getValue("createdAt")
      const mentors = parseListField(getValue("mentors"))
      if (importType === "mentor") {
        return {
          createdAt,
          mentors,
          peopleInLab: parseInt(getValue("peopleInLab"), 10),
          feeling: getValue("feeling"),
        }
      }
      return {
        createdAt,
        mentors,
        studentsMentoredCount: parseInt(getValue("studentsMentoredCount"), 10),
        testsCheckedOutCount: parseInt(getValue("testsCheckedOutCount"), 10),
        classes: parseListField(getValue("classes")),
        otherClassText: getValue("otherClassText") || null,
      }
    })
  }

  const handleRunImport = async () => {
    if (!importRows.length) {
      toast.error("No CSV rows to import")
      return
    }

    const requiredFields =
      importType === "mentor"
        ? ["createdAt", "mentors", "peopleInLab", "feeling"]
        : ["createdAt", "mentors", "studentsMentoredCount", "testsCheckedOutCount"]

    const missing = requiredFields.filter((field) => !importMapping[field])
    if (missing.length > 0) {
      toast.error("Please map all required fields before importing")
      return
    }

    setIsImporting(true)
    try {
      const response = await fetch("/api/headcount-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: importType,
          rows: buildImportPayload(),
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setImportResult({
          created: data.created,
          skipped: data.skipped,
          duplicates: data.duplicates ?? 0,
          semestersUsed: data.semestersUsed ?? [],
          errors: data.errors || [],
        })
        toast.success("Headcount import completed")
        fetchTraffic()
      } else {
        toast.error(data.error || "Failed to import headcount data")
      }
    } catch (error) {
      console.error("Failed to import headcount data:", error)
      toast.error("An error occurred during import")
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm py-8 text-center">
        Loading schedule...
      </div>
    )
  }

  const toolbarButtons = activeSchedule ? (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setClearModalOpen(true)}
        className="text-muted-foreground hover:text-destructive hover:border-destructive"
      >
        <X className="h-3.5 w-3.5" />
        Clear
      </Button>
      {availabilityData.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAvailability(!showAvailability)}
          className={showAvailability ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
        >
          <Users className="h-3.5 w-3.5" />
          Availability
        </Button>
      )}
      {trafficData.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTraffic(!showTraffic)}
        >
          <Activity className="h-3.5 w-3.5" />
          Traffic
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => setAutoFillOpen(true)}>
        Auto-fill
      </Button>
      <Button size="sm" variant="outline" onClick={handlePrint}>
        <Printer className="h-3.5 w-3.5" />
      </Button>
    </>
  ) : null

  return (
    <div className="space-y-4">
      {/* Portal toolbar buttons into the page-level tab bar when available */}
      {ToolbarPortal && toolbarButtons && (
        <ToolbarPortal target={toolbarNode ?? null}>{toolbarButtons}</ToolbarPortal>
      )}
      {/* Fallback: render inline if no portal target provided */}
      {!ToolbarPortal && toolbarButtons && (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {toolbarButtons}
        </div>
      )}

      {!activeSchedule ? (
        <Card depth={3} className="neo:border-0">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No schedule selected</p>
            <p className="text-sm text-muted-foreground mt-1">
              A canonical schedule will appear once it is initialized.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd} autoScroll={false}>
            {/* Main grid: calendar + sidebar, sidebar constrained to calendar height */}
            <div className="grid gap-4 xl:grid-cols-[1fr_280px]" style={{ alignItems: "start" }}>
              <div className="flex flex-col gap-3">
                {/* Desktop table view */}
                <div className="hidden md:block overflow-hidden border rounded-lg bg-card">
                  <Table className="table-fixed">
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="border-b-2 border-border bg-primary/10 hover:bg-primary/10">
                        <TableHead className="w-24 p-2 text-left text-sm font-semibold text-foreground border-r border-border">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Time
                        </TableHead>
                        {DAYS.map((day, i) => (
                          <TableHead
                            key={day}
                            className={cn("p-2 text-center text-sm font-semibold text-foreground", i < DAYS.length - 1 && "border-r border-border")}
                          >
                            {day}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {HOURS.map(({ hour, label }) => (
                        <TableRow key={hour} className="border-b border-border last:border-b-0 hover:bg-transparent">
                          <TableCell className="p-2 text-sm text-foreground font-semibold bg-primary/5 whitespace-nowrap border-r border-border">
                            {label}
                          </TableCell>
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
                                  "p-1 align-top",
                                  dayIndex < DAYS.length - 1 && "border-r border-border",
                                  getTrafficCellClass(weekday, hour),
                                )}
                                onClick={() => handleOpenAssignModal(weekday, hour)}
                              >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  {slotBlocks.map((block) => (
                                    <DraggableMentorChip
                                      key={block.id}
                                      id={`block-${block.id}`}
                                      mentorId={block.mentor.id}
                                      blockId={block.id}
                                      colorToken={getMentorColor(block.mentor.id)}
                                      label={block.mentor.name.split(" ")[0]}
                                      fullName={block.mentor.name}
                                      image={block.mentor.image}
                                      onClick={() => handleOpenDetail(weekday, hour)}
                                      title={`${block.mentor.name} - Click for details`}
                                      fill
                                    />
                                  ))}
                                  {/* Always render the availability line to reserve space; hide text when off */}
                                  <div
                                    className={cn(
                                      "text-[10px] truncate h-4 leading-4",
                                      showAvailability ? "text-muted-foreground" : "invisible"
                                    )}
                                    title={showAvailability && mappedAvailable.length > 0
                                      ? `Available: ${mappedAvailable.map((m) => m.user.name).join(", ")}`
                                      : undefined}
                                  >
                                    {mappedAvailable.length > 0
                                      ? mappedAvailable.map((m) => m.user.name.split(" ")[0]).join(", ")
                                      : availableNames.length > 0
                                        ? `${availableNames.length} avail.`
                                        : "\u00A0"}
                                  </div>
                                </div>
                              </ScheduleSlotCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card view — one card per day, time slots within */}
                <div className="md:hidden space-y-2">
                  {DAYS.map((day, dayIndex) => {
                    const weekday = dayIndex + 1
                    return (
                      <Card key={day} depth={3} className="neo:border-0 overflow-hidden">
                        <CardHeader className="py-2 px-3 bg-primary/5 border-b border-border">
                          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {day}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y divide-border">
                            {HOURS.map(({ hour, label }) => {
                              const slotBlocks = getBlocksForSlot(weekday, hour)
                              const mappedAvailable = getMappedAvailableMentors(weekday, hour)
                              const availableNames = getWhen2MeetAvailability(weekday, hour)
                              return (
                                <div
                                  key={hour}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2",
                                    getTrafficCellClass(weekday, hour),
                                  )}
                                >
                                  <span className="text-xs text-muted-foreground w-24 shrink-0">
                                    {label}
                                  </span>
                                  <div className="flex-1 min-w-0 overflow-hidden space-y-0.5">
                                    <div className="flex flex-wrap gap-1">
                                      {slotBlocks.length > 0 ? slotBlocks.map((block) => (
                                        <button
                                          key={block.id}
                                          type="button"
                                          onClick={() => handleOpenDetail(weekday, hour)}
                                          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border max-w-full"
                                          style={{
                                            backgroundColor: getMentorColor(block.mentor.id).fill,
                                            color: getMentorColor(block.mentor.id).foreground,
                                            borderColor: getMentorColor(block.mentor.id).fill,
                                          }}
                                          title={block.mentor.name}
                                        >
                                          {block.mentor.image ? (
                                            <img
                                              src={block.mentor.image}
                                              alt=""
                                              className="h-4 w-4 rounded-full object-cover shrink-0"
                                            />
                                          ) : null}
                                          <span className="truncate">{block.mentor.name.split(" ")[0]}</span>
                                        </button>
                                      )) : (
                                        <span className="text-xs text-muted-foreground/40">—</span>
                                      )}
                                    </div>
                                    {showAvailability && (mappedAvailable.length > 0 || availableNames.length > 0) && (
                                      <div className="text-[10px] text-muted-foreground truncate">
                                        {mappedAvailable.length > 0
                                          ? mappedAvailable.map((m) => m.user.name.split(" ")[0]).join(", ")
                                          : `${availableNames.length} avail.`}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssignModal(weekday, hour)}
                                    className="text-xs text-muted-foreground hover:text-foreground shrink-0 px-1"
                                    title="Add mentor"
                                  >
                                    +
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Traffic legend + assigned mentors below the calendar */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  {showTraffic && trafficData.length > 0 && (
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="font-medium">Traffic:</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-sm bg-blue-500/10 border border-blue-500/20" /> &lt;6</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-sm bg-blue-500/22 border border-blue-500/32" /> 6–10</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-sm bg-blue-500/35 border border-blue-500/45" /> 10–16</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-sm bg-blue-500/50 border border-blue-500/60" /> 16–20</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-sm bg-blue-500/65 border border-blue-500/75" /> 20+</span>
                    </div>
                  )}
                  {blocks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-medium mr-1">On schedule:</span>
                      {Array.from(new Set(blocks.map((b) => b.mentor.id))).map((mentorId) => {
                        const mentor = blocks.find((b) => b.mentor.id === mentorId)?.mentor
                        if (!mentor) return null
                        return (
                          <span
                            key={mentorId}
                            className="px-1.5 py-0.5 rounded text-[11px] border"
                            style={{
                              backgroundColor: getMentorColor(mentorId).fill,
                              color: getMentorColor(mentorId).foreground,
                              borderColor: getMentorColor(mentorId).fill,
                            }}
                          >
                            {mentor.name}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-3">
                <Card depth={3} className="neo:border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Mentor Pool</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-1.5">
                    {mentors.map((mentor) => (
                      <DraggableMentorChip
                        key={mentor.id}
                        id={`mentor-${mentor.id}`}
                        mentorId={mentor.id}
                        colorToken={getMentorColor(mentor.id)}
                        label={mentor.user.name.split(" ")[0]}
                        fullName={mentor.user.name}
                        image={mentor.user.image}
                        title={`Drag ${mentor.user.name} onto the schedule`}
                      />
                    ))}
                  </CardContent>
                </Card>
                <Card depth={3} className="neo:border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Headcount Forms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
                      <a href="/mentoring/headcount/mentors" target="_blank" rel="noreferrer">
                        <Clock className="h-3.5 w-3.5" />
                        30-min Mentor Headcount
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
                      <a href="/mentoring/headcount/mentees" target="_blank" rel="noreferrer">
                        <Users className="h-3.5 w-3.5" />
                        55-min Mentee Headcount
                      </a>
                    </Button>
                    <div className="pt-1 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => setImportModalOpen(true)}
                      >
                        Import historical CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DndContext>
        </>
      )}

      <Modal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        title="Slot Details"
        description={
          detailSlot
            ? `${DAYS[detailSlot.weekday - 1]} • ${HOURS.find((h) => h.hour === detailSlot.hour)?.label ?? ""}`
            : undefined
        }
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {detailSlot && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected traffic</span>
                {(() => {
                  const traffic = getTrafficForSlot(detailSlot.weekday, detailSlot.hour)
                  if (!traffic) return <span className="text-xs text-muted-foreground">No data yet</span>
                  const level = getTrafficLevel(traffic.averagePeopleInLab)
                  return (
                    <span className="text-xs text-muted-foreground">
                      {level.label} · avg {traffic.averagePeopleInLab.toFixed(1)}
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
                <Card key={block.id} depth={3} className="neo:border-0">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            {block.mentor.image ? (
                              <AvatarImage src={block.mentor.image} alt={block.mentor.name} />
                            ) : null}
                            <AvatarFallback className="text-[10px]">
                              {getInitials(block.mentor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{block.mentor.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{block.mentor.email}</div>
                          </div>
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
                    <div className="flex flex-wrap gap-1">
                      {block.mentor.skills.slice(0, 6).map((skill) => {
                        const color = getCategoricalColorFromSeed(skill.id)
                        return (
                          <Badge
                            key={skill.id}
                            className="text-[10px] border"
                            style={{
                              backgroundColor: color.fill,
                              color: color.foreground,
                              borderColor: color.fill,
                            }}
                          >
                            {skill.name}
                          </Badge>
                        )
                      })}
                      {block.mentor.skills.length === 0 && (
                        <span className="text-xs text-muted-foreground">No skills listed</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {block.mentor.courses.slice(0, 6).map((course) => {
                        const color = getCategoricalColorFromSeed(course.code)
                        return (
                          <Badge
                            key={course.id}
                            className="text-[10px] border"
                            style={{
                              backgroundColor: color.fill,
                              color: color.foreground,
                              borderColor: color.fill,
                            }}
                          >
                            {course.code}
                          </Badge>
                        )
                      })}
                      {block.mentor.courses.length === 0 && (
                        <span className="text-xs text-muted-foreground">No courses listed</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

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

      {/* Headcount Import Modal */}
      <Modal
        open={importModalOpen}
        onOpenChange={(open) => {
          setImportModalOpen(open)
          if (!open) {
            setImportResult(null)
          }
        }}
        title="Import Headcount CSV"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Import type</label>
            <Select
              value={importType}
              onValueChange={(value) => setImportType(value as "mentor" | "mentee")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mentor">30-min Mentor Headcount</SelectItem>
                <SelectItem value="mentee">55-min Mentee Headcount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CSV file</label>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleImportFile(file)
                }
              }}
              className="w-full text-sm"
            />
          </div>

          {importHeaders.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {importType === "mentor" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Timestamp</label>
                    <Select
                      value={importMapping.createdAt || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({ ...prev, createdAt: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">People in lab</label>
                    <Select
                      value={importMapping.peopleInLab || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({ ...prev, peopleInLab: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Feeling</label>
                    <Select
                      value={importMapping.feeling || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({ ...prev, feeling: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Mentors on duty</label>
                    <Select
                      value={importMapping.mentors || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({ ...prev, mentors: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Timestamp</label>
                    <Select
                      value={importMapping.createdAt || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({ ...prev, createdAt: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Students mentored</label>
                    <Select
                      value={importMapping.studentsMentoredCount || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({
                          ...prev,
                          studentsMentoredCount: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Tests checked out</label>
                    <Select
                      value={importMapping.testsCheckedOutCount || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({
                          ...prev,
                          testsCheckedOutCount: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Mentors on duty</label>
                    <Select
                      value={importMapping.mentors || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({ ...prev, mentors: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Classes helped</label>
                    <Select
                      value={importMapping.classes || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({ ...prev, classes: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Other class (optional)</label>
                    <Select
                      value={importMapping.otherClassText || ""}
                      onValueChange={(value) =>
                        setImportMapping((prev) => ({ ...prev, otherClassText: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {importHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {importResult && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <div>Created: {importResult.created}</div>
              <div>Duplicates (already existed): {importResult.duplicates}</div>
              <div>Skipped: {importResult.skipped}</div>
              {importResult.semestersUsed.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Semesters: {importResult.semestersUsed.join(", ")}
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {importResult.errors.join(" • ")}
                </div>
              )}
            </div>
          )}
        </div>
        <ModalFooter className="flex justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              if (!confirm("Delete ALL headcount entries across every semester? This cannot be undone.")) return
              try {
                const res = await fetch("/api/headcount-import", { method: "DELETE" })
                const data = await res.json()
                if (res.ok) {
                  toast.success(`Cleared ${data.deleted.mentorEntries} mentor + ${data.deleted.menteeEntries} mentee entries`)
                  setImportResult(null)
                  fetchTraffic()
                } else {
                  toast.error(data.error || "Failed to clear data")
                }
              } catch {
                toast.error("Failed to clear headcount data")
              }
            }}
          >
            Clear All Headcount Data
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setImportModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleRunImport} disabled={isImporting || importRows.length === 0}>
              {isImporting ? "Importing..." : "Run Import"}
            </Button>
          </div>
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
  onClick,
}: {
  id: string
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <td
      ref={setNodeRef}
      className={cn(className, isOver && "bg-accent/20", onClick && "cursor-pointer hover:bg-muted/40 transition-colors")}
      onClick={onClick}
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
  fullName,
  image,
  colorToken,
  onClick,
  title,
  fill,
}: {
  id: string
  mentorId: number
  blockId?: number
  label: string
  fullName: string
  image?: string | null
  colorToken: { fill: string; foreground: string }
  onClick?: () => void
  title?: string
  fill?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { mentorId, blockId },
  })

  const wasDragging = useRef(false)

  useEffect(() => {
    if (isDragging) {
      wasDragging.current = true
    }
  }, [isDragging])

  const style = {
    ...(transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : {}),
    backgroundColor: colorToken.fill,
    color: colorToken.foreground,
    borderColor: colorToken.fill,
  } as CSSProperties

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (wasDragging.current) {
      wasDragging.current = false
      return
    }
    onClick?.()
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-xs font-medium rounded transition-opacity border",
        fill ? "w-full px-1 py-1" : "px-2 py-1",
        "touch-none",
        isDragging && "opacity-60"
      )}
      onClick={handleClick}
      title={title}
      {...attributes}
      {...listeners}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        <Avatar className="h-4 w-4 shrink-0">
          {image ? <AvatarImage src={image} alt={fullName} /> : null}
          <AvatarFallback className="text-[8px] bg-black/10 text-inherit">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-left">{label}</span>
      </span>
    </button>
  )
}
