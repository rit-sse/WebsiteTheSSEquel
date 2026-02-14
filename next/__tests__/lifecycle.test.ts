import { getCurrentAcademicTerm, hasTermPassed } from "@/lib/academicTerm";
import { isProfileCompletionEligible } from "@/lib/services/profileCompletionService";

describe("academic term utilities", () => {
  it("computes spring/summer/fall from dates", () => {
    expect(getCurrentAcademicTerm(new Date("2026-02-10"))).toEqual({
      term: "SPRING",
      year: 2026,
    });
    expect(getCurrentAcademicTerm(new Date("2026-06-10"))).toEqual({
      term: "SUMMER",
      year: 2026,
    });
    expect(getCurrentAcademicTerm(new Date("2026-10-10"))).toEqual({
      term: "FALL",
      year: 2026,
    });
  });

  it("detects passed graduation term", () => {
    expect(
      hasTermPassed("SPRING", 2026, {
        term: "SUMMER",
        year: 2026,
      })
    ).toBe(true);

    expect(
      hasTermPassed("FALL", 2026, {
        term: "FALL",
        year: 2026,
      })
    ).toBe(false);
  });
});

describe("profile completion eligibility", () => {
  it("requires all fields for membership eligibility", () => {
    expect(
      isProfileCompletionEligible({
        graduationTerm: "FALL",
        graduationYear: 2026,
        major: "Software Engineering",
        gitHub: "sse",
        linkedIn: "sse",
      })
    ).toBe(true);

    expect(
      isProfileCompletionEligible({
        graduationTerm: "FALL",
        graduationYear: 2026,
        major: "",
        gitHub: "sse",
        linkedIn: "sse",
      })
    ).toBe(false);
  });
});
