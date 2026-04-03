import { ApiError } from "@/lib/apiError";
import { createConstitutionUnifiedDiff } from "@/lib/constitution/diff";
import { parseConstitutionSections, replaceConstitutionSection } from "@/lib/constitution/sections";
import { unified } from "unified";
import remarkParse from "remark-parse";

type MarkdownNode = {
  type?: string;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
};

export const CONSTITUTION_PROPOSAL_LIMITS = {
  title: 200,
  summary: 1000,
};

function visitNode(node: MarkdownNode, cb: (node: MarkdownNode) => void) {
  cb(node);
  for (const child of node.children ?? []) {
    visitNode(child, cb);
  }
}

function trimAndRequire(value: string | undefined, fieldName: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw ApiError.badRequest(`${fieldName} is required`);
  }
  return trimmed;
}

function validateLength(value: string, fieldName: string, maxLength: number) {
  if (value.length > maxLength) {
    throw ApiError.badRequest(`${fieldName} must be ${maxLength} characters or fewer`);
  }
}

function throwResponse(response: Response): never {
  throw response;
}

export function prepareConstitutionProposalContent(input: {
  title?: string;
  summary?: string;
  rationale?: string;
  baseMarkdown: string;
  sectionHeadingPath?: string;
  proposedSectionMarkdown?: string;
}) {
  const title = trimAndRequire(input.title, "Title");
  const summary = trimAndRequire(input.summary, "Summary");
  const rationale = trimAndRequire(input.rationale, "Rationale");
  const sectionHeadingPath = trimAndRequire(
    input.sectionHeadingPath,
    "Section heading path"
  );
  const proposedSectionMarkdown = trimAndRequire(
    input.proposedSectionMarkdown,
    "Proposed section markdown"
  ).replace(/\r\n/g, "\n");

  validateLength(title, "Title", CONSTITUTION_PROPOSAL_LIMITS.title);
  validateLength(summary, "Summary", CONSTITUTION_PROPOSAL_LIMITS.summary);

  const { flatSections } = parseConstitutionSections(input.baseMarkdown);
  const section = flatSections.find((candidate) => candidate.path === sectionHeadingPath);
  if (!section) {
    throwResponse(ApiError.badRequest("Selected constitution section does not exist"));
  }

  const normalizedCurrent = section.markdown.trim();
  const normalizedProposed = proposedSectionMarkdown.trim();
  if (normalizedCurrent === normalizedProposed) {
    throwResponse(ApiError.badRequest("The proposed amendment must change the selected section"));
  }

  const { flatSections: replacementSections } = parseConstitutionSections(proposedSectionMarkdown);
  if (replacementSections.length === 0) {
    throwResponse(ApiError.badRequest("Replacement markdown must include a section heading"));
  }

  const replacementRoot = replacementSections[0];
  if (replacementRoot.title !== section.title || replacementRoot.depth !== section.depth) {
    throwResponse(
      ApiError.badRequest(
        "Replacement markdown must start with the same heading as the selected section"
      )
    );
  }

  const rootNode = unified().use(remarkParse).parse(
    proposedSectionMarkdown
  ) as MarkdownNode;
  let hasRawHtml = false;
  visitNode(rootNode, (node) => {
    if (node.type === "html") {
      hasRawHtml = true;
    }
  });
  if (hasRawHtml) {
    throwResponse(ApiError.badRequest("Raw HTML is not allowed in amendment proposals"));
  }

  const fullProposedMarkdown = replaceConstitutionSection(
    input.baseMarkdown,
    sectionHeadingPath,
    proposedSectionMarkdown
  );
  const unifiedDiff = createConstitutionUnifiedDiff(
    input.baseMarkdown,
    fullProposedMarkdown
  );

  return {
    title,
    summary,
    rationale,
    sectionHeadingPath,
    proposedSectionMarkdown,
    fullProposedMarkdown,
    unifiedDiff,
  };
}
