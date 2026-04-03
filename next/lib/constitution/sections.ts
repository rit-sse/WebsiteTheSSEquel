import { unified } from "unified";
import remarkParse from "remark-parse";
import type {
  ConstitutionFlatSection,
  ConstitutionHeadingNode,
} from "@/lib/constitution/types";

type MarkdownNode = {
  type?: string;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
  position?: {
    start?: { line?: number };
  };
};

function visitNode(node: MarkdownNode, cb: (node: MarkdownNode) => void) {
  cb(node);
  for (const child of node.children ?? []) {
    visitNode(child, cb);
  }
}

function collectText(node: MarkdownNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }

  return (node.children ?? []).map(collectText).join("");
}

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n/g, "\n");
}

export function parseConstitutionSections(markdown: string): {
  headings: ConstitutionHeadingNode[];
  flatSections: ConstitutionFlatSection[];
} {
  const normalized = normalizeMarkdown(markdown);
  const root = unified().use(remarkParse).parse(normalized) as MarkdownNode;
  const lines = normalized.split("\n");
  const headings: Array<{
    title: string;
    depth: number;
    startLine: number;
  }> = [];

  visitNode(root, (node) => {
    if (node.type !== "heading" || !node.depth || !node.position?.start?.line) {
      return;
    }

    headings.push({
      title: collectText(node).trim(),
      depth: node.depth,
      startLine: node.position.start.line - 1,
    });
  });

  const pathStack: string[] = [];
  const nodeStack: ConstitutionHeadingNode[] = [];
  const tree: ConstitutionHeadingNode[] = [];
  const flatSections: ConstitutionFlatSection[] = [];

  headings.forEach((heading, index) => {
    pathStack[heading.depth - 1] = heading.title;
    pathStack.length = heading.depth;

    const nextSiblingIndex = headings.findIndex(
      (candidate, candidateIndex) =>
        candidateIndex > index && candidate.depth <= heading.depth
    );
    const endLineExclusive =
      nextSiblingIndex === -1 ? lines.length : headings[nextSiblingIndex].startLine;
    const path = pathStack.join(" > ");
    const sectionNode: ConstitutionHeadingNode = {
      id: `constitution-section-${index + 1}`,
      title: heading.title,
      depth: heading.depth,
      path,
      children: [],
    };

    nodeStack[heading.depth - 1] = sectionNode;
    nodeStack.length = heading.depth;

    if (heading.depth === 1 || !nodeStack[heading.depth - 2]) {
      tree.push(sectionNode);
    } else {
      nodeStack[heading.depth - 2].children.push(sectionNode);
    }

    flatSections.push({
      id: sectionNode.id,
      title: heading.title,
      depth: heading.depth,
      path,
      startLine: heading.startLine,
      endLineExclusive,
      markdown: lines.slice(heading.startLine, endLineExclusive).join("\n"),
    });
  });

  return { headings: tree, flatSections };
}

export function getConstitutionSectionByPath(
  markdown: string,
  sectionPath: string
) {
  return parseConstitutionSections(markdown).flatSections.find(
    (section) => section.path === sectionPath
  );
}

export function replaceConstitutionSection(
  markdown: string,
  sectionPath: string,
  replacementSectionMarkdown: string
) {
  const normalized = normalizeMarkdown(markdown);
  const section = getConstitutionSectionByPath(normalized, sectionPath);
  if (!section) {
    throw new Error(`Unknown constitution section path: ${sectionPath}`);
  }

  const replacement = normalizeMarkdown(replacementSectionMarkdown).replace(
    /\s+$/,
    ""
  );
  const lines = normalized.split("\n");
  const nextLines = [
    ...lines.slice(0, section.startLine),
    ...replacement.split("\n"),
    ...lines.slice(section.endLineExclusive),
  ];

  const nextMarkdown = nextLines.join("\n");
  return normalized.endsWith("\n") ? `${nextMarkdown.replace(/\n?$/, "")}\n` : nextMarkdown;
}
