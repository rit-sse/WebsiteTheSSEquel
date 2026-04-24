"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RecruitingTalkForm() {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [talkType, setTalkType] = useState("");
  const [preferredDates, setPreferredDates] = useState("");
  const [expectedAttendees, setExpectedAttendees] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCancel = () => {
    setCompanyName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setTalkType("");
    setPreferredDates("");
    setExpectedAttendees("");
    setDescription("");
    setError("");
    setSuccess(false);
    setOpen(false);
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    // Validate required fields
    if (!companyName || !contactName || !contactEmail || !talkType || !preferredDates) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/recruiting-talk-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          contactEmail,
          contactPhone: contactPhone || undefined,
          talkType,
          preferredDates,
          expectedAttendees: expectedAttendees || undefined,
          description: description || undefined,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        // Reset form after short delay to show success message
        setTimeout(() => {
          handleCancel();
        }, 3000);
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to submit request");
      }
    } catch (error) {
      console.error("Failed to submit recruiting talk request:", error);
      setError("An error occurred while submitting your request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="secondary" size="lg">
        <Calendar className="h-5 w-5 mr-2" />
        Schedule a Talk
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Schedule a Recruiting Talk"
        description="Request to host a tech talk, interview session, or workshop at SSE. Our team will coordinate scheduling with you."
        className="max-w-lg max-h-[90vh]"
      >
        {success ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Request Submitted!
            </h3>
            <p className="text-muted-foreground">
              Thank you for your interest! Our team will reach out to coordinate scheduling.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="talk-company">Company Name *</Label>
                <Input
                  id="talk-company"
                  placeholder="Your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="talk-contact">Contact Name *</Label>
                <Input
                  id="talk-contact"
                  placeholder="Your full name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="talk-email">Email *</Label>
                <Input
                  id="talk-email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="talk-phone">Phone</Label>
                <Input
                  id="talk-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="talk-type">Type of Event *</Label>
                <Select value={talkType} onValueChange={setTalkType}>
                  <SelectTrigger id="talk-type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech_talk">Tech Talk</SelectItem>
                    <SelectItem value="interview_session">Interview Session</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="info_session">Info Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="talk-dates">Preferred Dates *</Label>
                <Input
                  id="talk-dates"
                  placeholder="e.g., March 15-20, 2026 or flexible"
                  value={preferredDates}
                  onChange={(e) => setPreferredDates(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Provide a range of dates or specific dates that work for you
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="talk-attendees">Expected Attendees</Label>
                <Input
                  id="talk-attendees"
                  type="number"
                  placeholder="e.g., 20"
                  value={expectedAttendees}
                  onChange={(e) => setExpectedAttendees(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  How many people from your company will be attending?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="talk-description">Description</Label>
                <Textarea
                  id="talk-description"
                  placeholder="Tell us about what you'd like to present or discuss"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {error && <p className="text-destructive text-sm mt-2">{error}</p>}

            <ModalFooter>
              <Button variant="neutral" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </>
  );
}
