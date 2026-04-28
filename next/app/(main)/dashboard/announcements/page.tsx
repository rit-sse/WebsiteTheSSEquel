"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Plus, Pencil, Trash2, Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
  id: number;
  message: string;
  category: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formMessage, setFormMessage] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/announcement?all=true");
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // ── Open modal helpers ──
  const openAdd = () => {
    setEditingId(null);
    setFormMessage("");
    setFormCategory("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setFormMessage(a.message);
    setFormCategory(a.category ?? "");
    setFormActive(a.active);
    setModalOpen(true);
  };

  // ── Save (create or update) ──
  const handleSave = async () => {
    if (!formMessage.trim()) return;
    setIsSaving(true);

    const isEdit = editingId !== null;
    const method = isEdit ? "PUT" : "POST";
    const body = isEdit
      ? { id: editingId, message: formMessage, category: formCategory || null, active: formActive }
      : { message: formMessage, category: formCategory || null, active: formActive };

    try {
      const res = await fetch("/api/announcement", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(isEdit ? "Announcement updated" : "Announcement created");
        setModalOpen(false);
        await fetchAnnouncements();
      } else {
        const text = await res.text();
        toast.error(`Failed: ${text}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle active ──
  const toggleActive = async (a: Announcement) => {
    try {
      const res = await fetch("/api/announcement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, active: !a.active }),
      });
      if (res.ok) {
        toast.success(a.active ? "Announcement hidden" : "Announcement shown");
        await fetchAnnouncements();
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  // ── Delete ──
  const handleDeleteClick = (a: Announcement) => {
    setToDelete(a);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/announcement", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: toDelete.id }),
      });
      if (res.ok) {
        toast.success("Announcement deleted");
        setDeleteModalOpen(false);
        setToDelete(null);
        await fetchAnnouncements();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card depth={1} className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-primary" />
              <CardTitle>Announcements</CardTitle>
            </div>
            <Button onClick={openAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No announcements yet. Create one to display a banner across the site.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => (
              <Card
                key={a.id}
                depth={2}
                className={`p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  !a.active ? "opacity-60" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={a.active ? "default" : "secondary"}>
                      {a.active ? "Active" : "Hidden"}
                    </Badge>
                    {a.category && (
                      <Badge variant="outline">{a.category}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm truncate">{a.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => toggleActive(a)}
                  >
                    {a.active ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => handleDeleteClick(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* ── Add / Edit modal ── */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingId ? "Edit Announcement" : "New Announcement"}
      >
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="ann-message">Message</Label>
            <Textarea
              id="ann-message"
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder="Enter announcement text..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="ann-category">Category (optional)</Label>
            <Input
              id="ann-category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              placeholder='e.g. "Event", "Important", "Reminder"'
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ann-active"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="ann-active">Show immediately</Label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="neutral" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formMessage.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : editingId ? (
              "Save Changes"
            ) : (
              "Create"
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Delete confirmation ── */}
      <Modal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Announcement"
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to permanently delete this announcement?
        </p>
        {toDelete && (
          <Card depth={2} className="p-3 mt-3">
            <p className="text-sm">{toDelete.message}</p>
          </Card>
        )}
        <ModalFooter>
          <Button variant="neutral" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
