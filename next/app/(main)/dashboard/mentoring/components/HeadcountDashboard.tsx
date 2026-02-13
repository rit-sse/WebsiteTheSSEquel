"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  if (avg < 6) return "bg-blue-500/10 text-foreground"
  if (avg < 10) return "bg-blue-500/25 text-foreground"
  if (avg < 20) return "bg-blue-500/40 text-foreground"
  return "bg-blue-500/60 text-white"
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
        <Card depth={2} className="neo:border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Avg. in Lab</div>
              <div className="text-xl font-semibold tabular-nums">{averagePeople.toFixed(1)}</div>
            </div>
          </CardContent>
        </Card>
        <Card depth={2} className="neo:border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Peak Traffic</div>
              <div className="text-xl font-semibold tabular-nums">{peakTraffic.toFixed(1)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content: heatmap + busiest slots | check-ins */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]" style={{ alignItems: "start" }}>
        <div className="space-y-4">
          {/* Heatmap */}
          <Card depth={2} className="neo:border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Traffic Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
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
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500/10 border border-blue-500/20" /> &lt;6 Quiet</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500/25 border border-blue-500/35" /> 6-10 Steady</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500/40 border border-blue-500/50" /> 10-20 Packed</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500/60 border border-blue-500/70" /> 20+ Peak</span>
              </div>
            </CardContent>
          </Card>

          {/* Busiest Slots */}
          <Card depth={2} className="neo:border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Busiest Time Slots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
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
            </CardContent>
          </Card>
        </div>

        {/* Recent Check-ins sidebar */}
        <Card depth={2} className="lg:sticky lg:top-4 neo:border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
              {recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No entries yet.</p>
              ) : (
                recentEntries.map((entry) => (
                  <Card
                    key={entry.id}
                    depth={3}
                    className="neo:border-0 transition-colors hover:bg-muted/30"
                  >
                    <CardContent className="p-2.5 space-y-1">
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
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
