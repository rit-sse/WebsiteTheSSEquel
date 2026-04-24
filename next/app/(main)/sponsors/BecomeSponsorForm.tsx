"use client";

import { useState } from "react";
import { Handshake } from "lucide-react";
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

export default function BecomeSponsorForm() {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [interestedTier, setInterestedTier] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCancel = () => {
    setCompanyName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setInterestedTier("");
    setMessage("");
    setError("");
    setSuccess(false);
    setOpen(false);
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    // Validate required fields
    if (!companyName || !contactName || !contactEmail || !interestedTier) {
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
      const response = await fetch("/api/sponsorship-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          contactEmail,
          contactPhone: contactPhone || undefined,
          interestedTier,
          message: message || undefined,
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
        setError(errorText || "Failed to submit inquiry");
      }
    } catch (error) {
      console.error("Failed to submit sponsorship inquiry:", error);
      setError("An error occurred while submitting your inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg">
        <Handshake className="h-5 w-5 mr-2" />
        Become a Sponsor
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Become a Sponsor"
        description="Fill out this form to express your interest in sponsoring SSE. Our team will reach out to discuss partnership opportunities."
        className="max-w-lg max-h-[90vh]"
      >
        {success ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Inquiry Submitted!
            </h3>
            <p className="text-muted-foreground">
              Thank you for your interest in sponsoring SSE. Our team will reach out to you soon.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="sponsor-company">Company Name *</Label>
                <Input
                  id="sponsor-company"
                  placeholder="Your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor-contact">Contact Name *</Label>
                <Input
                  id="sponsor-contact"
                  placeholder="Your full name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor-email">Email *</Label>
                <Input
                  id="sponsor-email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor-phone">Phone</Label>
                <Input
                  id="sponsor-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor-tier">Interested Tier *</Label>
                <Select value={interestedTier} onValueChange={setInterestedTier}>
                  <SelectTrigger id="sponsor-tier">
                    <SelectValue placeholder="Select a sponsorship tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier1">Tier 1 — Visibility ($1,000)</SelectItem>
                    <SelectItem value="tier2">Tier 2 — Engagement ($3,000)</SelectItem>
                    <SelectItem value="tier3">Tier 3 — Premium Access ($5,000)</SelectItem>
                    <SelectItem value="custom">Custom Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsor-message">Additional Message</Label>
                <Textarea
                  id="sponsor-message"
                  placeholder="Tell us about your company and what you're looking for in a partnership"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
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
                {isSubmitting ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </>
  );
}
