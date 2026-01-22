"use client"

import { useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Upload, Users, FileText, Camera } from "lucide-react"

export interface Attendee {
  firstName: string
  lastName: string
  email: string
}

interface AttendanceInputProps {
  attendees: Attendee[]
  onAttendeesChange: (attendees: Attendee[]) => void
  attendanceImage: string | null
  onAttendanceImageChange: (image: string | null) => void
}

export default function AttendanceInput({
  attendees,
  onAttendeesChange,
  attendanceImage,
  onAttendanceImageChange,
}: AttendanceInputProps) {
  const [pasteText, setPasteText] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)

  // Manual entry handlers
  const addAttendee = () => {
    onAttendeesChange([...attendees, { firstName: "", lastName: "", email: "" }])
  }

  const removeAttendee = (index: number) => {
    onAttendeesChange(attendees.filter((_, i) => i !== index))
  }

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updated = [...attendees]
    updated[index] = { ...updated[index], [field]: value }
    onAttendeesChange(updated)
  }

  // Paste handler - parse CSV/TSV
  const handleParse = () => {
    setParseError(null)
    
    if (!pasteText.trim()) {
      setParseError("Please paste some data first")
      return
    }

    const lines = pasteText.trim().split("\n")
    const parsed: Attendee[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Try to detect delimiter (tab, comma, or multiple spaces)
      let parts: string[]
      if (line.includes("\t")) {
        parts = line.split("\t").map(p => p.trim())
      } else if (line.includes(",")) {
        parts = line.split(",").map(p => p.trim())
      } else {
        parts = line.split(/\s{2,}/).map(p => p.trim())
      }

      // Try to extract first name, last name, email
      if (parts.length >= 3) {
        parsed.push({
          firstName: parts[0],
          lastName: parts[1],
          email: parts[2],
        })
      } else if (parts.length === 2) {
        // Assume it's "Full Name, Email" format
        const nameParts = parts[0].split(" ")
        parsed.push({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: parts[1],
        })
      } else if (parts.length === 1 && parts[0].includes("@")) {
        // Just an email - try to extract name from it
        const emailPart = parts[0].split("@")[0]
        const nameParts = emailPart.split(/[._-]/)
        parsed.push({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: parts[0],
        })
      }
    }

    if (parsed.length === 0) {
      setParseError("Could not parse any attendees from the pasted data. Try format: First Name, Last Name, Email")
      return
    }

    onAttendeesChange(parsed)
    setPasteText("")
  }

  // Photo upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      onAttendanceImageChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [onAttendanceImageChange])

  const clearImage = () => {
    onAttendanceImageChange(null)
  }

  return (
    <div className="space-y-4">
      <Label>Attendance List</Label>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual" className="gap-2">
            <Users className="h-4 w-4" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="paste" className="gap-2">
            <FileText className="h-4 w-4" />
            Paste
          </TabsTrigger>
          <TabsTrigger value="photo" className="gap-2">
            <Camera className="h-4 w-4" />
            Photo
          </TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Add attendees one by one with their name and RIT email
          </p>

          {attendees.length > 0 && (
            <div className="space-y-3">
              {attendees.map((attendee, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <Input
                      placeholder="First Name"
                      value={attendee.firstName}
                      onChange={(e) => updateAttendee(index, "firstName", e.target.value)}
                    />
                    <Input
                      placeholder="Last Name"
                      value={attendee.lastName}
                      onChange={(e) => updateAttendee(index, "lastName", e.target.value)}
                    />
                    <Input
                      placeholder="RIT Email"
                      type="email"
                      value={attendee.email}
                      onChange={(e) => updateAttendee(index, "email", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttendee(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" onClick={addAttendee} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Attendee
          </Button>

          {attendees.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {attendees.length} attendee{attendees.length !== 1 ? "s" : ""} added
            </p>
          )}
        </TabsContent>

        {/* Paste Tab */}
        <TabsContent value="paste" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Paste data from a spreadsheet. Format: First Name, Last Name, Email (one per line)
          </p>

          <Textarea
            placeholder="John	Doe	jd1234@rit.edu
Jane	Smith	js5678@rit.edu"
            rows={6}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />

          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" onClick={handleParse} className="gap-2">
              <FileText className="h-4 w-4" />
              Parse Data
            </Button>
            {attendees.length > 0 && (
              <p className="text-sm text-muted-foreground self-center">
                {attendees.length} attendee{attendees.length !== 1 ? "s" : ""} parsed
              </p>
            )}
          </div>
        </TabsContent>

        {/* Photo Upload Tab */}
        <TabsContent value="photo" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Upload a photo of your sign-in sheet
          </p>

          {attendanceImage ? (
            <div className="space-y-4">
              <div className="relative border rounded-lg overflow-hidden">
                <img
                  src={attendanceImage}
                  alt="Attendance sheet"
                  className="w-full max-h-64 object-contain"
                />
              </div>
              <Button type="button" variant="outline" onClick={clearImage} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Remove Image
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="attendance-image-upload"
              />
              <label
                htmlFor="attendance-image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </span>
              </label>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
