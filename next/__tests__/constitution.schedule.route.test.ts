import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConstitutionProposalStatus } from "@prisma/client";

const {
  mockGetConstitutionActorFromRequest,
  mockGetViewerPrimaryOfficerSlots,
  mockGetCurrentConstitutionDocument,
  mockConstitutionProposalFindUnique,
  mockConstitutionProposalUpdate,
  mockOfficerCount,
} = vi.hoisted(() => ({
  mockGetConstitutionActorFromRequest: vi.fn(),
  mockGetViewerPrimaryOfficerSlots: vi.fn(),
  mockGetCurrentConstitutionDocument: vi.fn(),
  mockConstitutionProposalFindUnique: vi.fn(),
  mockConstitutionProposalUpdate: vi.fn(),
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
      findUnique: mockConstitutionProposalFindUnique,
      update: mockConstitutionProposalUpdate,
    },
    officer: {
      count: mockOfficerCount,
    },
  },
}));

import { PUT } from "@/app/api/constitution/proposals/[id]/schedule/route";

function buildProposal(sha = "sha-1", approvalCount = 1) {
  return {
    id: 5,
    title: "Amend Article II",
    summary: "Clarify elections",
    rationale: "Consistency",
    status: ConstitutionProposalStatus.PRIMARY_REVIEW,
    authorId: 1,
    baseRepoOwner: "rit-sse",
    baseRepoName: "governing-docs",
    baseBranch: "main",
    basePath: "constitution.md",
    baseDocumentSha: sha,
    baseMarkdown: "# Article II\nOld\n",
    sectionHeadingPath: "Article II",
    proposedSectionMarkdown: "# Article II\nNew\n",
    fullProposedMarkdown: "# Article II\nNew\n",
    unifiedDiff: "@@",
    electionStartsAt: null,
    electionEndsAt: null,
    submittedAt: new Date(),
    appliedAt: null,
    appliedCommitSha: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 1, name: "Author", email: "author@g.rit.edu" },
    primaryApprovals: Array.from({ length: approvalCount }, (_, index) => ({
      approverId: index + 10,
      createdAt: new Date(),
      approver: { id: index + 10, name: `Approver ${index + 1}` },
    })),
    votes: [],
  };
}

describe("/api/constitution/proposals/[id]/schedule route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConstitutionActorFromRequest.mockResolvedValue({
      authLevel: { isPrimary: true },
      user: { id: 2, name: "Primary", email: "primary@g.rit.edu" },
    });
    mockGetCurrentConstitutionDocument.mockResolvedValue({
      markdown: "# Article II\nOld\n",
      html: "",
      sha: "sha-1",
      headings: [],
      flatSections: [],
    });
    mockOfficerCount.mockResolvedValue(3);
    mockGetViewerPrimaryOfficerSlots.mockResolvedValue([]);
  });

  it("requires majority quorum before scheduling", async () => {
    mockConstitutionProposalFindUnique.mockResolvedValue(buildProposal("sha-1", 1));

    const res = await PUT(
      new Request("http://localhost/api/constitution/proposals/5/schedule", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          electionStartsAt: "2099-01-01T12:00:00.000Z",
          electionEndsAt: "2099-01-02T12:00:00.000Z",
        }),
      }) as any,
      { params: Promise.resolve({ id: "5" }) }
    );

    expect(res.status).toBe(409);
    expect(mockConstitutionProposalUpdate).not.toHaveBeenCalled();
  });

  it("marks stale proposals when upstream sha changed", async () => {
    mockConstitutionProposalFindUnique.mockResolvedValue(buildProposal("sha-old", 2));

    const res = await PUT(
      new Request("http://localhost/api/constitution/proposals/5/schedule", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          electionStartsAt: "2099-01-01T12:00:00.000Z",
          electionEndsAt: "2099-01-02T12:00:00.000Z",
        }),
      }) as any,
      { params: Promise.resolve({ id: "5" }) }
    );

    expect(res.status).toBe(409);
    expect(mockConstitutionProposalUpdate).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { status: ConstitutionProposalStatus.STALE },
    });
  });
});
