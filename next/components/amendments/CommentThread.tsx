"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, LogIn } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

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
    return new Date(input).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return input;
  }
}

export default function CommentThread({
  amendmentId,
  initialComments,
  canComment,
  isUser = false,
}: {
  amendmentId: number;
  initialComments: CommentItem[];
  canComment: boolean;
  isUser?: boolean;
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
    <Card depth={2} className="p-4 space-y-4">
      <CardHeader className="p-0 flex flex-row items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary/60" />
        <CardTitle className="text-base">
          Public Forum
          {comments.length > 0 && (
            <span className="text-muted-foreground font-normal text-sm ml-2">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <div className="space-y-3 max-h-[420px] overflow-y-auto">
        {comments.length === 0 ? (
          <Card depth={3} className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No comments yet. Be the first to join the discussion.
            </p>
          </Card>
        ) : null}
        {comments.map((comment) => (
          <Card key={comment.id} depth={3} className="p-3">
            <div className="flex gap-3">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={comment.author.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(comment.author.name || "A")
                    .slice(0, 2)
                    .toUpperCase()
                    .trim()
                    .padEnd(2, "A")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold">
                    {comment.author.name ?? "SSE Member"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                  {comment.content}
                </ReactMarkdown>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {canComment ? (
        <div className="space-y-3 pt-2 border-t border-border/30">
          <Textarea
            rows={3}
            placeholder="Write a public forum comment..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={submitting}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Markdown supported
            </span>
            <Button
              onClick={postComment}
              disabled={submitting || !content.trim()}
              size="sm"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
          {message ? <p className="text-xs text-destructive">{message}</p> : null}
        </div>
      ) : isUser ? (
        <div className="pt-2 border-t border-border/30">
          <p className="text-sm text-muted-foreground">
            Become a member to join the forum discussion.
          </p>
        </div>
      ) : (
        <div className="pt-2 border-t border-border/30 flex items-center gap-2">
          <LogIn className="h-4 w-4 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            <Link href="/api/auth/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
            {" "}to join the forum discussion.
          </p>
        </div>
      )}
    </Card>
  );
}
