"use client";

import { FormEvent, useState } from "react";
import { AutocompleteOption, Membership } from "./membership";
import { UserAutocomplete } from "./Autocomplete";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function AddMembershipModal({
    open,
    onOpenChange,
    onCreated,
} : {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onCreated?: (c: Membership) => void;
}) {
    const [selected, setSelected] = useState<AutocompleteOption | null>(null);
    const [reason, setReason] = useState("");
    const [dateGiven, setDateGiven] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setSelected(null);
        setReason("");
        setDateGiven("");
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
                body.dateGiven = new Date(dateGiven).toISOString();
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
            const message = err instanceof Error ? err.message : "Failed to add membership";
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
                    <p className="text-sm text-muted-foreground">Type 2+ characters to search</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="membership-reason">Reason</Label>
                    <Input
                        id="membership-reason"
                        placeholder="e.g. Attended lab cleaning"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="membership-date">Date</Label>
                    <Input
                        id="membership-date"
                        type="datetime-local"
                        value={dateGiven}
                        onChange={(e) => setDateGiven(e.target.value)}
                    />
                </div>

                {error && <div className="text-destructive text-sm py-2">{error}</div>}
                
                <ModalFooter>
                    <Button type="button" variant="neutral" onClick={() => { resetForm(); onOpenChange(false); }}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!selected || !reason.trim() || !dateGiven || submitting}>
                        {submitting ? "Saving..." : "Save"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
