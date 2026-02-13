"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { getCategoricalColorFromSeed } from "@/lib/categoricalColors"

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
    image?: string | null
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

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "?"

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
        <Card depth={2} className="p-4">
          <p className="text-sm text-muted-foreground">No active mentor schedule is available yet.</p>
        </Card>
      ) : (
        <Card depth={2} className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <h2 className="text-base font-semibold">Weekly Mentor Coverage</h2>
            <p className="text-xs text-muted-foreground">Click any filled time slot to view mentor skills.</p>
          </div>
          <div className="p-3 sm:p-4">
            <div className="overflow-x-auto rounded-lg border border-border/70 bg-card">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
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
                      <td className="p-2 text-xs sm:text-sm text-muted-foreground border-r border-border bg-muted/20">
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
                            } ${clickable ? "cursor-pointer hover:bg-muted/40 transition-colors" : ""}`}
                            onClick={() => openSlotDetails(weekday, hour, label)}
                          >
                            <div className="flex flex-col gap-1">
                              {slotBlocks.map((block) => (
                                <div
                                  key={block.id}
                                  className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs border"
                                  style={{
                                    backgroundColor: getCategoricalColorFromSeed(block.mentor.id).fill,
                                    color: getCategoricalColorFromSeed(block.mentor.id).foreground,
                                    borderColor: getCategoricalColorFromSeed(block.mentor.id).fill,
                                  }}
                                >
                                  <Avatar className="h-4 w-4">
                                    {block.mentor.image ? (
                                      <AvatarImage src={block.mentor.image} alt={block.mentor.name} />
                                    ) : null}
                                    <AvatarFallback className="text-[8px] bg-black/10 text-inherit">
                                      {getInitials(block.mentor.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {block.mentor.name.split(" ")[0]}
                                </div>
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
          </div>
        </Card>
      )}

      <Modal
        open={slotModalOpen}
        onOpenChange={setSlotModalOpen}
        title="Slot Details"
        description={slotTitle}
        className="max-w-2xl"
      >
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Assigned mentors</h3>
          {slotMentors.map((block) => (
            <Card key={block.id} depth={3} className="neo:border-0">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    {block.mentor.image ? (
                      <AvatarImage src={block.mentor.image} alt={block.mentor.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(block.mentor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{block.mentor.name}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {block.mentor.skills.length > 0 ? (
                    block.mentor.skills.map((skill) => {
                      const color = getCategoricalColorFromSeed(skill.id)
                      return (
                        <Badge
                          key={`${block.id}-${skill.id}`}
                          className="text-xs border"
                          style={{
                            backgroundColor: color.fill,
                            color: color.foreground,
                            borderColor: color.fill,
                          }}
                        >
                          {skill.name}
                        </Badge>
                      )
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground">No listed skills</span>
                  )}
                </div>
              </CardContent>
            </Card>
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
