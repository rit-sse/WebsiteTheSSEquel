import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * HTTP GET request to /api/event/[id]/purchases
 * @returns list of purchase requests linked to this event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: eventId } = params;

  try {
    const purchaseRequests = await prisma.purchaseRequest.findMany({
      where: { eventId },
      select: {
        id: true,
        description: true,
        status: true,
        estimatedCost: true,
        actualCost: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(purchaseRequests);
  } catch (error) {
    console.error("Error fetching event purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}
