"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

type CommentItem = {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    name: string | null;
    image: string | null;
  };
};

function formatDate(input: string) {
  try {
    return new Date(input).toLocaleString();
  } catch {
    return input;
  }
}

export default function CommentThread({
  amendmentId,
  initialComments,
  canComment,
}: {
  amendmentId: number;
  initialComments: CommentItem[];
  canComment: boolean;
}) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  async function postComment() {
    if (!content.trim()) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/amendments/${amendmentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not post comment");
      }

      setComments((prev) => [...prev, payload]);
      setContent("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-border p-4">
      <h3 className="font-heading font-semibold">Public Forum Comments</h3>

      <div className="space-y-3 max-h-[420px] overflow-y-auto">
        {comments.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet.</p> : null}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={comment.author.image ?? undefined} />
              <AvatarFallback>
                {(comment.author.name || "A")
                  .slice(0, 2)
                  .toUpperCase()
                  .trim()
                  .padEnd(2, "A")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <div className="text-sm">
                <span className="font-semibold">{comment.author.name ?? "SSE Member"}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <ReactMarkdown className="prose prose-sm max-w-none">{comment.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {canComment ? (
        <div className="space-y-3">
          <Textarea
            rows={4}
            placeholder="Write a public forum comment..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={submitting}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Markdown supported for basic formatting.</span>
            <div className="flex items-center gap-2">
              <Button onClick={postComment} disabled={submitting || !content.trim()}>
                {submitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
          {message ? <p className="text-xs text-destructive">{message}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in as a member to join the forum discussion.</p>
      )}
    </section>
  );
}
