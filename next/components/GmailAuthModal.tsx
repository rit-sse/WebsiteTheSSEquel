"use client";

import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";

interface GmailAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthorize: () => void;
  isLoading?: boolean;
  message?: string;
}

/**
 * Modal to prompt officers to authorize Gmail access for sending emails.
 * This is shown when an officer action requires sending email but they
 * haven't granted the gmail.send OAuth scope yet.
 */
export default function GmailAuthModal({
  open,
  onOpenChange,
  onAuthorize,
  isLoading = false,
  message,
}: GmailAuthModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Gmail Authorization Required"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            {message || "To send emails through the SSE website, you need to grant Gmail access."}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="text-sm font-medium">What this allows:</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1.5 ml-6 list-disc">
            <li>Send notification emails on your behalf</li>
            <li>Send invitation emails to new members/officers</li>
            <li>Send purchase request notifications</li>
          </ul>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">Privacy note:</p>
          <p>
            This permission only allows sending emails through your account when you
            perform actions that require sending emails. We cannot read your emails
            or access your inbox.
          </p>
        </div>
      </div>

      <ModalFooter className="mt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button onClick={onAuthorize} disabled={isLoading}>
          {isLoading ? "Redirecting..." : "Authorize Gmail Access"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
