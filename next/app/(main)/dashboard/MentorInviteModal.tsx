"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { EmailAutocomplete } from "@/components/EmailAutocomplete";

interface MentorInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function MentorInviteModal({
  open,
  onOpenChange,
  onSuccess,
}: MentorInviteModalProps) {
  const [email, setEmail] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default expiration date when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !expirationDate) {
      // Default expiration to 1 year from now
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      setExpirationDate(oneYearFromNow.toISOString().split("T")[0]);
    }
    if (!newOpen) {
      // Reset form when closing
      setEmail("");
      setExpirationDate("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setError("Email is required");
      return false;
    }
    if (!email.endsWith("@g.rit.edu")) {
      setError("Email must be an @g.rit.edu address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) return;

    if (!expirationDate) {
      setError("Expiration date is required");
      return;
    }

    if (new Date(expirationDate) <= new Date()) {
      setError("Expiration date must be in the future");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type: "mentor",
          endDate: expirationDate,
        }),
      });

      if (response.ok) {
        toast.success(`Mentor invitation sent to ${email}`);
        onSuccess();
        handleOpenChange(false);
      } else if (response.status === 403) {
        const data = await response.json();
        setError(data.error || "Access denied");
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to send invitation");
      }
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError("An error occurred while sending the invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Invite New Mentor"
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <EmailAutocomplete
            value={email}
            onChange={(newEmail) => {
              setEmail(newEmail);
              setError(null);
            }}
            placeholder="Search users or enter email..."
            disabled={isSubmitting}
            emailDomain="@g.rit.edu"
          />
          <p className="text-xs text-muted-foreground">
            Search for existing users or enter a new @g.rit.edu email
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expirationDate">Mentorship Expiration</Label>
          <Input
            id="expirationDate"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            When the mentor&apos;s active status will expire (usually end of academic year)
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">What happens next?</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>An invitation email will be sent to the provided address</li>
            <li>The recipient will sign in with their RIT Google account</li>
            <li>They will be added as an active mentor upon acceptance</li>
            <li>The invitation expires after 30 days</li>
          </ul>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
