"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Plus, X, User, Clock, Calendar, Users, Check, Printer, ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
}

// Availability data from built-in system
interface AvailabilityData {
  userId: number
  user: { id: number; name: string; email: string; image: string }
  slots: AvailabilitySlot[]
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
  const [schedules, setSchedules] = useState<MentorSchedule[]>([])
  const [activeSchedule, setActiveSchedule] = useState<MentorSchedule | null>(null)
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

  const [newScheduleModalOpen, setNewScheduleModalOpen] = useState(false)
  const [newScheduleName, setNewScheduleName] = useState("")
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false)

  // Availability overlay state
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([])
  const [showAvailability, setShowAvailability] = useState(false)
  const [scheduleDropdownOpen, setScheduleDropdownOpen] = useState(false)

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/mentorSchedule")
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
        const active = data.find((s: MentorSchedule) => s.isActive)
        if (active) {
          setActiveSchedule(active)
        }
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error)
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
        // Filter to only active mentors
        setMentors(data.filter((m: Mentor) => m.isActive))
      }
    } catch (error) {
      console.error("Failed to fetch mentors:", error)
    }
  }, [])

  // Fetch availability data for active semester
  const fetchAvailability = useCallback(async () => {
    try {
      // Get active semester
      const semesterRes = await fetch("/api/mentor-semester?activeOnly=true")
      if (!semesterRes.ok) return
      
      const semesters = await semesterRes.json()
      if (semesters.length === 0) return
      
      const activeSemesterId = semesters[0].id
      
      // Get availability for this semester
      const availRes = await fetch(`/api/mentor-availability?semesterId=${activeSemesterId}`)
      if (availRes.ok) {
        const data = await availRes.json()
        setAvailabilityData(data)
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchSchedules(), fetchMentors(), fetchAvailability()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchSchedules, fetchMentors, fetchAvailability])

  // Load blocks when active schedule changes
  useEffect(() => {
    if (activeSchedule) {
      fetchBlocks()
    }
  }, [activeSchedule, fetchBlocks])

  // Get blocks for a specific time slot
  const getBlocksForSlot = (weekday: number, hour: number): ScheduleBlock[] => {
    return blocks.filter((b) => b.weekday === weekday && b.startHour === hour)
  }

  // Handle opening assign modal
  const handleOpenAssignModal = (weekday: number, hour: number) => {
    setAssignSlot({ weekday, hour })
    setSelectedMentorId("")
    setAssignModalOpen(true)
  }

  // Handle assign mentor
  const handleAssignMentor = async () => {
    if (!assignSlot || !selectedMentorId || !activeSchedule) return

    setIsAssigning(true)
    try {
      const response = await fetch("/api/scheduleBlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: parseInt(selectedMentorId),
          weekday: assignSlot.weekday,
          startHour: assignSlot.hour,
          scheduleId: activeSchedule.id,
        }),
      })

      if (response.ok) {
        toast.success("Mentor assigned to time slot")
        fetchBlocks()
        setAssignModalOpen(false)
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to assign mentor")
      }
    } catch (error) {
      console.error("Failed to assign mentor:", error)
      toast.error("An error occurred")
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

  // Handle create new schedule
  const handleCreateSchedule = async () => {
    if (!newScheduleName.trim()) {
      toast.error("Please enter a schedule name")
      return
    }

    setIsCreatingSchedule(true)
    try {
      const response = await fetch("/api/mentorSchedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newScheduleName.trim(),
          setActive: schedules.length === 0, // Make active if first schedule
        }),
      })

      if (response.ok) {
        toast.success("Schedule created")
        await fetchSchedules()
        setNewScheduleModalOpen(false)
        setNewScheduleName("")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to create schedule")
      }
    } catch (error) {
      console.error("Failed to create schedule:", error)
      toast.error("An error occurred")
    } finally {
      setIsCreatingSchedule(false)
    }
  }

  // Handle set active schedule
  const handleSetActiveSchedule = async (scheduleId: number) => {
    try {
      const response = await fetch("/api/mentorSchedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduleId, isActive: true }),
      })

      if (response.ok) {
        toast.success("Active schedule updated")
        await fetchSchedules()
      } else {
        toast.error("Failed to update active schedule")
      }
    } catch (error) {
      console.error("Failed to set active schedule:", error)
      toast.error("An error occurred")
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
    
    const dayName = DAYS[weekday - 1]
    const slot = when2meetData.slots.find(
      (s) => s.day === dayName && s.hour === hour
    )
    return slot?.availableNames || []
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
      {/* Schedule selector and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Mentor Schedule</h2>
          {schedules.length > 0 && (
            <Popover open={scheduleDropdownOpen} onOpenChange={setScheduleDropdownOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between">
                  <span className="truncate">
                    {activeSchedule?.name || "Select schedule"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <div className="grid grid-cols-2 gap-0">
                  {schedules.map((schedule, index) => (
                    <button
                      key={schedule.id}
                      onClick={() => {
                        setActiveSchedule(schedule)
                        if (!schedule.isActive) {
                          handleSetActiveSchedule(schedule.id)
                        }
                        setScheduleDropdownOpen(false)
                      }}
                      className={`p-3 text-left hover:bg-muted transition-colors ${
                        index % 2 === 0 ? "border-r" : ""
                      } ${index < schedules.length - 2 ? "border-b" : ""} ${
                        activeSchedule?.id === schedule.id ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="font-medium text-sm flex items-center gap-2">
                        {schedule.name}
                        {schedule.isActive && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {schedule.isActive ? "Current schedule" : "Archived"}
                      </p>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeSchedule && (
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          )}
          <Button size="sm" onClick={() => setNewScheduleModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Schedule
          </Button>
        </div>
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
            <Label htmlFor="show-availability" className="text-sm">
              Show on grid
            </Label>
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
            Create a new schedule to start assigning mentors
          </p>
          <Button className="mt-4" onClick={() => setNewScheduleModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Schedule
          </Button>
        </div>
      ) : (
        <>
          {/* Schedule grid */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-24 p-2 text-left text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Time
                  </th>
                  {DAYS.map((day, i) => (
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
                        <td
                          key={dayIndex}
                          className={`p-1 h-16 align-top ${
                            showAvailability && availableNames.length > 0
                              ? "bg-green-500/10"
                              : ""
                          }`}
                        >
                          <div className="flex flex-col gap-1 min-h-[3.5rem]">
                            {/* Assigned mentors */}
                            <div className="flex flex-wrap gap-1">
                              {slotBlocks.map((block) => (
                                <button
                                  key={block.id}
                                  onClick={() => {
                                    setRemoveBlock(block)
                                    setRemoveModalOpen(true)
                                  }}
                                  className={`${getMentorColor(block.mentor.id)} text-white text-xs px-2 py-1 rounded-md hover:opacity-80 transition-opacity truncate max-w-[100px]`}
                                  title={`${block.mentor.name} - Click to remove`}
                                >
                                  {block.mentor.name.split(" ")[0]}
                                </button>
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
                            {/* When2Meet availability indicator */}
                            {showAvailability && availableNames.length > 0 && (
                              <div
                                className="text-[10px] text-green-700 dark:text-green-400 truncate"
                                title={`Available: ${availableNames.join(", ")}`}
                              >
                                {mappedAvailable.length > 0 ? (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {mappedAvailable.map((m) => m.user.name.split(" ")[0]).join(", ")}
                                  </span>
                                ) : (
                                  <span className="opacity-60">
                                    {availableNames.length} available
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
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

      {/* New Schedule Modal */}
      <Modal
        open={newScheduleModalOpen}
        onOpenChange={setNewScheduleModalOpen}
        title="Create New Schedule"
        description="Create a new mentor schedule (e.g., Fall 2026, Spring 2027)"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Schedule name (e.g., Fall 2026)"
            value={newScheduleName}
            onChange={(e) => setNewScheduleName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setNewScheduleModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateSchedule} disabled={!newScheduleName.trim() || isCreatingSchedule}>
            {isCreatingSchedule ? "Creating..." : "Create Schedule"}
          </Button>
        </ModalFooter>
      </Modal>

    </div>
  )
}
