"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Position {
  id: number;
  title: string;
  is_primary: boolean;
}

interface OfficerInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Position | null;
  onSuccess: () => void;
}

export default function OfficerInviteModal({
  open,
  onOpenChange,
  position,
  onSuccess,
}: OfficerInviteModalProps) {
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default dates when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !startDate && !endDate) {
      // Default to current academic year
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      // If before August, use current year's spring term end
      // Otherwise use next year
      const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
      
      setStartDate(`${startYear}-08-01`);
      setEndDate(`${startYear + 1}-05-31`);
    }
    if (!newOpen) {
      // Reset form when closing
      setEmail("");
      setStartDate("");
      setEndDate("");
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

    if (!position) {
      setError("No position selected");
      return;
    }

    if (!validateEmail(email)) return;

    if (!startDate || !endDate) {
      setError("Start and end dates are required");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("End date must be after start date");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type: "officer",
          positionId: position.id,
          startDate,
          endDate,
        }),
      });

      if (response.ok) {
        toast.success(`Invitation sent to ${email}`);
        onSuccess();
        handleOpenChange(false);
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
      title={position ? `Invite Officer for ${position.title}` : "Invite Officer"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="username@g.rit.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Must be an @g.rit.edu email address
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Term Start</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Term End</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">What happens next?</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>An invitation email will be sent to the provided address</li>
            <li>The recipient will sign in with their RIT Google account</li>
            <li>They will be prompted to accept the officer position</li>
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
