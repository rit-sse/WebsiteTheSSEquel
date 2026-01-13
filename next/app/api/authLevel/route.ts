import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic'

// MOCK: Always return fully authenticated user
const MOCK_AUTH_LEVEL = {
  userId: 1,
  isUser: true,
  isMember: true,
  isMentor: true,
  isOfficer: true,
};

export async function PUT() {
  return Response.json(MOCK_AUTH_LEVEL);
}

export async function GET() {
  return Response.json(MOCK_AUTH_LEVEL);
}
