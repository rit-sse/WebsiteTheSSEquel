"use client";

import { useState, useCallback, useRef } from "react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Send,
  Loader2,
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

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailComposerSendPayload {
  subject: string;
  message: string;
  attachments: { filename: string; content: string; encoding: string }[];
}

interface EmailComposerModalProps {
  open: boolean;
  onClose: () => void;
  /** Explicit recipients. When omitted, onSend must be provided. */
  recipients?: EmailRecipient[];
  /** Override default send logic. Receives the composed payload; return { sent, failed?, message? }. */
  onSend?: (payload: EmailComposerSendPayload) => Promise<{ sent: number; failed?: number; message?: string }>;
  /** Custom node shown instead of the default "Sending to N recipients" badge. */
  recipientSummary?: React.ReactNode;
  defaultSubject?: string;
  title?: string;
}

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENTS = 25 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EmailComposerModal({
  open,
  onClose,
  recipients = [],
  onSend,
  recipientSummary,
  defaultSubject = "",
  title = "Send Email",
}: EmailComposerModalProps) {
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetForm = useCallback(() => {
    setSubject(defaultSubject);
    setMessage("");
    setShowPreview(false);
    setConfirmOpen(false);
    setAttachments([]);
  }, [defaultSubject]);

  const totalAttachmentSize = attachments.reduce((sum, a) => sum + a.size, 0);
  const canSend = subject.trim().length > 0 && message.trim().length > 0;

  const insertMarkdown = (before: string, after = "", placeholder = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = message.substring(start, end);
    const text = selected || placeholder;
    const newValue = message.substring(0, start) + before + text + after + message.substring(end);
    setMessage(newValue);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + text.length);
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
      setAttachments((prev) => [...prev, { name: file.name, size: file.size, type: file.type, base64 }]);
    }
    e.target.value = "";
  };

  const handleConfirmSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    try {
      const sendPayload: EmailComposerSendPayload = {
        subject: subject.trim(),
        message: message.trim(),
        attachments: attachments.map((a) => ({
          filename: a.name,
          content: a.base64,
          encoding: "base64",
        })),
      };

      let data: { sent: number; failed?: number; message?: string };

      if (onSend) {
        data = await onSend(sendPayload);
      } else {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...sendPayload, recipients }),
        });
        if (!res.ok) {
          const text = await res.text();
          toast.error(text || "Failed to send emails");
          return;
        }
        data = await res.json();
      }

      if (data.sent === 0) {
        toast.info(data.message || "No emails sent");
      } else {
        toast.success(`Sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}${data.failed ? ` (${data.failed} failed)` : ""}`);
      }

      onClose();
      resetForm();
    } catch {
      toast.error("An error occurred while sending");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <>
      <Modal open={open} onOpenChange={(o) => !o && handleClose()} title={title} className="max-w-2xl">
        <div className="space-y-4">
          {/* Recipients summary */}
          {recipientSummary ?? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span>
                Sending to <strong>{recipients.length}</strong> recipient{recipients.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Markdown toolbar */}
          <div className="flex items-center gap-1 flex-wrap border rounded-t-md bg-muted/30 px-2 py-1">
            {toolbarActions.map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                type="button"
                title={label}
                onClick={action}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>
          </div>

          {/* Message body / preview */}
          {showPreview ? (
            <Card className="p-4 min-h-[160px] prose prose-sm max-w-none dark:prose-invert rounded-t-none border-t-0">
              {message ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>
              )}
            </Card>
          ) : (
            <Textarea
              ref={textareaRef}
              placeholder="Write your message here (Markdown supported)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[160px] rounded-t-none border-t-0 resize-none font-mono text-sm"
            />
          )}

          {/* Attachments */}
          <div className="space-y-2">
            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((att) => (
                  <div key={att.name} className="flex items-center justify-between gap-2 text-sm bg-muted/30 rounded-md px-3 py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{att.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(att.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((a) => a.name !== att.name))}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach file
              </Button>
              {totalAttachmentSize > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(totalAttachmentSize)} / 25 MB
                </span>
              )}
              {totalAttachmentSize > MAX_TOTAL_ATTACHMENTS * 0.8 && (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!canSend) { toast.error("Subject and message are required"); return; }
              setConfirmOpen(true);
            }}
            disabled={sending || !canSend}
            className="gap-2"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending..." : recipients.length > 0 ? `Send to ${recipients.length}` : "Send"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirmation dialog */}
      <Modal
        open={confirmOpen}
        onOpenChange={(o) => !o && setConfirmOpen(false)}
        title="Confirm Send"
        description={`Send "${subject}" to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}?`}
        className="max-w-sm"
      >
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSend} className="gap-2">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
