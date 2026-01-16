"use client"

import { useState, useEffect } from "react"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface Officer {
  id: number
  is_active: boolean
  start_date: string
  end_date: string
  user: {
    id: number
    name: string
    email: string
    image: string
  }
  position: {
    id: number
    title: string
    email: string
    is_primary: boolean
  }
}

interface Position {
  id: number
  title: string
  email: string
  is_primary: boolean
}

interface User {
  id: number
  name: string
  email: string
}

interface OfficerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  officer?: Officer | null  // null = create mode (assign new officer)
  onSuccess: () => void
}

export default function OfficerModal({ open, onOpenChange, officer, onSuccess }: OfficerModalProps) {
  const [formData, setFormData] = useState({
    user_email: "",
    position: "",
    start_date: "",
    end_date: ""
  })
  const [positions, setPositions] = useState<Position[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isEditMode = !!officer

  useEffect(() => {
    if (open) {
      fetchPositions()
      fetchUsers()
      
      if (officer) {
        // Edit mode - fill in dates, show position (not editable)
        setFormData({
          user_email: officer.user.email,
          position: officer.position.title,
          start_date: formatDateForInput(officer.start_date),
          end_date: formatDateForInput(officer.end_date)
        })
      } else {
        setFormData({
          user_email: "",
          position: "",
          start_date: "",
          end_date: ""
        })
      }
      setError("")
    }
  }, [open, officer])

  const formatDateForInput = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().split('T')[0]
    } catch {
      return ""
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch("/api/officer-positions")
      if (response.ok) {
        const data = await response.json()
        setPositions(data)
      }
    } catch (error) {
      console.error("Failed to fetch positions:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/user")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!formData.start_date || !formData.end_date) {
      setError("Start date and end date are required")
      setIsSubmitting(false)
      return
    }

    try {
      if (isEditMode) {
        // Update existing officer dates
        const response = await fetch("/api/officer", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: officer!.id,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString()
          })
        })

        if (response.ok) {
          onSuccess()
          onOpenChange(false)
        } else {
          const errorText = await response.text()
          setError(errorText || "Failed to update officer")
        }
      } else {
        // Create new officer assignment
        if (!formData.user_email || !formData.position) {
          setError("User and position are required")
          setIsSubmitting(false)
          return
        }

        const response = await fetch("/api/officer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: formData.user_email,
            position: formData.position,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString()
          })
        })

        if (response.ok) {
          onSuccess()
          onOpenChange(false)
        } else {
          const errorText = await response.text()
          setError(errorText || "Failed to assign officer")
        }
      }
    } catch (err) {
      console.error("Error saving officer:", err)
      setError("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? "Edit Officer" : "Assign Officer"}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEditMode ? (
          // Edit mode - show readonly info
          <div className="space-y-2 p-3 bg-surface-2 rounded-lg">
            <p className="text-sm text-muted-foreground">Officer</p>
            <p className="font-medium">{officer?.user.name}</p>
            <p className="text-sm text-muted-foreground">{officer?.position.title}</p>
          </div>
        ) : (
          // Create mode - select user and position
          <>
            <div className="space-y-2">
              <Label>User *</Label>
              <Select
                value={formData.user_email}
                onValueChange={(value) => setFormData(prev => ({ ...prev, user_email: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Position *</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.title}>
                      {pos.title} {pos.is_primary ? "(Primary)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: Assigning will replace any current officer in this position
              </p>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">End Date *</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              required
            />
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="outline" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Save" : "Assign"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
