import { AuthLevel } from "@/lib/authLevel";
import { resolveAuthLevelFromRequest } from "@/lib/authLevelResolver";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic'

export async function getSessionCookie(request: NextRequest) {
    const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
    return authToken || null;
}

export async function getAuth(request: NextRequest): Promise<AuthLevel> {
    const authLevel = await resolveAuthLevelFromRequest(request, {
        includeProfileComplete: true,
    });
    return authLevel;
}