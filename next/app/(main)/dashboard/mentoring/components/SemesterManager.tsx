"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle, NeoCardDescription } from "@/components/ui/neo-card"
import { toast } from "sonner"
import { Calendar, Copy, Users, Pencil, Check, X } from "lucide-react"
import { getCurrentSemester } from "@/lib/semester"

interface MentorSemester {
  id: number
  name: string
  applicationOpen: string | null
  applicationClose: string | null
  isActive: boolean
  _count: {
    applications: number
    availability: number
  }
}

export default function SemesterManager() {
  const [semester, setSemester] = useState<MentorSemester | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editOpen, setEditOpen] = useState("")
  const [editClose, setEditClose] = useState("")

  // Get current semester name from utility
  const currentSemesterName = getCurrentSemester().label

  const fetchSemester = useCallback(async () => {
    try {
      const response = await fetch("/api/mentor-semester?activeOnly=true")
      if (response.ok) {
        const semesters = await response.json()
        if (semesters.length > 0) {
          setSemester(semesters[0])
          setEditOpen(semesters[0].applicationOpen?.split("T")[0] || "")
          setEditClose(semesters[0].applicationClose?.split("T")[0] || "")
        }
      }
    } catch (error) {
      console.error("Failed to fetch semester:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSemester()
  }, [fetchSemester])

  const handleToggleApplications = async () => {
    setIsSaving(true)
    try {
      if (semester) {
        // Toggle existing semester
        const newActiveState = !semester.isActive
        const response = await fetch("/api/mentor-semester", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: semester.id,
            isActive: newActiveState,
          }),
        })

        if (response.ok) {
          // Update state directly instead of refetching (since activeOnly=true won't find inactive semesters)
          setSemester({ ...semester, isActive: newActiveState })
          toast.success(newActiveState ? "Applications opened" : "Applications closed")
        } else {
          const data = await response.json()
          toast.error(data.error || "Failed to update")
        }
      } else {
        // Create new semester with current name
        const response = await fetch("/api/mentor-semester", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: currentSemesterName,
            setActive: true,
            createSchedule: true,
          }),
        })

        if (response.ok) {
          toast.success("Applications opened for " + currentSemesterName)
          fetchSemester()
        } else {
          const data = await response.json()
          toast.error(data.error || "Failed to create semester")
        }
      }
    } catch (error) {
      console.error("Failed to toggle applications:", error)
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDates = async () => {
    if (!semester) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/mentor-semester", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: semester.id,
          applicationOpen: editOpen || null,
          applicationClose: editClose || null,
        }),
      })

      if (response.ok) {
        toast.success("Dates updated")
        setIsEditing(false)
        fetchSemester()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update dates")
      }
    } catch (error) {
      console.error("Failed to save dates:", error)
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const copyApplyUrl = () => {
    const url = `${window.location.origin}/mentoring/apply`
    navigator.clipboard.writeText(url)
    toast.success("Application URL copied to clipboard")
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set"
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm py-8 text-center">
        Loading...
      </div>
    )
  }

  const isOpen = semester?.isActive ?? false
  const applicationCount = semester?._count?.applications ?? 0
  const availabilityCount = semester?._count?.availability ?? 0

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {semester && (
        <div className="grid gap-3 grid-cols-2">
          <NeoCard>
            <NeoCardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Applications</div>
                <div className="text-xl font-semibold tabular-nums">{applicationCount}</div>
              </div>
            </NeoCardContent>
          </NeoCard>
          <NeoCard>
            <NeoCardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">With Availability</div>
                <div className="text-xl font-semibold tabular-nums">{availabilityCount}</div>
              </div>
            </NeoCardContent>
          </NeoCard>
        </div>
      )}

      {/* Main Recruitment Card */}
      <NeoCard>
        <NeoCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <NeoCardTitle className="text-xl">
                {semester?.name || currentSemesterName} Recruitment
              </NeoCardTitle>
              <NeoCardDescription>
                Manage mentor applications for this semester
              </NeoCardDescription>
            </div>
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className={isOpen ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" : ""}
            >
              {isOpen ? "Applications Open" : "Applications Closed"}
            </Badge>
          </div>
        </NeoCardHeader>
        <NeoCardContent className="space-y-6">
          {/* Toggle Applications */}
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border/40">
            <div className="space-y-0.5">
              <Label className="text-base">Accept Applications</Label>
              <p className="text-sm text-muted-foreground">
                {isOpen 
                  ? "Students can submit mentor applications" 
                  : "Applications are currently closed"}
              </p>
            </div>
            <Switch
              checked={isOpen}
              onCheckedChange={handleToggleApplications}
              disabled={isSaving}
            />
          </div>

          {/* Application Window */}
          {semester && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Application Window</Label>
                {!isEditing ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setIsEditing(false)
                        setEditOpen(semester.applicationOpen?.split("T")[0] || "")
                        setEditClose(semester.applicationClose?.split("T")[0] || "")
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleSaveDates}
                      disabled={isSaving}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="editOpen" className="text-xs text-muted-foreground">
                      Opens
                    </Label>
                    <Input
                      id="editOpen"
                      type="date"
                      value={editOpen}
                      onChange={(e) => setEditOpen(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="editClose" className="text-xs text-muted-foreground">
                      Closes
                    </Label>
                    <Input
                      id="editClose"
                      type="date"
                      value={editClose}
                      onChange={(e) => setEditClose(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {formatDate(semester.applicationOpen)} — {formatDate(semester.applicationClose)}
                </p>
              )}
            </div>
          )}
        </NeoCardContent>
      </NeoCard>

      {/* Application URL */}
      <NeoCard>
        <NeoCardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Application form:
            </span>
            <code className="text-xs bg-muted/60 px-2 py-1 rounded border border-border/40 font-mono">
              /mentoring/apply
            </code>
          </div>
          <Button size="sm" variant="outline" onClick={copyApplyUrl}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </NeoCardContent>
      </NeoCard>
    </div>
  )
}
