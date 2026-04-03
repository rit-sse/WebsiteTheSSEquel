import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConstitutionProposalStatus } from "@prisma/client";

const {
  mockGetConstitutionActorFromRequest,
  mockGetViewerPrimaryOfficerSlots,
  mockGetCurrentConstitutionDocument,
  mockConstitutionProposalCreate,
  mockOfficerCount,
} = vi.hoisted(() => ({
  mockGetConstitutionActorFromRequest: vi.fn(),
  mockGetViewerPrimaryOfficerSlots: vi.fn(),
  mockGetCurrentConstitutionDocument: vi.fn(),
  mockConstitutionProposalCreate: vi.fn(),
  mockOfficerCount: vi.fn(),
}));

vi.mock("@/lib/constitution/auth", () => ({
  getConstitutionActorFromRequest: mockGetConstitutionActorFromRequest,
  getViewerPrimaryOfficerSlots: mockGetViewerPrimaryOfficerSlots,
}));

vi.mock("@/lib/constitution/document", () => ({
  getCurrentConstitutionDocument: mockGetCurrentConstitutionDocument,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    constitutionProposal: {
      create: mockConstitutionProposalCreate,
    },
    officer: {
      count: mockOfficerCount,
    },
  },
}));

import { POST } from "@/app/api/constitution/proposals/route";

function buildProposal(status: ConstitutionProposalStatus = ConstitutionProposalStatus.DRAFT) {
  return {
    id: 1,
    title: "Amend Article I",
    summary: "Clarify membership language",
    rationale: "Closes ambiguity",
    status,
    authorId: 42,
    baseRepoOwner: "rit-sse",
    baseRepoName: "governing-docs",
    baseBranch: "main",
    basePath: "constitution.md",
    baseDocumentSha: "sha-123",
    baseMarkdown: "# Article I\nOld text\n",
    sectionHeadingPath: "Article I",
    proposedSectionMarkdown: "# Article I\nNew text\n",
    fullProposedMarkdown: "# Article I\nNew text\n",
    unifiedDiff: "--- constitution.md\n+++ constitution.md\n@@\n-Old text\n+New text\n",
    electionStartsAt: null,
    electionEndsAt: null,
    submittedAt: status === ConstitutionProposalStatus.PRIMARY_REVIEW ? new Date() : null,
    appliedAt: null,
    appliedCommitSha: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    author: {
      id: 42,
      name: "Member User",
      email: "member@g.rit.edu",
    },
    primaryApprovals: [],
    votes: [],
  };
}

describe("/api/constitution/proposals route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentConstitutionDocument.mockResolvedValue({
      markdown: "# Article I\nOld text\n",
      html: "<h1>Article I</h1><p>Old text</p>",
      sha: "sha-123",
      headings: [],
      flatSections: [
        {
          id: "constitution-section-1",
          title: "Article I",
          depth: 1,
          path: "Article I",
          startLine: 0,
          endLineExclusive: 2,
          markdown: "# Article I\nOld text",
        },
      ],
    });
    mockOfficerCount.mockResolvedValue(3);
    mockGetViewerPrimaryOfficerSlots.mockResolvedValue([]);
  });

  it("rejects users who are neither members nor officers", async () => {
    mockGetConstitutionActorFromRequest.mockResolvedValue({
      authLevel: { isMember: false, isOfficer: false },
      user: { id: 42, name: "No Access", email: "no@g.rit.edu" },
    });

    const res = await POST(
      new Request("http://localhost/api/constitution/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }) as any
    );

    expect(res.status).toBe(403);
    expect(mockConstitutionProposalCreate).not.toHaveBeenCalled();
  });

  it("creates a draft amendment for a member", async () => {
    mockGetConstitutionActorFromRequest.mockResolvedValue({
      authLevel: {
        userId: 42,
        isMember: true,
        isOfficer: false,
        isPrimary: false,
        isPresident: false,
      },
      user: { id: 42, name: "Member User", email: "member@g.rit.edu" },
    });
    mockConstitutionProposalCreate.mockResolvedValue(buildProposal());

    const res = await POST(
      new Request("http://localhost/api/constitution/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Amend Article I",
          summary: "Clarify membership language",
          rationale: "Closes ambiguity",
          sectionHeadingPath: "Article I",
          proposedSectionMarkdown: "# Article I\nNew text\n",
          action: "save",
        }),
      }) as any
    );

    expect(res.status).toBe(201);
    expect(mockConstitutionProposalCreate).toHaveBeenCalled();
    const body = await res.json();
    expect(body.computedStatus).toBe("DRAFT");
    expect(body.sectionHeadingPath).toBe("Article I");
  });
});
