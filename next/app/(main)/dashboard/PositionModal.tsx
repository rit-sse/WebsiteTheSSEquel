"use client"

import { useState, useEffect } from "react"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface Position {
  id: number
  title: string
  is_primary: boolean
  isFilled: boolean
  currentOfficer: {
    id: number
    userId: number
    name: string
    email: string
    start_date: string
    end_date: string
  } | null
}

interface PositionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position?: Position | null
  defaultIsPrimary?: boolean
  onSuccess: () => void
}

export default function PositionModal({ open, onOpenChange, position, defaultIsPrimary = false, onSuccess }: PositionModalProps) {
  const [title, setTitle] = useState("")
  const [isPrimary, setIsPrimary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isEditMode = !!position
  const editingPositionId = position?.id ?? null

  useEffect(() => {
    if (open) {
      if (position) {
        setTitle(position.title || "")
        setIsPrimary(position.is_primary || false)
      } else {
        setTitle("")
        setIsPrimary(defaultIsPrimary)
      }
      setError("")
    }
  }, [open, position, defaultIsPrimary])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!title.trim()) {
      setError("Title is required")
      setIsSubmitting(false)
      return
    }

    try {
      if (isEditMode) {
        if (!editingPositionId) {
          setError("Invalid position selected")
          setIsSubmitting(false)
          return
        }

        const response = await fetch("/api/officer-positions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPositionId, title: title.trim() }),
        })

        if (response.ok) {
          onSuccess()
          onOpenChange(false)
        } else {
          const errorText = await response.text()
          setError(errorText || "Failed to update position")
        }
      } else {
        const response = await fetch("/api/officer-positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), is_primary: isPrimary }),
        })

        if (response.ok) {
          onSuccess()
          onOpenChange(false)
        } else {
          const errorText = await response.text()
          setError(errorText || "Failed to create position")
        }
      }
    } catch (err) {
      console.error("Error saving position:", err)
      setError("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalTitle = isEditMode 
    ? "Edit Position" 
    : isPrimary ? "Add Primary Officer" : "Add Committee Head"

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={modalTitle}
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="title">Position Title</Label>
              {isEditMode && (
                <Badge variant={position?.is_primary ? "default" : "outline"} className="text-xs shrink-0">
                  {position?.is_primary ? "Primary" : "Committee"}
                </Badge>
              )}
            </div>

            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isPrimary ? "e.g., Vice President" : "e.g., Hide and Seek Head"}
              required
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <ModalFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="outline" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditMode ? "Save" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  )
}
