"use client"

import { useCallback, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

interface MentorSkill {
  id: number
  name: string
}

interface ScheduleBlock {
  id: number
  weekday: number
  startHour: number
  mentor: {
    id: number
    name: string
    skills: MentorSkill[]
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

export default function PublicMentorSchedulePage() {
  const [schedule, setSchedule] = useState<MentorSchedule | null>(null)
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [slotModalOpen, setSlotModalOpen] = useState(false)
  const [slotTitle, setSlotTitle] = useState("")
  const [slotMentors, setSlotMentors] = useState<ScheduleBlock[]>([])

  const fetchSchedule = useCallback(async () => {
    try {
      const scheduleRes = await fetch("/api/mentorSchedule?activeOnly=true")
      if (!scheduleRes.ok) return
      const schedules = (await scheduleRes.json()) as MentorSchedule[]
      const active = schedules[0] ?? null
      setSchedule(active)

      if (!active) return
      const blocksRes = await fetch(`/api/scheduleBlock?scheduleId=${active.id}`)
      if (!blocksRes.ok) return
      const data = await blocksRes.json()
      setBlocks(data.blocks || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const getBlocksForSlot = (weekday: number, hour: number) =>
    blocks.filter((block) => block.weekday === weekday && block.startHour === hour)

  const openSlotDetails = (weekday: number, hour: number, label: string) => {
    const slotBlocks = getBlocksForSlot(weekday, hour)
    if (slotBlocks.length === 0) return
    setSlotMentors(slotBlocks)
    setSlotTitle(`${DAYS[weekday - 1]} · ${label}`)
    setSlotModalOpen(true)
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">Loading mentor schedule...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Mentor Schedule</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {schedule ? schedule.name : "No active schedule"}
        </p>
      </div>

      {!schedule ? (
        <Card depth={1} className="p-4">
          <p className="text-sm text-muted-foreground">No active mentor schedule is available yet.</p>
        </Card>
      ) : (
        <Card depth={1} className="p-3 sm:p-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-28 p-2 text-left text-xs sm:text-sm font-medium text-muted-foreground border-r border-border">
                    Time
                  </th>
                  {DAYS.map((day, index) => (
                    <th
                      key={day}
                      className={`p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground ${
                        index < DAYS.length - 1 ? "border-r border-border" : ""
                      }`}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(({ hour, label }) => (
                  <tr key={hour} className="border-b border-border last:border-b-0">
                    <td className="p-2 text-xs sm:text-sm text-muted-foreground border-r border-border">
                      {label}
                    </td>
                    {DAYS.map((_, dayIndex) => {
                      const weekday = dayIndex + 1
                      const slotBlocks = getBlocksForSlot(weekday, hour)
                      const clickable = slotBlocks.length > 0
                      return (
                        <td
                          key={`${weekday}-${hour}`}
                          className={`p-1.5 align-top ${
                            dayIndex < DAYS.length - 1 ? "border-r border-border" : ""
                          } ${clickable ? "cursor-pointer hover:bg-muted/40" : ""}`}
                          onClick={() => openSlotDetails(weekday, hour, label)}
                        >
                          <div className="flex flex-col gap-1">
                            {slotBlocks.map((block) => (
                              <Badge key={block.id} variant="secondary" className="justify-center text-xs">
                                {block.mentor.name.split(" ")[0]}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={slotModalOpen}
        onOpenChange={setSlotModalOpen}
        title="Mentor Skills"
        description={slotTitle}
        className="max-w-lg"
      >
        <div className="space-y-3">
          {slotMentors.map((block) => (
            <div key={block.id} className="rounded-md border p-3">
              <p className="text-sm font-medium mb-2">{block.mentor.name}</p>
              <div className="flex flex-wrap gap-1">
                {block.mentor.skills.length > 0 ? (
                  block.mentor.skills.map((skill) => (
                    <Badge key={`${block.id}-${skill.id}`} variant="outline" className="text-xs">
                      {skill.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No listed skills</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setSlotModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
