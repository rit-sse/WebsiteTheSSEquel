import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

/**
 * HTTP PUT request to /api/authLevel/
 */
export async function PUT(request: Request) {
  // AUTH BYPASS: Return mocked fully authenticated user
  const mockedAuthLevel = {
    userId: 1,
    isUser: true,
    isMember: true,
    isMentor: true,
    isOfficer: true,
  };
  return Response.json(mockedAuthLevel);

  // ORIGINAL AUTH CODE (commented out):
  // let body;
  // try {
  //   body = await request.json();
  // } catch {
  //   return new Response("Invalid JSON", { status: 422 });
  // }

  // const authLevel: {
  //   userId: number | null;
  //   isUser: boolean;
  //   isMember: boolean;
  //   isMentor: boolean;
  //   isOfficer: boolean;
  // } = {
  //   userId: null,
  //   isUser: false,
  //   isMember: false,
  //   isMentor: false,
  //   isOfficer: false,
  // };

  // if (body.token == null) {
  //   return Response.json(authLevel);
  // }

  // const user = await prisma.user.findFirst({
  //   where: {
  //     session: {
  //       some: {
  //         sessionToken: body.token,
  //       },
  //     },
  //   },
  //   select: {
  //     id: true,
  //     mentor: {
  //       where: { isActive: true },
  //       select: { id: true },
  //     },
  //     officers: {
  //       where: { is_active: true },
  //       select: { id: true },
  //     },
  //     isMember: true,
  //   },
  // });

  // if (user != null) {
  //   authLevel.userId = user.id;
  //   authLevel.isUser = true;
  //   authLevel.isMember = user.isMember;
  //   authLevel.isMentor = user.mentor.length > 0;
  //   authLevel.isOfficer = user.officers.length > 0;
  // }

  // return Response.json(authLevel);
}

/**
 * HTTP GET request to /api/authLevel/
 */
export async function GET(request: NextRequest) {
  // AUTH BYPASS: Return mocked fully authenticated user
  const mockedAuthLevel = {
    userId: 1,
    isUser: true,
    isMember: true,
    isMentor: true,
    isOfficer: true,
  };
  return Response.json(mockedAuthLevel);

  // ORIGINAL AUTH CODE (commented out):
  // const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;

  // const authLevel: {
  //   userId: number | null;
  //   isUser: boolean;
  //   isMember: boolean;
  //   isMentor: boolean;
  //   isOfficer: boolean;
  // } = {
  //   userId: null,
  //   isUser: false,
  //   isMember: false,
  //   isMentor: false,
  //   isOfficer: false,
  // };
  // // console.log("AuthToken:", authToken);
  // if (authToken == null) {
  //   return Response.json(authLevel);
  // }

  // const user = await prisma.user.findFirst({
  //   where: {
  //     session: {
  //       some: {
  //         sessionToken: authToken,
  //       },
  //     },
  //   },
  //   select: {
  //     id: true,
  //     mentor: {
  //       where: { isActive: true },
  //       select: { id: true },
  //     },
  //     officers: {
  //       where: { is_active: true },
  //       select: { id: true },
  //     },
  //     isMember: true,
  //   },
  // });

  // // console.log("User found by Prisma:", user);
  // if (user != null) {
  //   authLevel.userId = user.id;
  //   authLevel.isUser = true;
  //   authLevel.isMember = user.isMember;
  //   authLevel.isMentor = user.mentor.length > 0;
  //   authLevel.isOfficer = user.officers.length > 0;
  // }

  // return Response.json(authLevel);
}
