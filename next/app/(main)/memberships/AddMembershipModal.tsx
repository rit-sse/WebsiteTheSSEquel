"use client";

import { FormEvent, useState } from "react";
import { AutocompleteOption } from "./membership";
import { toast } from "sonner";
import { membershipAwardEmailSchema } from "@/lib/services/membershipAwardValidation";
import { UserAutocomplete } from "./Autocomplete";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MANUAL_MEMBERSHIP_REASONS,
  normalizeMembershipDateInput,
} from "@/lib/membershipUtils";

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function AddMembershipModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const [selected, setSelected] = useState<AutocompleteOption | null>(null);
  const [recipient, setRecipient] = useState("");
  const [awardId, setAwardId] = useState(() => crypto.randomUUID());
  const [reason, setReason] = useState("");
  const [dateGiven, setDateGiven] = useState<string>(getTodayDateInputValue());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSelected(null);
    setRecipient("");
    setAwardId(crypto.randomUUID());
    setReason("");
    setDateGiven(getTodayDateInputValue());
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    resetForm();
    onOpenChange(newOpen);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const email = membershipAwardEmailSchema.safeParse(
      selected?.email ?? recipient
    );
    if (!email.success) {
      setError("Select a member or enter a valid @g.rit.edu email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        email: email.data,
        awardId,
        reason,
      };
      if (dateGiven) {
        body.dateGiven = normalizeMembershipDateInput(dateGiven);
      }
      const res = await fetch("/api/memberships/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      if (created.status === "awarded") {
        toast.success("Membership awarded.");
      } else if (created.emailStatus === "SENT") {
        toast.success(created.message);
      } else {
        toast.warning(created.message);
      }
      onCreated?.();
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add membership";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        if (!submitting) handleOpenChange(value);
      }}
      title="Add membership"
      className="w-[calc(100%-2rem)] sm:w-full"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="membership-recipient">
            Member or RIT Google email
          </Label>
          <UserAutocomplete
            key={awardId}
            id="membership-recipient"
            option={selected}
            onChange={setSelected}
            onQueryChange={setRecipient}
            disabled={submitting}
            placeholder="Search members or enter an @g.rit.edu email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="membership-reason">Reason</Label>
          <Select
            value={reason}
            onValueChange={setReason}
            disabled={submitting}
          >
            <SelectTrigger id="membership-reason">
              <SelectValue placeholder="Select a standardized reason" />
            </SelectTrigger>
            <SelectContent>
              {MANUAL_MEMBERSHIP_REASONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="membership-date">Date</Label>
          <Input
            id="membership-date"
            disabled={submitting}
            type="date"
            value={dateGiven}
            onChange={(e) => setDateGiven(e.target.value)}
            required
          />
        </div>

        {error && (
          <div role="alert" className="text-destructive text-sm py-2">
            {error}
          </div>
        )}

        <ModalFooter>
          <Button
            type="button"
            variant="neutral"
            disabled={submitting}
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !membershipAwardEmailSchema.safeParse(
                selected?.email ?? recipient
              ).success ||
              !reason.trim() ||
              !dateGiven ||
              submitting
            }
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
