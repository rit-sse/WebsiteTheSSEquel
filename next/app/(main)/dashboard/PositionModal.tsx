"use client"

import { useState, useEffect, useMemo } from "react"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getImageUrl } from "@/lib/s3Utils"
import { toast } from "sonner"

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

function titleToSlug(val: string): string {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export default function PositionModal({ open, onOpenChange, position, defaultIsPrimary = false, onSuccess }: PositionModalProps) {
  const [title, setTitle] = useState("")
  const [isPrimary, setIsPrimary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isPhotoUploading, setIsPhotoUploading] = useState(false)

  const isEditMode = !!position
  const editingPositionId = position?.id ?? null

  const photoKey = useMemo(() => {
    const sourceTitle = (title || position?.title || "").trim()
    if (!sourceTitle) return null
    return `assets/officers/${titleToSlug(sourceTitle)}.jpg`
  }, [title, position?.title])

  const photoUrl = photoKey ? getImageUrl(photoKey) : null

  const handleUploadOfficerPhoto = async () => {
    if (!photoFile) return
    const sourceTitle = (title || position?.title || "").trim()
    if (!sourceTitle) return

    setIsPhotoUploading(true)
    try {
      const presignRes = await fetch("/api/aws/officerPictures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sourceTitle,
          contentType: photoFile.type || "image/jpeg",
        }),
      })

      if (!presignRes.ok) {
        const msg = await presignRes.text()
        throw new Error(msg || "Failed to get presigned URL")
      }

      const { uploadUrl } = await presignRes.json()

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": photoFile.type || "image/jpeg" },
        body: photoFile,
      })

      if (!uploadRes.ok) {
        const msg = await uploadRes.text()
        throw new Error(msg || "S3 upload failed")
      }

      toast.success("Officer card photo successfully updated")
      setPhotoFile(null)
      setPhotoModalOpen(false)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to upload photo")
    } finally {
      setIsPhotoUploading(false)
    }
  }

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

          {isEditMode && (
            <div className="space-y-2">
              <Label>Officer Card Photo</Label>
              <div className="rounded-lg border p-3 flex items-center justify-between gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-muted">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={`Current photo for ${title || position?.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="ml-auto">
                  <Button type="button" variant="outline" onClick={() => setPhotoModalOpen(true)}>
                    Change Photo
                  </Button>
                </div>
              </div>
            </div>
          )}

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

      <Modal
        open={photoModalOpen}
        onOpenChange={setPhotoModalOpen}
        title="Update Officer Card Photo"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload destination:
            <br />
            <code>{photoKey ?? "No title yet"}</code>
          </p>

          <div className="space-y-2">
            <Label htmlFor="officer-photo-file">New image</Label>
            <Input
              id="officer-photo-file"
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <ModalFooter className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setPhotoModalOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!photoFile || isPhotoUploading}
            onClick={handleUploadOfficerPhoto}
          >
            {isPhotoUploading ? "Uploading..." : "Upload"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
