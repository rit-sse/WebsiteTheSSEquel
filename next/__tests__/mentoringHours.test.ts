import { describe, expect, it } from "vitest";
import {
  getVisibleHeatmapHours,
  isMentoringSlotHour,
  isWithinMentoringHours,
  MENTORING_HOURS_CHANGE_DATE,
} from "@/lib/mentoringHours";

describe("MENTORING_HOURS_CHANGE_DATE", () => {
  it("is midnight on Oct 12, 2026", () => {
    expect(MENTORING_HOURS_CHANGE_DATE.getFullYear()).toBe(2026);
    expect(MENTORING_HOURS_CHANGE_DATE.getMonth()).toBe(9);
    expect(MENTORING_HOURS_CHANGE_DATE.getDate()).toBe(12);
    expect(MENTORING_HOURS_CHANGE_DATE.getHours()).toBe(0);
  });
});

describe("isWithinMentoringHours", () => {
  it("keeps every hour before the change date", () => {
    expect(isWithinMentoringHours(new Date(2026, 9, 5, 10, 0))).toBe(true);
    expect(isWithinMentoringHours(new Date(2026, 9, 5, 11, 59))).toBe(true);
    expect(isWithinMentoringHours(new Date(2025, 2, 3, 10, 30))).toBe(true);
  });

  it("keeps the last minute before the change date", () => {
    expect(isWithinMentoringHours(new Date(2026, 9, 11, 23, 59, 59))).toBe(
      true
    );
    expect(isWithinMentoringHours(new Date(2026, 9, 11, 10, 0))).toBe(true);
  });

  it("drops hours before 12pm on and after the change date", () => {
    expect(isWithinMentoringHours(new Date(2026, 9, 12, 0, 0))).toBe(false);
    expect(isWithinMentoringHours(new Date(2026, 9, 12, 10, 30))).toBe(false);
    expect(isWithinMentoringHours(new Date(2026, 9, 12, 11, 59))).toBe(false);
    expect(isWithinMentoringHours(new Date(2026, 10, 3, 10, 0))).toBe(false);
    expect(isWithinMentoringHours(new Date(2027, 0, 20, 11, 0))).toBe(false);
  });

  it("keeps 12pm and later on and after the change date", () => {
    expect(isWithinMentoringHours(new Date(2026, 9, 12, 12, 0))).toBe(true);
    expect(isWithinMentoringHours(new Date(2026, 9, 12, 17, 59))).toBe(true);
    expect(isWithinMentoringHours(new Date(2026, 10, 3, 14, 0))).toBe(true);
  });
});

describe("isMentoringSlotHour", () => {
  it("accepts 12 through 17 and rejects everything else", () => {
    expect([9, 10, 11].some(isMentoringSlotHour)).toBe(false);
    expect([12, 13, 14, 15, 16, 17].every(isMentoringSlotHour)).toBe(true);
    expect([18, 19].some(isMentoringSlotHour)).toBe(false);
  });
});

describe("getVisibleHeatmapHours", () => {
  const HOURS = [10, 11, 12, 13, 14, 15, 16, 17];

  it("hides 10am and 11am when no data exists for them", () => {
    expect(getVisibleHeatmapHours(HOURS, [12, 13, 14])).toEqual([
      12, 13, 14, 15, 16, 17,
    ]);
    expect(getVisibleHeatmapHours(HOURS, [])).toEqual([12, 13, 14, 15, 16, 17]);
  });

  it("shows 10am and 11am when historical data exists for them", () => {
    expect(getVisibleHeatmapHours(HOURS, [10, 11, 12])).toEqual(HOURS);
  });

  it("shows only the early hour that has data", () => {
    expect(getVisibleHeatmapHours(HOURS, [11, 14])).toEqual([
      11, 12, 13, 14, 15, 16, 17,
    ]);
  });

  it("always keeps 12pm onward even without data", () => {
    expect(getVisibleHeatmapHours([12, 17], [])).toEqual([12, 17]);
  });
});
