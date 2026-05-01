import prisma from "@/lib/prisma";
import { getNextOfficerTermDateRange } from "@/lib/academicTerm";
import {
  formatSseOperationalTerm,
  getNextSseOperationalTerm,
} from "@/lib/sseTerms";
import {
  CommitteeHeadApplicationStatus,
  CommitteeHeadNominationCycleStatus,
  PositionCategory,
  type AcademicTerm,
} from "@prisma/client";

export const COMMITTEE_HEAD_APPLICATION_STATUSES = [
  CommitteeHeadApplicationStatus.PENDING_ACCEPTANCE,
  CommitteeHeadApplicationStatus.SUBMITTED,
  CommitteeHeadApplicationStatus.SELECTED,
  CommitteeHeadApplicationStatus.NOT_SELECTED,
  CommitteeHeadApplicationStatus.DECLINED,
  CommitteeHeadApplicationStatus.WITHDRAWN,
] as const;

export function isCommitteeHeadStatus(value: string) {
  return COMMITTEE_HEAD_APPLICATION_STATUSES.includes(
    value as CommitteeHeadApplicationStatus
  );
}

export function normalizeRankedPositionIds(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  const ids: number[] = [];
  for (const item of input) {
    const raw =
      typeof item === "object" && item !== null && "positionId" in item
        ? (item as { positionId: unknown }).positionId
        : item;
    const id = Number(raw);
    if (Number.isInteger(id) && id > 0 && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

export function validateRequiredText(
  fields: Record<string, unknown>
): { ok: true; data: Record<string, string> } | { ok: false; message: string } {
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) {
      return { ok: false, message: `${key} is required` };
    }
    data[key] = text;
  }
  return { ok: true, data };
}

export async function getOpenCommitteeHeadNominationCycle() {
  return prisma.committeeHeadNominationCycle.findFirst({
    where: { status: CommitteeHeadNominationCycleStatus.OPEN },
    orderBy: { openedAt: "desc" },
  });
}

export async function listCommitteeHeadPositions() {
  return prisma.officerPosition.findMany({
    where: {
      category: PositionCategory.COMMITTEE_HEAD,
      is_defunct: false,
    },
    select: {
      id: true,
      title: true,
      email: true,
    },
    orderBy: { title: "asc" },
  });
}

export async function validateCommitteeHeadPositionIds(positionIds: number[]) {
  if (positionIds.length === 0) {
    return { ok: false as const, message: "Select at least one position." };
  }

  const positions = await prisma.officerPosition.findMany({
    where: {
      id: { in: positionIds },
      category: PositionCategory.COMMITTEE_HEAD,
      is_defunct: false,
    },
    select: { id: true, title: true },
  });

  if (positions.length !== positionIds.length) {
    return {
      ok: false as const,
      message: "One or more selected positions are not committee-head roles.",
    };
  }

  return { ok: true as const, positions };
}

export async function isActivePrimaryOfficer(userId: number) {
  const count = await prisma.officer.count({
    where: {
      user_id: userId,
      is_active: true,
      position: { is_primary: true },
    },
  });
  return count > 0;
}

export async function openCommitteeHeadNominationCycleForHandoff(
  electionId: number,
  atDate = new Date()
) {
  const positions = await listCommitteeHeadPositions();
  if (positions.length === 0) {
    return {
      createdOrOpened: false,
      warning: "No committee-head positions are configured.",
    };
  }

  const term = getNextSseOperationalTerm(atDate);
  const name = `${formatSseOperationalTerm(
    term.term,
    term.year
  )} Committee Head Nominations`;
  const officerTerm = getNextOfficerTermDateRange(atDate);

  const cycle = await prisma.committeeHeadNominationCycle.upsert({
    where: {
      term_year: {
        term: term.term as AcademicTerm,
        year: term.year,
      },
    },
    update: {
      name,
      status: CommitteeHeadNominationCycleStatus.OPEN,
      openedAt: atDate,
      closedAt: null,
      officerTermStart: officerTerm.startDate,
      officerTermEnd: officerTerm.endDate,
      sourceElectionId: electionId,
    },
    create: {
      name,
      term: term.term as AcademicTerm,
      year: term.year,
      status: CommitteeHeadNominationCycleStatus.OPEN,
      openedAt: atDate,
      officerTermStart: officerTerm.startDate,
      officerTermEnd: officerTerm.endDate,
      sourceElectionId: electionId,
    },
  });

  return { createdOrOpened: true, cycle };
}
