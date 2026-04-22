export type AcademicTerm = "SPRING" | "SUMMER" | "FALL";

export interface TermYear {
  term: AcademicTerm;
  year: number;
}

// Single source of truth for academic calendar boundaries.
// Update these values to change semester logic globally.
export const ACADEMIC_CALENDAR_CONFIG = {
  SPRING: { startMonth: 1, endMonth: 5, endDay: 31 },
  SUMMER: { startMonth: 6, endMonth: 7, endDay: 31 },
  FALL: { startMonth: 8, endMonth: 12, endDay: 31 },
  OFFICER_TERM: {
    startMonth: 8,
    startDay: 1,
    endMonth: 5,
    endDay: 31,
  },
} as const;

function monthInRange(
  month: number,
  startMonth: number,
  endMonth: number
): boolean {
  return month >= startMonth && month <= endMonth;
}

export function getAcademicTermFromDate(date: Date): AcademicTerm {
  const month = date.getMonth() + 1;

  if (
    monthInRange(
      month,
      ACADEMIC_CALENDAR_CONFIG.SPRING.startMonth,
      ACADEMIC_CALENDAR_CONFIG.SPRING.endMonth
    )
  ) {
    return "SPRING";
  }
  if (
    monthInRange(
      month,
      ACADEMIC_CALENDAR_CONFIG.SUMMER.startMonth,
      ACADEMIC_CALENDAR_CONFIG.SUMMER.endMonth
    )
  ) {
    return "SUMMER";
  }
  return "FALL";
}

export function getCurrentAcademicTerm(date = new Date()): TermYear {
  return { term: getAcademicTermFromDate(date), year: date.getFullYear() };
}

export function hasTermPassed(
  graduationTerm: AcademicTerm,
  graduationYear: number,
  now: TermYear = getCurrentAcademicTerm()
): boolean {
  const rank = (term: AcademicTerm) =>
    term === "SPRING" ? 1 : term === "SUMMER" ? 2 : 3;

  if (graduationYear < now.year) return true;
  if (graduationYear > now.year) return false;
  return rank(graduationTerm) < rank(now.term);
}

export function formatAcademicTerm(term: AcademicTerm, year: number): string {
  const label =
    term === "SPRING" ? "Spring" : term === "SUMMER" ? "Summer" : "Fall";
  return `${label} ${year}`;
}

export function parseAcademicTermLabel(label: string): TermYear | null {
  const normalized = label.trim().toLowerCase();
  const match = normalized.match(/^(spring|summer|fall)\s+(\d{4})$/);
  if (!match) return null;

  const termLabel = match[1];
  const year = Number.parseInt(match[2], 10);
  if (Number.isNaN(year)) return null;

  const term: AcademicTerm =
    termLabel === "spring"
      ? "SPRING"
      : termLabel === "summer"
        ? "SUMMER"
        : "FALL";

  return { term, year };
}

export function getAcademicTermDateRange(
  term: AcademicTerm,
  year: number
): {
  startDate: Date;
  endDate: Date;
} {
  const termConfig = ACADEMIC_CALENDAR_CONFIG[term];
  const startDate = new Date(year, termConfig.startMonth - 1, 1);
  const endDate = new Date(year, termConfig.endMonth - 1, termConfig.endDay);
  return { startDate, endDate };
}

export function getAcademicTermEndDate(date: Date): Date {
  const term = getAcademicTermFromDate(date);
  const termConfig = ACADEMIC_CALENDAR_CONFIG[term];
  return new Date(
    date.getFullYear(),
    termConfig.endMonth - 1,
    termConfig.endDay
  );
}

/**
 * The next academic semester after `referenceDate` (advances
 * SPRING→SUMMER→FALL, then wraps to SPRING of the next year).
 *
 * Used by the handover orchestrator when creating a new MentorSemester
 * row so the fresh cycle is keyed to the upcoming term, not the one
 * that's currently ending.
 */
export function getNextSemester(referenceDate = new Date()): TermYear {
  const current = getCurrentAcademicTerm(referenceDate);
  const order: AcademicTerm[] = ["SPRING", "SUMMER", "FALL"];
  const i = order.indexOf(current.term);
  if (i < order.length - 1) {
    return { term: order[i + 1]!, year: current.year };
  }
  // Currently FALL — next semester is SPRING of the following calendar year.
  return { term: "SPRING", year: current.year + 1 };
}

/**
 * The officer-term date range for the cycle that *follows* the one we're
 * in today. `getDefaultOfficerTermDateRange()` hands back the cycle
 * whose start is the most recent Aug 1 — which is the cycle already in
 * progress. When a new semester is kicked off mid-term the freshly
 * elected officers should be installed into the *next* cycle, not this
 * one. This helper shifts both endpoints forward by a year.
 */
export function getNextOfficerTermDateRange(referenceDate = new Date()): {
  startDate: Date;
  endDate: Date;
} {
  const current = getDefaultOfficerTermDateRange(referenceDate);
  const shift = (d: Date) =>
    new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
  return { startDate: shift(current.startDate), endDate: shift(current.endDate) };
}

export function getDefaultOfficerTermDateRange(referenceDate = new Date()): {
  startDate: Date;
  endDate: Date;
} {
  const month = referenceDate.getMonth() + 1;
  const year = referenceDate.getFullYear();
  const cycleStartMonth = ACADEMIC_CALENDAR_CONFIG.OFFICER_TERM.startMonth;

  const startYear = month >= cycleStartMonth ? year : year - 1;
  const startDate = new Date(
    startYear,
    ACADEMIC_CALENDAR_CONFIG.OFFICER_TERM.startMonth - 1,
    ACADEMIC_CALENDAR_CONFIG.OFFICER_TERM.startDay
  );
  const endDate = new Date(
    startYear + 1,
    ACADEMIC_CALENDAR_CONFIG.OFFICER_TERM.endMonth - 1,
    ACADEMIC_CALENDAR_CONFIG.OFFICER_TERM.endDay
  );

  return { startDate, endDate };
}
