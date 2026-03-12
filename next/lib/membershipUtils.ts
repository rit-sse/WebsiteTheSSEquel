export const MANUAL_MEMBERSHIP_REASONS = [
  "Event Attendance",
  "Lab Cleaning",
  "Mentoring Support",
  "Volunteer Work",
  "Donation",
  "Other Approved Contribution",
] as const

export type ManualMembershipReason = (typeof MANUAL_MEMBERSHIP_REASONS)[number]

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function normalizeMembershipDateInput(value: string) {
  const trimmed = value.trim()
  const datePortion = trimmed.includes("T") ? trimmed.slice(0, 10) : trimmed

  if (!DATE_ONLY_PATTERN.test(datePortion)) {
    throw new Error("Invalid membership date")
  }

  const [yearString, monthString, dayString] = datePortion.split("-")
  const year = Number(yearString)
  const month = Number(monthString)
  const day = Number(dayString)

  const normalized = new Date(Date.UTC(year, month - 1, day))

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    throw new Error("Invalid membership date")
  }

  return normalized.toISOString()
}
