"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Send,
  Loader2,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
  Paperclip,
  X,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Heading2,
  FileIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Attachment {
  name: string;
  size: number;
  type: string;
  base64: string;
}

interface AlumniEmailModalProps {
  isPrimary: boolean;
}

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_ATTACHMENTS = 25 * 1024 * 1024; // 25MB total

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AlumniEmailModal({ isPrimary }: AlumniEmailModalProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [optedInCount, setOptedInCount] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/alumni/email")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setOptedInCount(data.optedInCount);
        })
        .catch(() => {});
    }
  }, [open]);

  const resetForm = useCallback(() => {
    setSubject("");
    setMessage("");
    setShowPreview(false);
    setConfirmOpen(false);
    setAttachments([]);
  }, []);

  if (!isPrimary) return null;

  const totalAttachmentSize = attachments.reduce((sum, a) => sum + a.size, 0);
  const canSend =
    subject.trim().length > 0 &&
    message.trim().length > 0 &&
    optedInCount !== 0;

  // ── Markdown toolbar helpers ──────────────────────────────────
  const insertMarkdown = (before: string, after: string = "", placeholder: string = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = message.substring(start, end);
    const text = selected || placeholder;
    const newValue =
      message.substring(0, start) + before + text + after + message.substring(end);
    setMessage(newValue);
    // Restore cursor after React re-render
    setTimeout(() => {
      ta.focus();
      const cursorPos = start + before.length + text.length;
      ta.setSelectionRange(
        start + before.length,
        cursorPos
      );
    }, 0);
  };

  const toolbarActions = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**", "bold text") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("_", "_", "italic text") },
    { icon: Heading2, label: "Heading", action: () => insertMarkdown("\n## ", "\n", "Heading") },
    { icon: List, label: "Bullet list", action: () => insertMarkdown("\n- ", "", "item") },
    { icon: ListOrdered, label: "Numbered list", action: () => insertMarkdown("\n1. ", "", "item") },
    { icon: Link, label: "Link", action: () => insertMarkdown("[", "](https://)", "link text") },
  ];

  // ── File attachment helpers ───────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast.error(`"${file.name}" exceeds the 10MB file size limit`);
        continue;
      }
      if (totalAttachmentSize + file.size > MAX_TOTAL_ATTACHMENTS) {
        toast.error("Total attachment size would exceed 25MB limit");
        break;
      }
      if (attachments.some((a) => a.name === file.name)) {
        toast.error(`"${file.name}" is already attached`);
        continue;
      }

      const base64 = await fileToBase64(file);
      setAttachments((prev) => [
        ...prev,
        { name: file.name, size: file.size, type: file.type, base64 },
      ]);
    }

    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  // ── Send flow ─────────────────────────────────────────────────
  const handleSendClick = () => {
    if (!canSend) {
      toast.error("Subject and message are required");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        subject: subject.trim(),
        message: message.trim(),
      };
      if (attachments.length > 0) {
        payload.attachments = attachments.map((a) => ({
          filename: a.name,
          content: a.base64,
          encoding: "base64",
        }));
      }

      const res = await fetch("/api/alumni/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        toast.error(text || "Failed to send emails");
        return;
      }

      const data = await res.json();

      if (data.sent === 0) {
        toast.info(data.message || "No emails sent");
      } else {
        toast.success(
          `Sent to ${data.sent} alumni${data.failed ? ` (${data.failed} failed)` : ""}`
        );
      }

      setOpen(false);
      resetForm();
    } catch {
      toast.error("An error occurred while sending");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const charCount = message.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-background text-foreground border-2 border-border rounded-lg font-medium hover:bg-muted transition-colors"
      >
        <Mail size={18} />
        Email Alumni
      </button>

      <Modal
        open={open}
        onOpenChange={handleClose}
        title="Email Opted-In Alumni"
        className="max-w-2xl"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Recipient info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <Users className="h-4 w-4 shrink-0" />
            {optedInCount !== null ? (
              <span>
                This will be sent from{" "}
                <strong className="text-foreground">no-reply@sse.rit.edu</strong> to{" "}
                <strong className="text-foreground">{optedInCount}</strong> alumni who opted in
                to receive emails.
              </span>
            ) : (
              <span>Loading recipient count...</span>
            )}
          </div>

          {optedInCount === 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                No alumni have opted in to receive emails yet. Emails won&apos;t be sent.
              </span>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              placeholder="e.g. Spring Career Fair Opportunities"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              Recipients will see:{" "}
              <span className="font-medium">[SSE Alumni] {subject || "..."}</span>
            </p>
          </div>

          {/* Message / Preview toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-message">
                Message{" "}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  (Markdown supported)
                </span>
              </Label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPreview ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>

            {showPreview ? (
              <Card depth={2} className="p-4 min-h-[200px]">
                <div className="text-xs text-muted-foreground mb-3 pb-2 border-b border-border">
                  <span className="font-medium">From:</span> Society of Software Engineers
                  &lt;no-reply@sse.rit.edu&gt;
                  <br />
                  <span className="font-medium">Subject:</span> [SSE Alumni]{" "}
                  {subject || "(no subject)"}
                  {attachments.length > 0 && (
                    <>
                      <br />
                      <span className="font-medium">Attachments:</span>{" "}
                      {attachments.map((a) => a.name).join(", ")}
                    </>
                  )}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic">No message content yet.</p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground">
                  You received this email because you opted in as an SSE alumni.
                </div>
              </Card>
            ) : (
              <div className="space-y-0">
                {/* Markdown toolbar */}
                <div className="flex items-center gap-0.5 px-2 py-1.5 bg-muted/40 border border-b-0 border-border rounded-t-md">
                  {toolbarActions.map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={action}
                      title={label}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <Textarea
                  ref={textareaRef}
                  id="email-message"
                  placeholder={`Write your message to alumni...\n\nYou can use **Markdown** formatting:\n• **bold**, _italic_, [links](url)\n• ## headings\n• - bullet lists\n• 1. numbered lists`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  rows={10}
                  className="resize-y rounded-t-none font-mono text-sm"
                />
              </div>
            )}

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{charCount} characters</span>
              {charCount > 5000 && (
                <span className="text-amber-600">Consider keeping messages concise</span>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attachments</Label>
              <span className="text-xs text-muted-foreground">
                {attachments.length > 0
                  ? `${formatFileSize(totalAttachmentSize)} / 25 MB`
                  : "Max 10 MB per file, 25 MB total"}
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm"
                  >
                    <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.name)}
                      className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="neutral"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="h-4 w-4 mr-1.5" />
              Attach Files
            </Button>
          </div>

          <ModalFooter>
            <Button type="button" variant="neutral" onClick={handleClose} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSendClick} disabled={sending || !canSend}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Send to {optedInCount ?? "..."} Alumni
                </>
              )}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Confirmation dialog */}
      <Modal open={confirmOpen} onOpenChange={setConfirmOpen} title="Confirm Send" className="max-w-sm">
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            You are about to send this email to <strong>{optedInCount}</strong> alumni. This
            action cannot be undone.
          </p>
          {attachments.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Including {attachments.length} attachment{attachments.length > 1 ? "s" : ""} (
              {formatFileSize(totalAttachmentSize)}).
            </p>
          )}
        </div>
        <ModalFooter>
          <Button variant="neutral" onClick={() => setConfirmOpen(false)}>
            Go Back
          </Button>
          <Button onClick={handleConfirmSend}>
            <Send className="h-4 w-4 mr-1.5" />
            Confirm Send
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

/** Convert a File to a base64 string (data only, no prefix) */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
