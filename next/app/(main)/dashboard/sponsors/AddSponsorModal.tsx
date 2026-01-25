"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface AddSponsorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddSponsorModal({ open, onOpenChange, onSuccess }: AddSponsorModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName("")
    setDescription("")
    setLogoUrl("")
    setWebsiteUrl("")
    setIsActive(true)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    // Validate required fields
    const invalidFields = []
    if (name.trim() === "") invalidFields.push("name")
    if (description.trim() === "") invalidFields.push("description")
    if (logoUrl.trim() === "") invalidFields.push("logo URL")
    if (websiteUrl.trim() === "") invalidFields.push("website URL")

    if (invalidFields.length > 0) {
      toast.error(`Required fields are empty: ${invalidFields.join(", ")}`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          logoUrl: logoUrl.trim(),
          websiteUrl: websiteUrl.trim(),
          isActive,
        }),
      })

      if (response.ok) {
        toast.success("Sponsor added successfully")
        handleClose()
        onSuccess()
      } else {
        const errorText = await response.text()
        console.error("API Error:", response.status, errorText)
        toast.error(`Failed to add sponsor: ${errorText}`, {
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error adding sponsor:", error)
      toast.error("An error occurred while adding the sponsor")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
        else onOpenChange(isOpen)
      }}
      title="Add Sponsor"
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sponsor-name">Name *</Label>
          <Input
            id="sponsor-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sponsor name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sponsor-description">Description *</Label>
          <Textarea
            id="sponsor-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the sponsor"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sponsor-logo">Logo URL *</Label>
          <Input
            id="sponsor-logo"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="/images/sponsors/logo.png or https://example.com/logo.png"
          />
          <p className="text-xs text-muted-foreground">
            Enter the URL or path to the sponsor&apos;s logo image (e.g., /images/sponsors/logo.png or https://example.com/logo.png)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sponsor-website">Website URL *</Label>
          <Input
            id="sponsor-website"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="sponsor-active"
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(checked === true)}
          />
          <Label htmlFor="sponsor-active" className="cursor-pointer">
            Active (visible on website)
          </Label>
        </div>
      </div>

      <ModalFooter>
        <Button variant="neutral" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Sponsor"}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
