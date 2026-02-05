"use client"

import { useEffect, useMemo, useState } from "react"
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from "@/components/ui/neo-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users } from "lucide-react"

interface TrafficDatum {
  weekday: number
  hour: number
  averagePeopleInLab: number
  sampleCount: number
}

interface HeadcountEntry {
  id: number
  peopleInLab: number
  feeling: string
  createdAt: string
  mentors: {
    mentor: {
      user: {
        name: string
      }
    }
  }[]
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const HOURS = [10, 11, 12, 13, 14, 15, 16, 17]

function formatHour(h: number) {
  if (h === 12) return "12p"
  return h > 12 ? `${h - 12}p` : `${h}a`
}

function heatColor(avg: number) {
  if (avg < 10) return "bg-gray-400/15 text-muted-foreground"
  if (avg < 12) return "bg-blue-500/20 text-blue-700 dark:text-blue-400"
  if (avg < 16) return "bg-yellow-400/25 text-yellow-700 dark:text-yellow-300"
  return "bg-red-500/30 text-red-700 dark:text-red-400"
}

export default function HeadcountDashboard() {
  const [trafficData, setTrafficData] = useState<TrafficDatum[]>([])
  const [recentEntries, setRecentEntries] = useState<HeadcountEntry[]>([])

  useEffect(() => {
    const load = async () => {
      const trafficRes = await fetch("/api/mentoring-headcount?traffic=true")
      if (trafficRes.ok) {
        setTrafficData(await trafficRes.json())
      }
      const recentRes = await fetch("/api/mentoring-headcount?limit=12")
      if (recentRes.ok) {
        setRecentEntries(await recentRes.json())
      }
    }
    load()
  }, [])

  const averagePeople = useMemo(() => {
    if (!trafficData.length) return 0
    const total = trafficData.reduce((sum, entry) => sum + entry.averagePeopleInLab, 0)
    return total / trafficData.length
  }, [trafficData])

  const peakTraffic = useMemo(() => {
    if (!trafficData.length) return 0
    return Math.max(...trafficData.map((d) => d.averagePeopleInLab))
  }, [trafficData])

  const busiestSlots = useMemo(() => {
    return [...trafficData]
      .sort((a, b) => b.averagePeopleInLab - a.averagePeopleInLab)
      .slice(0, 5)
  }, [trafficData])

  // Build heatmap lookup
  const heatmapLookup = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of trafficData) {
      map.set(`${d.weekday}-${d.hour}`, d.averagePeopleInLab)
    }
    return map
  }, [trafficData])

  const maxAvg = useMemo(() => {
    if (!trafficData.length) return 0
    return Math.max(...trafficData.map((d) => d.averagePeopleInLab))
  }, [trafficData])

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid gap-3 grid-cols-2">
        <NeoCard>
          <NeoCardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Avg. in Lab</div>
              <div className="text-xl font-semibold tabular-nums">{averagePeople.toFixed(1)}</div>
            </div>
          </NeoCardContent>
        </NeoCard>
        <NeoCard>
          <NeoCardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Peak Traffic</div>
              <div className="text-xl font-semibold tabular-nums">{peakTraffic.toFixed(1)}</div>
            </div>
          </NeoCardContent>
        </NeoCard>
      </div>

      {/* Main content: heatmap + busiest slots | check-ins */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]" style={{ alignItems: "start" }}>
        <div className="space-y-4">
          {/* Heatmap */}
          <NeoCard>
            <NeoCardHeader className="pb-3">
              <NeoCardTitle className="text-lg">Traffic Heatmap</NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-left text-muted-foreground font-medium w-12" />
                      {DAYS.map((day) => (
                        <th key={day} className="p-1.5 text-center text-muted-foreground font-medium">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map((hour) => (
                      <tr key={hour}>
                        <td className="p-1.5 text-muted-foreground font-medium whitespace-nowrap">
                          {formatHour(hour)}
                        </td>
                        {DAYS.map((_, dayIdx) => {
                          const weekday = dayIdx + 1
                          const avg = heatmapLookup.get(`${weekday}-${hour}`)
                          return (
                            <td key={dayIdx} className="p-1">
                              <div
                                className={`rounded-md p-2 text-center font-medium tabular-nums transition-colors ${
                                  avg !== undefined ? heatColor(avg) : "bg-muted/20 text-muted-foreground/40"
                                }`}
                                title={avg !== undefined ? `${avg.toFixed(1)} avg people` : "No data"}
                              >
                                {avg !== undefined ? avg.toFixed(0) : "—"}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground justify-end">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-gray-400/15 border border-gray-400/30" /> &lt;10 Quiet</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500/20 border border-blue-500/30" /> 10-12 Steady</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-yellow-400/25 border border-yellow-400/40" /> 12-16 Packed</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500/30 border border-red-500/40" /> 16+ Peak</span>
              </div>
            </NeoCardContent>
          </NeoCard>

          {/* Busiest Slots */}
          <NeoCard>
            <NeoCardHeader className="pb-3">
              <NeoCardTitle className="text-lg">Busiest Time Slots</NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent className="space-y-2.5">
              {busiestSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No traffic data yet.</p>
              ) : (
                busiestSlots.map((slot, i) => {
                  const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][slot.weekday - 1]
                  const label = `${dayName} ${formatHour(slot.hour)}`
                  const intensity = Math.min(100, (slot.averagePeopleInLab / (maxAvg || 1)) * 100)
                  return (
                    <div key={`${slot.weekday}-${slot.hour}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground tabular-nums w-4 text-right text-xs">{i + 1}.</span>
                          {label}
                        </span>
                        <Badge variant="outline" className="text-xs tabular-nums">
                          {slot.averagePeopleInLab.toFixed(1)} avg
                        </Badge>
                      </div>
                      <Progress value={intensity} className="h-1.5" />
                    </div>
                  )
                })
              )}
            </NeoCardContent>
          </NeoCard>
        </div>

        {/* Recent Check-ins sidebar */}
        <NeoCard className="lg:sticky lg:top-4">
          <NeoCardHeader className="pb-3">
            <NeoCardTitle className="text-lg">Recent Check-ins</NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
              {recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No entries yet.</p>
              ) : (
                recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-border/50 p-2.5 space-y-1 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <Badge variant="outline" className="text-[10px] tabular-nums h-5">
                        {entry.peopleInLab} in lab
                      </Badge>
                    </div>
                    <div className="text-sm font-medium leading-snug">{entry.feeling}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {entry.mentors.map((m) => m.mentor.user.name.split(" ")[0]).join(", ")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </NeoCardContent>
        </NeoCard>
      </div>
    </div>
  )
}
