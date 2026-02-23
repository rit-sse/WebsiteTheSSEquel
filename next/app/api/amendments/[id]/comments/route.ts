import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getActorFromRequest } from "@/lib/services/amendmentService";
import { resolveUserImage } from "@/lib/s3Utils";

export const dynamic = "force-dynamic";

type CommentItem = {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    name: string;
    image: string;
  };
};

function toPublicCommentRows(rawRows: Array<{
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    name: string | null;
    profileImageKey: string | null;
    googleImageURL: string | null;
  };
}>): CommentItem[] {
  return rawRows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.author.id,
      name: row.author.name,
      image: resolveUserImage(row.author.profileImageKey, row.author.googleImageURL),
    },
  }));
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const amendmentId = Number(params.id);
  if (Number.isNaN(amendmentId)) {
    return new Response("Invalid amendment id", { status: 422 });
  }

  const comments = await prisma.amendmentComment.findMany({
    where: { amendmentId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          profileImageKey: true,
          googleImageURL: true,
        },
      },
    },
  });

  return Response.json(toPublicCommentRows(comments));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const amendmentId = Number(params.id);
  if (Number.isNaN(amendmentId)) {
    return new Response("Invalid amendment id", { status: 422 });
  }

  const actor = await getActorFromRequest(request);
  if (!actor?.isMember) {
    return new Response("Authentication required", { status: 401 });
  }

  const amendment = await prisma.amendment.findUnique({
    where: { id: amendmentId },
    select: { id: true },
  });
  if (!amendment) {
    return new Response("Amendment not found", { status: 404 });
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return new Response('"content" is required', { status: 422 });
  }

  const comment = await prisma.amendmentComment.create({
    data: {
      amendmentId,
      authorId: actor.id,
      content,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          profileImageKey: true,
          googleImageURL: true,
        },
      },
    },
  });

  return Response.json(toPublicCommentRows([comment])[0], { status: 201 });
}
