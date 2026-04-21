import { getGatewayAuthLevel } from "@/lib/authGateway";
import {
  stageHasRequiredApprovals,
} from "@/lib/elections";
import { canManageElections, getElectionApprovalRole } from "@/lib/seAdmin";
import prisma from "@/lib/prisma";
import { ElectionApprovalStage } from "@prisma/client";

export const dynamic = "force-dynamic";

async function parseElectionId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) {
    throw new Error("Invalid election ID");
  }
  return parsed;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!(await canManageElections(authLevel)) || !authLevel.userId) {
    return new Response("Only the President or an SE Admin can approve elections", {
      status: 403,
    });
  }

  const approvalRole = await getElectionApprovalRole(authLevel);
  if (!approvalRole) {
    return new Response("Only the President or an SE Admin can approve elections", {
      status: 403,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const stage = body.stage as ElectionApprovalStage | undefined;
  if (!stage || !Object.values(ElectionApprovalStage).includes(stage)) {
    return new Response("A valid approval stage is required", { status: 400 });
  }

  try {
    const electionId = await parseElectionId(params);
    const approval = await prisma.electionApproval.upsert({
      where: {
        electionId_userId_stage: {
          electionId,
          userId: authLevel.userId,
          stage,
        },
      },
      create: {
        electionId,
        userId: authLevel.userId,
        stage,
      },
      update: {},
    });

    return Response.json({
      approval,
      stageSatisfied: await stageHasRequiredApprovals(electionId, stage),
      approvalRole,
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to create approval",
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authLevel = await getGatewayAuthLevel(request);
  if (!(await canManageElections(authLevel)) || !authLevel.userId) {
    return new Response("Only the President or an SE Admin can remove approvals", {
      status: 403,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const stage = body.stage as ElectionApprovalStage | undefined;
  if (!stage || !Object.values(ElectionApprovalStage).includes(stage)) {
    return new Response("A valid approval stage is required", { status: 400 });
  }

  try {
    const electionId = await parseElectionId(params);
    await prisma.electionApproval.delete({
      where: {
        electionId_userId_stage: {
          electionId,
          userId: authLevel.userId,
          stage,
        },
      },
    });
    return new Response(null, { status: 204 });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return new Response("Approval not found", { status: 404 });
    }
    return new Response(
      error instanceof Error ? error.message : "Failed to delete approval",
      { status: 400 }
    );
  }
}
