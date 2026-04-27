"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
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

export default function ViseTalkForm() {
  const [open, setOpen] = useState(false);
  const [speakerName, setSpeakerName] = useState("");
  const [speakerEmail, setSpeakerEmail] = useState("");
  const [speakerPhone, setSpeakerPhone] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [talkTitle, setTalkTitle] = useState("");
  const [talkAbstract, setTalkAbstract] = useState("");
  const [speakerBio, setSpeakerBio] = useState("");
  const [preferredDates, setPreferredDates] = useState("");
  const [talkFormat, setTalkFormat] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCancel = () => {
    setSpeakerName("");
    setSpeakerEmail("");
    setSpeakerPhone("");
    setAffiliation("");
    setTalkTitle("");
    setTalkAbstract("");
    setSpeakerBio("");
    setPreferredDates("");
    setTalkFormat("");
    setError("");
    setSuccess(false);
    setOpen(false);
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    // Validate required fields
    if (
      !speakerName ||
      !speakerEmail ||
      !talkTitle ||
      !talkAbstract ||
      !speakerBio ||
      !preferredDates ||
      !talkFormat
    ) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(speakerEmail)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/vise-talk-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speakerName,
          speakerEmail,
          speakerPhone: speakerPhone || undefined,
          affiliation: affiliation || undefined,
          talkTitle,
          talkAbstract,
          speakerBio,
          preferredDates,
          talkFormat,
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
      console.error("Failed to submit ViSE talk request:", error);
      setError("An error occurred while submitting your request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="neutral" size="lg">
        <Mic className="h-5 w-5 mr-2" />
        Speak at ViSE
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Propose a ViSE Talk"
        description="Voices in Software Engineering is SSE's speaker series. Share your story, research, or technical topic with our community."
        className="max-w-lg max-h-[90vh]"
      >
        {success ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Proposal Submitted!
            </h3>
            <p className="text-muted-foreground">
              Thank you for proposing a talk! Our team will review and reach
              out to coordinate scheduling.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="vise-name">Your Name *</Label>
                <Input
                  id="vise-name"
                  placeholder="Your full name"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vise-email">Email *</Label>
                <Input
                  id="vise-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={speakerEmail}
                  onChange={(e) => setSpeakerEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vise-phone">Phone</Label>
                <Input
                  id="vise-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={speakerPhone}
                  onChange={(e) => setSpeakerPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vise-affiliation">Affiliation</Label>
                <Input
                  id="vise-affiliation"
                  placeholder="Company, school, or 'Independent'"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Where you currently work, study, or that you&apos;re
                  independent
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vise-title">Talk Title *</Label>
                <Input
                  id="vise-title"
                  placeholder="A short, descriptive title"
                  value={talkTitle}
                  onChange={(e) => setTalkTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vise-abstract">Talk Abstract *</Label>
                <Textarea
                  id="vise-abstract"
                  placeholder="What will your talk cover? What will attendees take away?"
                  value={talkAbstract}
                  onChange={(e) => setTalkAbstract(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vise-bio">Speaker Bio *</Label>
                <Textarea
                  id="vise-bio"
                  placeholder="A few sentences about you and your background"
                  value={speakerBio}
                  onChange={(e) => setSpeakerBio(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vise-format">Talk Format *</Label>
                <Select value={talkFormat} onValueChange={setTalkFormat}>
                  <SelectTrigger id="vise-format">
                    <SelectValue placeholder="Select a format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In-person (GOL-1670)</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vise-dates">Preferred Dates *</Label>
                <Input
                  id="vise-dates"
                  placeholder="e.g., March 15-20, 2026 or flexible"
                  value={preferredDates}
                  onChange={(e) => setPreferredDates(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Provide a range of dates or specific dates that work for you
                </p>
              </div>
            </div>

            {error && <p className="text-destructive text-sm mt-2">{error}</p>}

            <ModalFooter>
              <Button
                variant="neutral"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Proposal"}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </>
  );
}
