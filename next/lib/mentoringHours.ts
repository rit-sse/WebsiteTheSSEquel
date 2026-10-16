/**
 * Mentoring hours changed from 10 AM - 6 PM to 12 PM - 6 PM. Check-ins from
 * before the change date keep every hour they were recorded in; from the
 * change date onward only hours at or after MENTORING_START_HOUR count.
 */
export const MENTORING_START_HOUR = 12;
export const MENTORING_LAST_START_HOUR = 17; // 5pm - 6pm is the last slot

/** True for hours a mentor can currently be scheduled or available in. */
export function isMentoringSlotHour(hour: number): boolean {
  return hour >= MENTORING_START_HOUR && hour <= MENTORING_LAST_START_HOUR;
}
export const MENTORING_HOURS_CHANGE_DATE = new Date(2026, 9, 12); // Oct 12, 2026

export function isWithinMentoringHours(createdAt: Date): boolean {
  if (createdAt < MENTORING_HOURS_CHANGE_DATE) return true;
  return createdAt.getHours() >= MENTORING_START_HOUR;
}

/**
 * Heatmap rows to show. Hours before MENTORING_START_HOUR are only included
 * when there is data recorded for them (i.e. from before the hours changed).
 */
export function getVisibleHeatmapHours(
  hours: number[],
  observedHours: Iterable<number>
): number[] {
  const observed = new Set(observedHours);
  return hours.filter(
    (hour) => hour >= MENTORING_START_HOUR || observed.has(hour)
  );
}
