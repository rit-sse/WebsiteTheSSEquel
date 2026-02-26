"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2, Camera, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HistoricalOfficer {
  id: number;
  start_date: string;
  end_date: string;
  user: { id: number; name: string; email: string; image: string | null };
  position: { id: number; title: string; is_primary: boolean };
}

interface HistoricalSemester {
  year: string;
  primary_officers: HistoricalOfficer[];
  committee_heads: HistoricalOfficer[];
}

interface Position {
  id: number;
  title: string;
  is_primary: boolean;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" }); }
  catch { return d; }
}

// ─── Photo upload helper ──────────────────────────────────────────────────────

async function uploadOfficerPhoto(userId: number, file: File): Promise<string> {
  // 1. Get presigned URL
  const res = await fetch("/api/aws/officerPictures", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, filename: file.name, contentType: file.type }),
  });
  if (!res.ok) throw new Error(await res.text());
  const { uploadUrl, key } = await res.json();

  // 2. Upload directly to S3
  const upload = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!upload.ok) throw new Error("S3 upload failed");

  // 3. Save key to user record
  const save = await fetch("/api/aws/officerPictures", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, key }),
  });
  if (!save.ok) throw new Error(await save.text());
  return key;
}

// ─── Officer row ─────────────────────────────────────────────────────────────

function OfficerRow({
  officer,
  onDelete,
  onPhotoUpdated,
}: {
  officer: HistoricalOfficer;
  onDelete: () => void;
  onPhotoUpdated: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadOfficerPhoto(officer.user.id, file);
      toast.success(`Photo updated for ${officer.user.name}`);
      onPhotoUpdated();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-2 border border-border/30">
      <div className="relative group/photo shrink-0">
        <Avatar className="h-9 w-9">
          {officer.user.image && <AvatarImage src={officer.user.image} alt={officer.user.name} />}
          <AvatarFallback className="text-xs">{getInitials(officer.user.name)}</AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Upload photo"
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity"
        >
          <Camera className="h-3.5 w-3.5 text-white" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{officer.user.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {officer.position.title} · {formatDate(officer.start_date)} – {formatDate(officer.end_date)}
        </div>
      </div>

      <Button
        size="xs"
        variant="destructiveGhost"
        onClick={onDelete}
        title="Delete record"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── Add Historical Officer Modal ────────────────────────────────────────────

function AddOfficerModal({
  open,
  onOpenChange,
  positions,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  positions: Position[];
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setEmail(""); setName(""); setPositionTitle(""); setStartDate(""); setEndDate(""); setError(null); };

  const handleOpenChange = (o: boolean) => { if (!o) reset(); onOpenChange(o); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !positionTitle || !startDate || !endDate) {
      setError("All fields except name are required"); return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError("End date must be after start date"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/officer/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, position_title: positionTitle, start_date: startDate, end_date: endDate }),
      });
      if (res.ok) {
        toast.success("Historical officer added");
        onSuccess();
        handleOpenChange(false);
      } else {
        setError(await res.text());
      }
    } catch {
      setError("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Add Historical Officer" className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Email <span className="text-muted-foreground text-xs">(RIT address)</span></Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dce1234@g.rit.edu" disabled={submitting} />
        </div>
        <div className="space-y-2">
          <Label>Name <span className="text-muted-foreground text-xs">(optional if user exists)</span></Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" disabled={submitting} />
        </div>
        <div className="space-y-2">
          <Label>Position</Label>
          <Select value={positionTitle} onValueChange={setPositionTitle} disabled={submitting}>
            <SelectTrigger><SelectValue placeholder="Select a position…" /></SelectTrigger>
            <SelectContent>
              {positions.map((p) => (
                <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Term Start</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={submitting} />
          </div>
          <div className="space-y-2">
            <Label>Term End</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={submitting} />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? "Adding…" : "Add Officer"}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Semester accordion section ───────────────────────────────────────────────

function SemesterSection({
  semester,
  onDelete,
  onPhotoUpdated,
}: {
  semester: HistoricalSemester;
  onDelete: (id: number) => void;
  onPhotoUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const all = [...semester.primary_officers, ...semester.committee_heads];

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="font-semibold text-sm">{semester.year}</span>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>{all.length} officer{all.length !== 1 ? "s" : ""}</span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-3">
          {all.map((o) => (
            <OfficerRow
              key={o.id}
              officer={o}
              onDelete={() => onDelete(o.id)}
              onPhotoUpdated={onPhotoUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function HistoricalOfficersSection() {
  const [semesters, setSemesters] = useState<HistoricalSemester[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [histRes, posRes] = await Promise.all([
        fetch("/api/officer/history"),
        fetch("/api/officer-positions"),
      ]);
      if (histRes.ok) setSemesters(await histRes.json());
      if (posRes.ok) {
        const raw = await posRes.json();
        // Include all positions (active and defunct) for historical entry
        setPositions(raw.map((p: any) => ({ id: p.id, title: p.title, is_primary: p.is_primary })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/officer/history?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Record deleted");
      load();
    } else {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historical Officers</h2>
          <p className="text-sm text-muted-foreground">Manage past officer records and photos</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Officer
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : semesters.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No historical officer records found.</p>
      ) : (
        <div className="space-y-2">
          {semesters.map((s) => (
            <SemesterSection
              key={s.year}
              semester={s}
              onDelete={handleDelete}
              onPhotoUpdated={load}
            />
          ))}
        </div>
      )}

      <AddOfficerModal
        open={addOpen}
        onOpenChange={setAddOpen}
        positions={positions}
        onSuccess={load}
      />
    </div>
  );
}
