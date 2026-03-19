"use client";

import { FormEvent, useState } from "react";
import { AutocompleteOption, Membership } from "./membership";
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
  onCreated?: (c: Membership) => void;
}) {
  const [selected, setSelected] = useState<AutocompleteOption | null>(null);
  const [reason, setReason] = useState("");
  const [dateGiven, setDateGiven] = useState<string>(getTodayDateInputValue());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSelected(null);
    setReason("");
    setDateGiven(getTodayDateInputValue());
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { userId: selected.id, reason };
      if (dateGiven) {
        body.dateGiven = normalizeMembershipDateInput(dateGiven);
      }
      const res = await fetch("/api/memberships/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      onCreated?.(created);
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
    <Modal open={open} onOpenChange={handleOpenChange} title="Add membership">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label>Member</Label>
          <UserAutocomplete option={selected} onChange={setSelected} />
          <p className="text-sm text-muted-foreground">
            Type 2+ characters to search
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="membership-reason">Reason</Label>
          <Select value={reason} onValueChange={setReason}>
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
            type="date"
            value={dateGiven}
            onChange={(e) => setDateGiven(e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground">
            Saved as midnight UTC for the selected day.
          </p>
        </div>

        {error && <div className="text-destructive text-sm py-2">{error}</div>}

        <ModalFooter>
          <Button
            type="button"
            variant="neutral"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selected || !reason.trim() || !dateGiven || submitting}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
