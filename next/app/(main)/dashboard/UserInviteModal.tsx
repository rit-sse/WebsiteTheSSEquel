"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import GmailAuthModal from "@/components/GmailAuthModal";
import { useGmailAuth } from "@/lib/hooks/useGmailAuth";
import { EmailAutocomplete } from "@/components/EmailAutocomplete";

interface UserInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function UserInviteModal({
  open,
  onOpenChange,
  onSuccess,
}: UserInviteModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gmailAuth = useGmailAuth();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail("");
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

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type: "user",
        }),
      });

      if (response.ok) {
        toast.success(`Invitation sent to ${email}`);
        onSuccess();
        handleOpenChange(false);
      } else if (response.status === 403) {
        // Check if Gmail authorization is needed
        const data = await response.json();
        if (data.needsGmailAuth) {
          gmailAuth.setNeedsGmailAuth(window.location.pathname, data.message);
          // Invitation was created but email wasn't sent
          if (data.invitation) {
            toast.warning("Invitation created but email not sent - Gmail authorization required");
            onSuccess();
            handleOpenChange(false);
          }
        } else {
          setError(data.error || "Access denied");
        }
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
    <>
      <Modal
        open={open}
        onOpenChange={handleOpenChange}
        title="Invite New Member"
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">Email Address</Label>
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>An invitation email will be sent to the provided address</li>
              <li>The recipient will sign in with their RIT Google account</li>
              <li>They will be added as an SSE member</li>
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

      <GmailAuthModal
        open={gmailAuth.needsAuth}
        onOpenChange={(open) => !open && gmailAuth.clearAuthState()}
        onAuthorize={gmailAuth.startGmailAuth}
        isLoading={gmailAuth.isLoading}
        message={gmailAuth.message}
      />
    </>
  );
}
