import {
  formatAcademicTerm,
  type AcademicTerm,
  type TermYear,
} from "@/lib/academicTerm";

export type SseOperationalTerm = Exclude<AcademicTerm, "SUMMER">;

export function getCurrentSseOperationalTerm(
  date = new Date()
): TermYear & { term: SseOperationalTerm } {
  const month = date.getMonth() + 1;
  if (month >= 1 && month <= 5) {
    return { term: "SPRING", year: date.getFullYear() };
  }
  return { term: "FALL", year: date.getFullYear() };
}

export function getNextSseOperationalTerm(
  date = new Date()
): TermYear & { term: SseOperationalTerm } {
  const current = getCurrentSseOperationalTerm(date);
  if (current.term === "SPRING") {
    return { term: "FALL", year: current.year };
  }
  return { term: "SPRING", year: current.year + 1 };
}

export function formatSseOperationalTerm(
  term: SseOperationalTerm,
  year: number
) {
  return formatAcademicTerm(term, year);
}
