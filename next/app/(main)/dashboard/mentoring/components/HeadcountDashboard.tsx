"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  BookOpen,
  FlaskConical,
  Activity,
  Clock,
  Copy,
  Check,
  Expand,
} from "lucide-react"
import { toast } from "sonner"
import type { SemesterTrend } from "@/app/api/headcount-trends/route"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrafficDatum {
  weekday: number
  hour: number
  averagePeopleInLab: number
  sampleCount: number
}

interface MentorEntry {
  id: number
  peopleInLab: number
  feeling: string
  createdAt: string
  mentors: { mentor: { user: { name: string } } }[]
}

interface MenteeEntry {
  id: number
  studentsMentoredCount: number
  testsCheckedOutCount: number
  createdAt: string
  otherClassText: string | null
  classes: { course: { id: number; title: string; code: number; department: { shortTitle: string } } }[]
}

interface MentorSemester {
  id: number
  name: string
  isActive: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const HOURS = [10, 11, 12, 13, 14, 15, 16, 17]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHour(h: number) {
  if (h === 12) return "12p"
  return h > 12 ? `${h - 12}p` : `${h}a`
}

function heatColor(avg: number) {
  if (avg <= 6) return "bg-blue-200 text-foreground"
  if (avg <= 10) return "bg-blue-300 text-foreground"
  if (avg <= 15) return "bg-blue-400 text-foreground"
  if (avg <= 20) return "bg-blue-500 text-white"
  return "bg-blue-600 text-white"
}

function shortLabel(name: string): string {
  const m = name.match(/^(Spring|Fall|Summer|Winter)\s+(\d{4})$/i)
  if (!m) return name.slice(0, 7)
  const abbr: Record<string, string> = { spring: "Sp", fall: "Fa", summer: "Su", winter: "Wi" }
  return `${abbr[m[1].toLowerCase()] ?? m[1].slice(0, 2)} '${m[2].slice(2)}`
}

function pct(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface DeltaProps { value: number | null; suffix?: string }
function Delta({ value, suffix = "%" }: DeltaProps) {
  if (value === null) return null
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" /> flat
    </span>
  )
  const up = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{value}{suffix}
    </span>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  delta?: number | null
  accent: string
  sub?: string
}
function StatCard({ icon, label, value, delta, accent, sub }: StatCardProps) {
  return (
    <Card depth={2} className="neo:border-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className={`h-8 w-8 rounded-lg ${accent} flex items-center justify-center shrink-0 mt-0.5`}>
            {icon}
          </div>
          {delta !== undefined && <Delta value={delta ?? null} />}
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
          <div className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">{label}</div>
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

// Custom recharts tooltip
const ChartTooltip = ({
  active, payload, label, labelMap,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  labelMap?: Record<string, string>
}) => {
  if (!active || !payload?.length) return null
  const fullLabel = labelMap?.[label ?? ""] ?? label
  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1.5 text-foreground">{fullLabel}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
          <span>{item.name}:</span>
          <span className="font-medium text-foreground tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function CheckInCard({ entry, copiedId, onCopy }: { entry: MentorEntry; copiedId: number | null; onCopy: (e: MentorEntry) => void }) {
  return (
    <Card depth={3} className="neo:border-0 hover:bg-muted/30 group">
      <CardContent className="p-2.5 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {new Date(entry.createdAt).toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] tabular-nums h-5 px-1.5">
              {entry.peopleInLab} in lab
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onCopy(entry) }}
            >
              {copiedId === entry.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        <div className="text-xs font-medium leading-snug text-foreground">{entry.feeling}</div>
        <div className="text-[11px] text-muted-foreground">
          {entry.mentors.map((m) => m.mentor.user.name.split(" ")[0]).join(", ")}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HeadcountDashboard() {
  // Semesters & selection
  const [semesters, setSemesters] = useState<MentorSemester[]>([])
  const [selectedId, setSelectedId] = useState<string>("all")

  // All-time trends (used by All Time + Past Semesters tabs)
  const [trends, setTrends] = useState<SemesterTrend[]>([])

  // This-semester data
  const [trafficData, setTrafficData] = useState<TrafficDatum[]>([])
  const [mentorEntries, setMentorEntries] = useState<MentorEntry[]>([])
  const [menteeEntries, setMenteeEntries] = useState<MenteeEntry[]>([])

  // Check-ins modal
  const [checkInsOpen, setCheckInsOpen] = useState(false)
  const [allMentorEntries, setAllMentorEntries] = useState<MentorEntry[]>([])
  const [loadingAll, setLoadingAll] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Sort state for comparison table
  const [sortKey, setSortKey] = useState<keyof SemesterTrend>("chronologicalIndex")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // ── Fetch semesters once ────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/mentor-semester")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: MentorSemester[]) => {
        setSemesters(data)
        const active = data.find((s) => s.isActive)
        if (active) setSelectedId(String(active.id))
      })
      .catch(() => {})
  }, [])

