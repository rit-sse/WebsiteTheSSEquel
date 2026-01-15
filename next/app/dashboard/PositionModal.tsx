"use client"

import { useState, useEffect } from "react"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export interface Position {
  id: number
  title: string
  email: string
  is_primary: boolean
  isFilled: boolean
  activeOfficerCount: number
}

interface PositionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position?: Position | null  // null = create mode, Position = edit mode
  onSuccess: () => void
}

export default function PositionModal({ open, onOpenChange, position, onSuccess }: PositionModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    email: "",
    is_primary: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isEditMode = !!position

  useEffect(() => {
    if (open) {
      if (position) {
        setFormData({
          title: position.title || "",
          email: position.email || "",
          is_primary: position.is_primary || false
        })
      } else {
        setFormData({
          title: "",
          email: "",
          is_primary: false
        })
      }
      setError("")
    }
  }, [open, position])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!formData.title.trim() || !formData.email.trim()) {
      setError("Title and email are required")
      setIsSubmitting(false)
      return
    }

    try {
      const url = "/api/officer-positions"
      const method = isEditMode ? "PUT" : "POST"
      const body = isEditMode 
        ? { id: position!.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        const errorText = await response.text()
        setError(errorText || `Failed to ${isEditMode ? "update" : "create"} position`)
      }
    } catch (err) {
      console.error("Error saving position:", err)
      setError("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? "Edit Position" : "Create Position"}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Position Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., President, Tech Head"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Position Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g., sse-president@rit.edu"
            required
          />
          <p className="text-xs text-muted-foreground">
            The official email for this position
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_primary"
            checked={formData.is_primary}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, is_primary: checked === true }))
            }
          />
          <Label htmlFor="is_primary" className="cursor-pointer">
            Primary Officer Position
          </Label>
        </div>
        <p className="text-xs text-muted-foreground ml-6">
          Primary officers are shown in the top section (President, VP, etc.)
        </p>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <ModalFooter>
          <Button type="button" variant="neutral" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Position"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
