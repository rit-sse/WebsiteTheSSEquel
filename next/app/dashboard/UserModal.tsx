"use client"

import { useState, useEffect } from "react"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

export interface User {
  id: number
  name: string
  email: string
  isMember: boolean
  linkedIn?: string
  gitHub?: string
  description?: string
  image?: string
}

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null  // null = create mode, User = edit mode
  onSuccess: () => void
}

export default function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    isMember: false,
    linkedIn: "",
    gitHub: "",
    description: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isEditMode = !!user

  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          name: user.name || "",
          email: user.email || "",
          isMember: user.isMember || false,
          linkedIn: user.linkedIn || "",
          gitHub: user.gitHub || "",
          description: user.description || ""
        })
      } else {
        setFormData({
          name: "",
          email: "",
          isMember: false,
          linkedIn: "",
          gitHub: "",
          description: ""
        })
      }
      setError("")
    }
  }, [open, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and email are required")
      setIsSubmitting(false)
      return
    }

    try {
      const url = "/api/user"
      const method = isEditMode ? "PUT" : "POST"
      const body = isEditMode 
        ? { id: user!.id, ...formData }
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
        setError(errorText || `Failed to ${isEditMode ? "update" : "create"} user`)
      }
    } catch (err) {
      console.error("Error saving user:", err)
      setError("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? "Edit User" : "Create User"}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isMember"
            checked={formData.isMember}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, isMember: checked === true }))
            }
          />
          <Label htmlFor="isMember" className="cursor-pointer">Is SSE Member</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedIn">LinkedIn URL</Label>
          <Input
            id="linkedIn"
            name="linkedIn"
            value={formData.linkedIn}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gitHub">GitHub URL</Label>
          <Input
            id="gitHub"
            name="gitHub"
            value={formData.gitHub}
            onChange={handleChange}
            placeholder="https://github.com/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Short bio or description"
            rows={3}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="outline" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Save" : "Create"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
