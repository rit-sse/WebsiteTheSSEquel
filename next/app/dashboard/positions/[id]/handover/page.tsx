"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Save, Pencil, Eye } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

interface HandoverDocument {
  id: number
  positionId: number
  content: string
  updatedAt: string
  position: {
    title: string
    is_primary: boolean
  }
}

export default function HandoverDocPage() {
  const params = useParams()
  const positionId = params.id as string

  const [document, setDocument] = useState<HandoverDocument | null>(null)
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const fetchDocument = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/handover/${positionId}`)
      if (response.ok) {
        const data = await response.json()
        setDocument(data)
        setContent(data.content)
        setLastSaved(new Date(data.updatedAt))
      } else if (response.status === 404) {
        setError("Position not found")
      } else {
        setError("Failed to load document")
      }
    } catch (err) {
      console.error("Error fetching document:", err)
      setError("Failed to load document")
    } finally {
      setIsLoading(false)
    }
  }, [positionId])

  useEffect(() => {
    if (positionId) {
      fetchDocument()
    }
  }, [positionId, fetchDocument])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasUnsavedChanges(newContent !== document?.content)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    try {
      const response = await fetch(`/api/handover/${positionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const data = await response.json()
        setDocument(data)
        setLastSaved(new Date(data.updatedAt))
        setHasUnsavedChanges(false)
      } else {
        const errorText = await response.text()
        setError(errorText || "Failed to save document")
      }
    } catch (err) {
      console.error("Error saving document:", err)
      setError("Failed to save document")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleMode = () => {
    if (isEditMode && hasUnsavedChanges) {
      // If switching from edit to view with unsaved changes, prompt to save
      if (confirm("You have unsaved changes. Save before viewing?")) {
        handleSave().then(() => setIsEditMode(false))
        return
      }
    }
    setIsEditMode(!isEditMode)
  }

  // Warn user about unsaved changes when leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-muted-foreground text-center py-12">Loading...</div>
      </div>
    )
  }

  if (error && !document) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card depth={1} className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Link href="/dashboard/positions">
              <Button variant="neutral">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Positions
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card depth={1} className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/positions">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{document?.position.title}</h1>
              <p className="text-sm text-muted-foreground">Handover Document</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleString()}
              </span>
            )}
            <Button 
              variant="outline"
              size="sm"
              onClick={handleToggleMode}
            >
              {isEditMode ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
            {isEditMode && (
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !hasUnsavedChanges}
                variant={hasUnsavedChanges ? "default" : "neutral"}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : hasUnsavedChanges ? "Save" : "Saved"}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Content */}
        <Card depth={2} className="p-4">
          {isEditMode ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Editing - Markdown supported
                </span>
              </div>
              <textarea
                id="content"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-[500px] p-4 font-mono text-sm bg-background border border-border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Write your handover documentation here using Markdown..."
              />
            </>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none p-4">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </Card>

        {/* Help text - only show in edit mode */}
        {isEditMode && (
          <div className="mt-4 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Markdown tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use <code className="bg-surface-3 px-1 rounded"># Heading</code> for section titles</li>
              <li>Use <code className="bg-surface-3 px-1 rounded">- item</code> for bullet points</li>
              <li>Use <code className="bg-surface-3 px-1 rounded">**bold**</code> for emphasis</li>
              <li>Use <code className="bg-surface-3 px-1 rounded">[link text](url)</code> for links</li>
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}
