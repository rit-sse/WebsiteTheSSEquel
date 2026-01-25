"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
import GmailAuthModal from "@/components/GmailAuthModal"
import { useGmailAuth } from "@/lib/hooks/useGmailAuth"

const COMMITTEES = [
  "Mentoring",
  "Lab Ops",
  "Tech Committee",
  "Events",
  "Talks",
  "Projects",
  "Misc/Presidential",
]

interface CheckoutFormProps {
  userName: string
  onClose: () => void
  onSuccess: () => void
}

export default function CheckoutForm({ userName, onClose, onSuccess }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gmailAuth = useGmailAuth()
  
  // Form state
  const [name, setName] = useState(userName)
  const [committee, setCommittee] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")
  const [plannedDate, setPlannedDate] = useState("")
  const [notifyEmail, setNotifyEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate required fields
    if (!name || !committee || !description || !estimatedCost || !plannedDate || !notifyEmail) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    try {
      // Create the purchase request
      const response = await fetch("/api/purchasing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          committee,
          description,
          estimatedCost: parseFloat(estimatedCost),
          plannedDate: new Date(plannedDate).toISOString(),
          notifyEmail,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const newRequest = await response.json()

      // Send notification email
      try {
        const emailResponse = await fetch(`/api/purchasing/${newRequest.id}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "checkout" }),
        })
        if (emailResponse.ok) {
          console.log("Email sent successfully")
        } else if (emailResponse.status === 403) {
          const data = await emailResponse.json()
          if (data.needsGmailAuth) {
            // Request was created but email not sent - prompt for Gmail auth
            gmailAuth.setNeedsGmailAuth("/purchasing", data.message)
            // Still call onSuccess since the request was created
            onSuccess()
            return
          }
        } else {
          const emailError = await emailResponse.text()
          console.error("Email API error:", emailError)
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError)
        // Don't fail the whole request if email fails
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Button variant="ghost" className="mb-4 gap-2" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Request PCard Checkout</CardTitle>
            <CardDescription>
              Fill out this form before making a purchase with the PCard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="committee">Committee *</Label>
                <Select value={committee} onValueChange={setCommittee} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a committee" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMITTEES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">What are you purchasing and what&apos;s it for? *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you're purchasing and why..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Estimated Cost *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="estimatedCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plannedDate">Planned Purchase Date *</Label>
                  <Input
                    id="plannedDate"
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notifyEmail">Send notification to (email) *</Label>
                <Input
                  id="notifyEmail"
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="treasurer@sse.rit.edu"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This email will receive a notification about your checkout request
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <GmailAuthModal
        open={gmailAuth.needsAuth}
        onOpenChange={(open) => !open && gmailAuth.clearAuthState()}
        onAuthorize={gmailAuth.startGmailAuth}
        isLoading={gmailAuth.isLoading}
        message={gmailAuth.message}
      />
    </>
  )
}