  // ── Fetch all-time trends once ──────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/headcount-trends")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTrends)
      .catch(() => {})
  }, [])

  // ── Fetch semester-specific data when selection changes ─────────────────────
  useEffect(() => {
    const param = selectedId !== "all" ? `&semesterId=${selectedId}` : ""
    Promise.all([
      fetch(`/api/mentoring-headcount?traffic=true${param}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/mentoring-headcount?limit=20${param}`).then((r) => (r.ok ? r.json() : [])),
      selectedId !== "all"
        ? fetch(`/api/mentee-headcount?semesterId=${selectedId}`).then((r) => (r.ok ? r.json() : []))
        : fetch("/api/mentee-headcount").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([traffic, entries, mentee]) => {
        setTrafficData(traffic)
        setMentorEntries(entries)
        setMenteeEntries(mentee)
      })
      .catch(() => {})
  }, [selectedId])

  const openAllCheckIns = useCallback(() => {
    setCheckInsOpen(true)
    setLoadingAll(true)
    const param = selectedId !== "all" ? `&semesterId=${selectedId}` : ""
    fetch(`/api/mentoring-headcount?limit=500${param}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAllMentorEntries)
      .catch(() => {})
      .finally(() => setLoadingAll(false))
  }, [selectedId])

  const copyCheckIn = useCallback((entry: MentorEntry) => {
    const date = new Date(entry.createdAt).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    })
    const mentors = entry.mentors.map((m) => m.mentor.user.name).join(", ")
    const text = `${date} — ${entry.peopleInLab} in lab — "${entry.feeling}" — Mentors: ${mentors}`
    navigator.clipboard.writeText(text)
    setCopiedId(entry.id)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  // ── Derived: heatmap lookup ─────────────────────────────────────────────────
  const heatmapLookup = useMemo(() => {
    const m = new Map<string, number>()
    trafficData.forEach((d) => m.set(`${d.weekday}-${d.hour}`, d.averagePeopleInLab))
    return m
  }, [trafficData])

  const maxHeat = useMemo(
    () => (trafficData.length ? Math.max(...trafficData.map((d) => d.averagePeopleInLab)) : 0),
    [trafficData]
  )

  const avgPeopleInLab = useMemo(() => {
    if (!trafficData.length) return 0
    const slots = trafficData.filter((d) => d.sampleCount > 0)
    if (!slots.length) return 0
    return slots.reduce((s, d) => s + d.averagePeopleInLab, 0) / slots.length
  }, [trafficData])

  // ── Derived: day-of-week averages ───────────────────────────────────────────
  const dayAverages = useMemo(() => {
    const totals = [0, 0, 0, 0, 0]
    const counts = [0, 0, 0, 0, 0]
    trafficData.forEach((d) => {
      if (d.weekday >= 1 && d.weekday <= 5) {
        totals[d.weekday - 1] += d.averagePeopleInLab
        counts[d.weekday - 1] += 1
      }
    })
    return DAY_LABELS.map((day, i) => ({
      day,
      avg: counts[i] > 0 ? Math.round((totals[i] / counts[i]) * 10) / 10 : 0,
    }))
  }, [trafficData])

  // ── Derived: course demand ──────────────────────────────────────────────────
  const courseDemand = useMemo(() => {
    const counts = new Map<string, number>()
    menteeEntries.forEach((e) => {
      e.classes.forEach((c) => {
        if (!c.course?.department?.shortTitle) return
        const key = `${c.course.department.shortTitle} ${c.course.code}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      })
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([course, count]) => ({ course, count }))
  }, [menteeEntries])

  const maxCourseCount = useMemo(
    () => (courseDemand.length ? courseDemand[0].count : 1),
    [courseDemand]
  )

  // ── Derived: this-semester mentee stats ────────────────────────────────────
  const menteeStats = useMemo(() => {
    const submissions = menteeEntries.length
    const totalStudents = menteeEntries.reduce((s, e) => s + e.studentsMentoredCount, 0)
    const totalTests = menteeEntries.reduce((s, e) => s + e.testsCheckedOutCount, 0)
    const avgStudents = submissions ? Math.round((totalStudents / submissions) * 10) / 10 : 0
    return { submissions, totalStudents, totalTests, avgStudents }
  }, [menteeEntries])

  // ── Derived: busiest slots ─────────────────────────────────────────────────
  const busiestSlots = useMemo(
    () => [...trafficData].sort((a, b) => b.averagePeopleInLab - a.averagePeopleInLab).slice(0, 5),
    [trafficData]
  )

  // ── Derived: all-time trend delta (current vs previous semester) ────────────
  const currentTrend = useMemo(() => {
    if (selectedId === "all" || !trends.length) return null
    const idx = trends.findIndex((t) => String(t.semesterId) === selectedId)
    if (idx < 0) return null
    const curr = trends[idx]
    const prev = idx > 0 ? trends[idx - 1] : null
    return { curr, prev }
  }, [trends, selectedId])

  // ── Derived: chart data for all-time tabs ──────────────────────────────────
  const chartData = useMemo(
    () =>
      trends
        .filter((t) => t.mentorSubmissions > 0 || t.menteeSubmissions > 0)
        .map((t) => ({ ...t, short: shortLabel(t.semesterName) })),
    [trends]
  )

  const shortLabelMap = useMemo(() => {
    const m: Record<string, string> = {}
    chartData.forEach((d) => { m[d.short] = d.semesterName })
    return m
  }, [chartData])

  const hasTrendData = chartData.length >= 2

  // ── Derived: comparison table ──────────────────────────────────────────────
  const sortedTrends = useMemo(() => {
    return [...trends].sort((a, b) => {
      const av = a[sortKey] ?? 0
      const bv = b[sortKey] ?? 0
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [trends, sortKey, sortDir])

  function toggleSort(key: keyof SemesterTrend) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sortIndicator = (key: keyof SemesterTrend) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""

  // ── Lifetime totals ────────────────────────────────────────────────────────
  const lifetimeTotals = useMemo(() => ({
    submissions30: trends.reduce((s, t) => s + t.mentorSubmissions, 0),
    submissions55: trends.reduce((s, t) => s + t.menteeSubmissions, 0),
    students: trends.reduce((s, t) => s + t.totalStudentsMentored, 0),
    tests: trends.reduce((s, t) => s + t.totalTestsCheckedOut, 0),
  }), [trends])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-0">
      <Tabs defaultValue="semester">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="all-time" className="text-xs sm:text-sm">
              All Time
            </TabsTrigger>
            <TabsTrigger value="semester" className="text-xs sm:text-sm">
              This Semester
            </TabsTrigger>
            <TabsTrigger value="compare" className="text-xs sm:text-sm">
              Compare
            </TabsTrigger>
          </TabsList>

          {/* Semester picker — shown on "This Semester" tab context */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-muted-foreground hidden sm:inline">Semester:</span>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All time</SelectItem>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                    {s.name}{s.isActive ? " (active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1 — ALL TIME
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="all-time" className="space-y-5">
          {/* Lifetime stat cards */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Lifetime Totals · {chartData.length} Semesters of Data
            </h3>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <StatCard
                icon={<Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                label="30-min check-ins"
                value={lifetimeTotals.submissions30.toLocaleString()}
                accent="bg-amber-500/10"
              />
              <StatCard
                icon={<Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                label="55-min check-ins"
                value={lifetimeTotals.submissions55.toLocaleString()}
                accent="bg-blue-500/10"
              />
              <StatCard
                icon={<BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                label="Students mentored"
                value={lifetimeTotals.students.toLocaleString()}
                accent="bg-emerald-500/10"
              />
              <StatCard
                icon={<FlaskConical className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                label="Tests checked out"
                value={lifetimeTotals.tests.toLocaleString()}
                accent="bg-violet-500/10"
              />
            </div>
          </div>

          {!hasTrendData ? (
            <Card depth={2} className="neo:border-0">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Import data from at least 2 semesters to see historical trend charts.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Chart 1 — avg people in lab */}
              <Card depth={2} className="neo:border-0">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Avg. People in Lab · per Semester
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 4, right: 20, left: -8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="short" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip labelMap={shortLabelMap} />} />
                      <Line
                        type="monotone"
                        dataKey="avgPeopleInLab"
                        name="Avg people in lab"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#3b82f6" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 2 — students + tests per semester */}
              <Card depth={2} className="neo:border-0">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Students Mentored &amp; Tests Checked Out · per Semester
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} margin={{ top: 4, right: 20, left: -8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="short" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip labelMap={shortLabelMap} />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="totalStudentsMentored" name="Students mentored" fill="#10b981" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="totalTestsCheckedOut" name="Tests checked out" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 3 — submission volume */}
              <Card depth={2} className="neo:border-0">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Check-in Submission Volume · per Semester
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 4, right: 20, left: -8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="short" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip labelMap={shortLabelMap} />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="mentorSubmissions" name="30-min (mentor)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="menteeSubmissions" name="55-min (mentee)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2 — THIS SEMESTER
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="semester" className="space-y-5">
          {/* Delta stat row */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {selectedId === "all"
                  ? "All Semesters Combined"
                  : (semesters.find((s) => String(s.id) === selectedId)?.name ?? "Selected Semester")}
              </h3>
              {currentTrend?.prev && (
                <span className="text-xs text-muted-foreground">vs {shortLabel(currentTrend.prev.semesterName)}</span>
              )}
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard
                icon={<Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                label="30-min check-ins"
                value={currentTrend ? currentTrend.curr.mentorSubmissions : mentorEntries.length}
                delta={currentTrend?.prev ? pct(currentTrend.curr.mentorSubmissions, currentTrend.prev.mentorSubmissions) : undefined}
                accent="bg-amber-500/10"
              />
              <StatCard
                icon={<Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                label="Avg people in lab"
                value={currentTrend ? currentTrend.curr.avgPeopleInLab : avgPeopleInLab.toFixed(1)}
                delta={currentTrend?.prev ? pct(currentTrend.curr.avgPeopleInLab, currentTrend.prev.avgPeopleInLab) : undefined}
                accent="bg-blue-500/10"
              />
              <StatCard
                icon={<Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
                label="55-min check-ins"
                value={currentTrend ? currentTrend.curr.menteeSubmissions : menteeEntries.length}
                delta={currentTrend?.prev ? pct(currentTrend.curr.menteeSubmissions, currentTrend.prev.menteeSubmissions) : undefined}
                accent="bg-sky-500/10"
              />
              <StatCard
                icon={<BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                label="Students mentored"
                value={currentTrend ? currentTrend.curr.totalStudentsMentored : menteeStats.totalStudents}
                delta={currentTrend?.prev ? pct(currentTrend.curr.totalStudentsMentored, currentTrend.prev.totalStudentsMentored) : undefined}
                accent="bg-emerald-500/10"
              />
              <StatCard
                icon={<FlaskConical className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                label="Tests checked out"
                value={currentTrend ? currentTrend.curr.totalTestsCheckedOut : menteeStats.totalTests}
                delta={currentTrend?.prev ? pct(currentTrend.curr.totalTestsCheckedOut, currentTrend.prev.totalTestsCheckedOut) : undefined}
                accent="bg-violet-500/10"
              />
            </div>
          </div>

          {/* Heatmap + day-of-week chart */}
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]" style={{ alignItems: "start" }}>
            {/* Heatmap */}
            <Card depth={2} className="neo:border-0">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Traffic Heatmap · Avg People in Lab
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[340px]">
                    <thead>
                      <tr>
                        <th className="p-1.5 text-left text-muted-foreground font-medium w-10" />
                        {DAY_LABELS.map((day) => (
                          <th key={day} className="p-1.5 text-center text-muted-foreground font-medium">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.map((hour) => (
                        <tr key={hour}>
                          <td className="p-1 text-muted-foreground font-medium whitespace-nowrap text-right pr-2">
                            {formatHour(hour)}
                          </td>
                          {DAY_LABELS.map((_, di) => {
                            const weekday = di + 1
                            const avg = heatmapLookup.get(`${weekday}-${hour}`)
                            return (
                              <td key={di} className="p-0.5">
                                <div
                                  className={`rounded p-1.5 sm:p-2 text-center font-semibold tabular-nums transition-colors ${
                                    avg !== undefined ? heatColor(avg) : "bg-muted/20 text-muted-foreground/30"
                                  }`}
                                  title={avg !== undefined ? `${avg.toFixed(1)} avg` : "No data"}
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
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-muted-foreground justify-end">
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-blue-200" /> ≤6</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-blue-300" /> 7–10</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-blue-400" /> 11–15</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-blue-500" /> 16–20</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-blue-600" /> 20+</span>
                </div>
              </CardContent>
            </Card>

            {/* Busiest slots + day averages */}
            <div className="space-y-4">
              <Card depth={2} className="neo:border-0">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Busiest Slots
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4 space-y-2.5">
                  {busiestSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet.</p>
                  ) : busiestSlots.map((slot, i) => {
                    const dayName = DAY_NAMES[slot.weekday - 1]
                    const intensity = Math.min(100, (slot.averagePeopleInLab / (maxHeat || 1)) * 100)
                    return (
                      <div key={`${slot.weekday}-${slot.hour}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="text-muted-foreground tabular-nums w-3 text-right">{i + 1}.</span>
                            {dayName} {formatHour(slot.hour)}
                          </span>
                          <span className="tabular-nums font-semibold">{slot.averagePeopleInLab.toFixed(1)}</span>
                        </div>
                        <Progress value={intensity} className="h-1" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card depth={2} className="neo:border-0">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    By Day
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={dayAverages} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => [v ?? 0, "Avg people"]} />
                      <Bar dataKey="avg" name="Avg people" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Course demand + recent check-ins */}
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]" style={{ alignItems: "start" }}>
            {/* Course demand */}
            <Card depth={2} className="neo:border-0">
              <CardHeader className="pb-2 px-5 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Course Demand
                  </CardTitle>
                  {menteeStats.submissions > 0 && (
                    <span className="text-xs text-muted-foreground">{menteeStats.submissions} 55-min submissions</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                {courseDemand.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No mentee data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {courseDemand.map(({ course, count }) => (
                      <div key={course} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{course}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {count} {count === 1 ? "session" : "sessions"}
                          </span>
                        </div>
                        <Progress
                          value={Math.round((count / maxCourseCount) * 100)}
                          className="h-1.5 [&>div]:bg-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent check-ins */}
            <Card depth={2} className="lg:sticky lg:top-4 neo:border-0">
              <CardHeader className="pb-2 px-5 pt-5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Check-ins
                </CardTitle>
                {mentorEntries.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={openAllCheckIns}>
                    <Expand className="h-3.5 w-3.5" />
                    View All
                  </Button>
                )}
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                  {mentorEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No entries yet.</p>
                  ) : mentorEntries.map((entry) => (
                    <CheckInCard key={entry.id} entry={entry} copiedId={copiedId} onCopy={copyCheckIn} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Dialog open={checkInsOpen} onOpenChange={setCheckInsOpen}>
              <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>All Check-ins</DialogTitle>
                </DialogHeader>
                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                  {loadingAll ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
                  ) : allMentorEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No entries found.</p>
                  ) : allMentorEntries.map((entry) => (
                    <CheckInCard key={entry.id} entry={entry} copiedId={copiedId} onCopy={copyCheckIn} />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3 — COMPARE SEMESTERS
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="compare" className="space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              All Semesters · Side-by-Side
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Click column headers to sort. Rows highlight relative to the best semester per metric.
            </p>
          </div>

          {sortedTrends.length === 0 ? (
            <Card depth={2} className="neo:border-0">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No data imported yet.
              </CardContent>
            </Card>
          ) : (
            <Card depth={2} className="neo:border-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/50">
                      {(
                        [
                          { key: "semesterName", label: "Semester" },
                          { key: "mentorSubmissions", label: "30-min" },
                          { key: "avgPeopleInLab", label: "Avg Lab" },
                          { key: "menteeSubmissions", label: "55-min" },
                          { key: "avgStudentsMentored", label: "Avg Students" },
                          { key: "totalStudentsMentored", label: "Total Students" },
                          { key: "avgTestsCheckedOut", label: "Avg Tests" },
                          { key: "totalTestsCheckedOut", label: "Total Tests" },
                        ] as { key: keyof SemesterTrend; label: string }[]
                      ).map(({ key, label }) => (
                        <th
                          key={key}
                          onClick={() => toggleSort(key)}
                          className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors"
                        >
                          {label}{sortIndicator(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTrends.map((row, i) => {
                      const isActive = semesters.find((s) => s.id === row.semesterId)?.isActive
                      // Trend delta vs previous semester in original (chronological) order
                      const origIdx = trends.findIndex((t) => t.semesterId === row.semesterId)
                      const prevRow = origIdx > 0 ? trends[origIdx - 1] : null

                      return (
                        <tr
                          key={row.semesterId ?? `unassigned-${i}`}
                          className={`border-b border-border/20 hover:bg-muted/20 transition-colors ${isActive ? "bg-blue-500/5" : ""}`}
                        >
                          <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                            {row.semesterName}
                            {isActive && (
                              <Badge variant="outline" className="ml-2 text-[9px] h-4 px-1">active</Badge>
                            )}
                          </td>
                          <CompareCell value={row.mentorSubmissions} prev={prevRow?.mentorSubmissions} />
                          <CompareCell value={row.avgPeopleInLab} prev={prevRow?.avgPeopleInLab} decimals={1} />
                          <CompareCell value={row.menteeSubmissions} prev={prevRow?.menteeSubmissions} />
                          <CompareCell value={row.avgStudentsMentored} prev={prevRow?.avgStudentsMentored} decimals={1} />
                          <CompareCell value={row.totalStudentsMentored} prev={prevRow?.totalStudentsMentored} highlight />
                          <CompareCell value={row.avgTestsCheckedOut} prev={prevRow?.avgTestsCheckedOut} decimals={1} />
                          <CompareCell value={row.totalTestsCheckedOut} prev={prevRow?.totalTestsCheckedOut} highlight />
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Avg students per semester trend chart */}
          {hasTrendData && (
            <Card depth={2} className="neo:border-0">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Avg Students Mentored per Session · Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 4, right: 20, left: -8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="short" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip labelMap={shortLabelMap} />} />
                    <ReferenceLine
                      y={chartData.reduce((s, d) => s + d.avgStudentsMentored, 0) / (chartData.length || 1)}
                      stroke="#94a3b8"
                      strokeDasharray="4 2"
                      label={{ value: "avg", position: "right", fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgStudentsMentored"
                      name="Avg students / session"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgTestsCheckedOut"
                      name="Avg tests / session"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#8b5cf6" }}
                      strokeDasharray="4 2"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── CompareCell: table cell with optional delta indicator ────────────────────
function CompareCell({
  value,
  prev,
  decimals = 0,
  highlight = false,
}: {
  value: number
  prev?: number
  decimals?: number
  highlight?: boolean
}) {
  const delta = prev !== undefined ? pct(value, prev) : null
  const formatted = decimals ? value.toFixed(decimals) : value.toLocaleString()

  return (
    <td className={`px-3 py-2.5 tabular-nums whitespace-nowrap ${highlight && value > 0 ? "font-semibold" : ""}`}>
      <div className="flex items-center gap-1.5">
        <span>{formatted}</span>
        {delta !== null && (
          <Delta value={delta} />
        )}
      </div>
    </td>
  )
}
