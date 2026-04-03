export type ConstitutionHeadingNode = {
  id: string;
  title: string;
  depth: number;
  path: string;
  children: ConstitutionHeadingNode[];
};

export type ConstitutionFlatSection = {
  id: string;
  title: string;
  depth: number;
  path: string;
  startLine: number;
  endLineExclusive: number;
  markdown: string;
};

export type ConstitutionDocumentSnapshot = {
  markdown: string;
  html: string;
  sha: string;
  headings: ConstitutionHeadingNode[];
  flatSections: ConstitutionFlatSection[];
};

export type ConstitutionProposalComputedStatus =
  | "DRAFT"
  | "PRIMARY_REVIEW"
  | "SCHEDULED"
  | "OPEN"
  | "PASSED"
  | "FAILED"
  | "APPLIED"
  | "WITHDRAWN"
  | "STALE";
