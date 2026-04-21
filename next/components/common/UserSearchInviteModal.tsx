"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";

/**
 * Modal companion to `<UserInviteSlot>` — a user search dialog that
 * resolves against `/api/user/search` and hands the picked user id back
 * to the caller. Mirrors the shape of the officer flow's
 * `OfficerInviteModal` but without the free-form email + date fields,
 * because the election flow always invites an existing user.
 */

export interface UserSearchResult {
  id: number;
  name: string;
  email?: string;
  image?: string | null;
}

interface UserSearchInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Modal header title, e.g. "Invite Running Mate" or "Nominate for President". */
  title: string;
  /** Subtitle / description shown under the title. */
  description?: string;
  /** Invoked when the user picks a search result and confirms.
   * Must throw to surface an inline error; resolve to close. */
  onInvite: (userId: number) => Promise<void>;
  /** Custom label for the confirm button. Default: "Send Invite". */
  confirmLabel?: string;
  /** Extra content rendered above the search box (e.g. office picker
   * for the nomination flow). */
  preface?: ReactNode;
  /** Renderer for each search result row. When omitted a sensible
   * default is used. Useful so the elections flow can drop in
   * `<ElectionAvatar>` while officers use initials. */
  renderAvatar?: (user: UserSearchResult) => ReactNode;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
}

export default function UserSearchInviteModal({
  open,
  onOpenChange,
  title,
  description,
  onInvite,
  confirmLabel = "Send Invite",
  preface,
  renderAvatar,
  searchPlaceholder = "Search by name or email…",
}: UserSearchInviteModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset local state whenever the modal is closed so the next
  // open doesn't show stale results.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedId(null);
      setSearching(false);
      setSubmitting(false);
    }
  }, [open]);

  const doSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(
        `/api/user/search?q=${encodeURIComponent(q)}`
      );
      if (!response.ok) {
        toast.error((await response.text()) || "Failed to search users");
        return;
      }
      const data = await response.json();
      setResults(data.items ?? []);
    } catch {
      toast.error("Failed to search users");
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleConfirm = useCallback(async () => {
    if (selectedId == null) return;
    setSubmitting(true);
    try {
      await onInvite(selectedId);
      onOpenChange(false);
    } catch {
      // The caller is expected to toast its own error message —
      // we just keep the modal open so the user can retry.
    } finally {
      setSubmitting(false);
    }
  }, [onInvite, onOpenChange, selectedId]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-lg"
    >
      <div className="space-y-4">
        {preface}
        <div className="space-y-2">
          <Label htmlFor="user-invite-search">Search members</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-invite-search"
                className="pl-9"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  // Dropping selection when the query changes stops
                  // the user from accidentally inviting someone who
                  // scrolled out of view.
                  setSelectedId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    doSearch();
                  }
                }}
                disabled={submitting}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={doSearch}
              disabled={searching || !query.trim() || submitting}
            >
              {searching ? "Searching…" : "Search"}
            </Button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border border-border/40">
          {results.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              {searching
                ? "Searching…"
                : query.trim()
                  ? "No results. Try a different name or email."
                  : "Search for a member to invite."}
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {results.map((user) => {
                const isSelected = selectedId === user.id;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(user.id)}
                      disabled={submitting}
                      className={`flex w-full items-center gap-3 p-3 text-left transition-colors disabled:opacity-60 ${
                        isSelected
                          ? "bg-primary/10 ring-1 ring-inset ring-primary/30"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {renderAvatar ? (
                        renderAvatar(user)
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>
                        {user.email && (
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <ModalFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={selectedId == null || submitting}
        >
          <Send className="mr-2 h-4 w-4" />
          {submitting ? "Sending…" : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
