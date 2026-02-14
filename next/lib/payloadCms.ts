import type { NextRequest } from "next/server";

import prisma from "@/lib/prisma";

type MediaLike =
  | string
  | null
  | undefined
  | {
      url?: string | null;
      filename?: string | null;
    };

export function resolveMediaURL(media: MediaLike): string {
  if (typeof media === "string" && media.length > 0) {
    return media;
  }

  if (media && typeof media === "object") {
    if (typeof media.url === "string" && media.url.length > 0) {
      return media.url;
    }

    if (typeof media.filename === "string" && media.filename.length > 0) {
      return `/api/payload/media/file/${media.filename}`;
    }
  }

  return "";
}

function getSessionToken(request: Request | NextRequest): string | null {
  const cookieName = process.env.SESSION_COOKIE_NAME;
  if (!cookieName) {
    return null;
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const pairs = cookieHeader.split(";").map((part) => part.trim());
  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=");
    if (key === cookieName) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export async function getSessionUser(request: Request | NextRequest) {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      session: {
        some: {
          sessionToken,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      officers: {
        where: { is_active: true },
        select: { id: true },
      },
    },
  });
}

export async function isOfficerRequest(request: Request | NextRequest) {
  const user = await getSessionUser(request);
  return Boolean(user && user.officers.length > 0);
}

export function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  const root = (value as { root?: unknown }).root as
    | { children?: unknown[] }
    | undefined;
  if (!root || !Array.isArray(root.children)) {
    return "";
  }

  const text: string[] = [];

  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") {
      return;
    }

    const typedNode = node as {
      text?: unknown;
      children?: unknown[];
      type?: unknown;
    };

    if (typeof typedNode.text === "string") {
      text.push(typedNode.text);
    }

    if (typedNode.type === "paragraph") {
      text.push("\n");
    }

    if (Array.isArray(typedNode.children)) {
      for (const child of typedNode.children) {
        visit(child);
      }
    }
  };

  for (const child of root.children) {
    visit(child);
  }

  return text.join("").trim();
}
