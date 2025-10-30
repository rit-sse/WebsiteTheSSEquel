"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AutocompleteOption, Membership } from "./options";
import { UserAutocomplete } from "./Autocomplete";


export function AddMembershipModal({
    open,
    onOpenChange,
    onCreated,
} : {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onCreated?: (c: Membership) => void;

}) {
    const ref = useRef<HTMLDialogElement>(null);
    const [selected, setSelected] = useState<AutocompleteOption | null>(null);
    const [reason, setReason] = useState("");
    const [dateGiven, setDateGiven] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            ref.current?.showModal();
            setSelected(null);
            setReason("");
            setDateGiven("");
            setError(null);
        } else {
            ref.current?.close();
        }
    }, [open]);

    async function onSubmit(e:FormEvent) {
        e.preventDefault();
        if (!selected) return;
        setSubmitting(true);
        setError(null);
        try {
            const body: any = {userId: selected.id, reason};
            if (dateGiven) {
                body.dateGiven = new Date(dateGiven).toISOString();
            }
            const res = await fetch("/api/memberships/", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const created = await res.json();
            onCreated?.(created);
            onOpenChange(false);
        } catch (err: any) {
            setError(err?.message ?? "Failed to add membership");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <dialog ref={ref} className="modal" onClose={() => onOpenChange(false)}>
            <div className="modal-box">
                <h3 className="font-bold text-lg">Add membership</h3>

                <form className="mt-4 space-y-4" onSubmit={onSubmit}>
                    <label className="form-control w-full">
                        <div className="label"><span className="label-text">Member</span></div>
                        <UserAutocomplete option={selected} onChange={setSelected}/>
                        <div className="label"><span className="label-text-alt">Type 2+ characters to search</span></div>
                    </label>

                    <label className="form-control w-full">
                        <div className="label"><span className="label-text">Reason</span></div>
                        <input
                            className="input input-bordered w-full"
                            placeholder="e.g. Attended lab cleaning"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            />
                    </label>

                    <label className="form-control w-full">
                        <div className="label"><span className="label-text">Date</span></div>
                        <input
                            type="datetime-local"
                            className="input input-bordered w-full"
                            value={dateGiven}
                            onChange={(e) => setDateGiven(e.target.value)}
                        />
                    </label>

                    {error && <div className="alert alert-error py-2">{error}</div>}
                    
                    <div className="modal-action">
                        <button type="button" className="btn" onClick={() => {onOpenChange(false); setSelected(null)}}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!selected || !reason.trim() || !dateGiven}>
                            {submitting ? <span className="loading loading-spinner"/> : "Save"}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button aria-label="Close"/>
            </form>
        </dialog>
    )
}