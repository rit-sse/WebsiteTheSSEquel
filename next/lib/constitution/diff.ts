import { createTwoFilesPatch } from "diff";

export function createConstitutionUnifiedDiff(
  previousMarkdown: string,
  nextMarkdown: string
) {
  return createTwoFilesPatch(
    "constitution.md",
    "constitution.md",
    previousMarkdown,
    nextMarkdown,
    "base",
    "proposal",
    { context: 3 }
  );
}
