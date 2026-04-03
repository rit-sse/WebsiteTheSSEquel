import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConstitutionProposalStatus } from "@prisma/client";

const {
  mockGetConstitutionActorFromRequest,
  mockGetViewerPrimaryOfficerSlots,
  mockGetCurrentConstitutionDocument,
  mockConstitutionProposalFindUnique,
  mockConstitutionProposalFindUniqueOrThrow,
  mockConstitutionProposalVoteUpsert,
  mockOfficerCount,
} = vi.hoisted(() => ({
  mockGetConstitutionActorFromRequest: vi.fn(),
  mockGetViewerPrimaryOfficerSlots: vi.fn(),
  mockGetCurrentConstitutionDocument: vi.fn(),
  mockConstitutionProposalFindUnique: vi.fn(),
  mockConstitutionProposalFindUniqueOrThrow: vi.fn(),
  mockConstitutionProposalVoteUpsert: vi.fn(),
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
      findUniqueOrThrow: mockConstitutionProposalFindUniqueOrThrow,
    },
    constitutionProposalVote: {
      upsert: mockConstitutionProposalVoteUpsert,
    },
    officer: {
      count: mockOfficerCount,
    },
  },
}));

import { PUT } from "@/app/api/constitution/proposals/[id]/vote/route";

function buildOpenProposal(votes: Array<{ voterId: number; choice: string }> = []) {
  return {
    id: 7,
    title: "Amend Article III",
    summary: "Voting proposal",
    rationale: "Need update",
    status: ConstitutionProposalStatus.SCHEDULED,
    authorId: 3,
    baseRepoOwner: "rit-sse",
    baseRepoName: "governing-docs",
    baseBranch: "main",
    basePath: "constitution.md",
    baseDocumentSha: "sha-1",
    baseMarkdown: "# Article III\nOld\n",
    sectionHeadingPath: "Article III",
    proposedSectionMarkdown: "# Article III\nNew\n",
    fullProposedMarkdown: "# Article III\nNew\n",
    unifiedDiff: "@@",
    electionStartsAt: new Date("2026-01-01T00:00:00.000Z"),
    electionEndsAt: new Date("2099-01-02T00:00:00.000Z"),
    submittedAt: new Date(),
    appliedAt: null,
    appliedCommitSha: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 3, name: "Author", email: "author@g.rit.edu" },
    primaryApprovals: [],
    votes: votes.map((vote) => ({
      ...vote,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
}

describe("/api/constitution/proposals/[id]/vote route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentConstitutionDocument.mockResolvedValue({
      markdown: "# Article III\nOld\n",
      html: "",
      sha: "sha-1",
      headings: [],
      flatSections: [],
    });
    mockOfficerCount.mockResolvedValue(0);
    mockGetViewerPrimaryOfficerSlots.mockResolvedValue([]);
  });

  it("rejects non-members", async () => {
    mockGetConstitutionActorFromRequest.mockResolvedValue({
      authLevel: { isMember: false },
      user: { id: 9, name: "Viewer", email: "viewer@g.rit.edu" },
    });

    const res = await PUT(
      new Request("http://localhost/api/constitution/proposals/7/vote", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ choice: "YES" }),
      }) as any,
      { params: Promise.resolve({ id: "7" }) }
    );

    expect(res.status).toBe(403);
  });

  it("upserts a member vote while the election is open", async () => {
    mockGetConstitutionActorFromRequest.mockResolvedValue({
      authLevel: {
        userId: 9,
        isMember: true,
        isPrimary: false,
        isPresident: false,
      },
      user: { id: 9, name: "Member", email: "member@g.rit.edu" },
    });
    mockConstitutionProposalFindUnique.mockResolvedValue(buildOpenProposal());
    mockConstitutionProposalFindUniqueOrThrow.mockResolvedValue(
      buildOpenProposal([{ voterId: 9, choice: "YES" }])
    );

    const res = await PUT(
      new Request("http://localhost/api/constitution/proposals/7/vote", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ choice: "YES" }),
      }) as any,
      { params: Promise.resolve({ id: "7" }) }
    );

    expect(res.status).toBe(200);
    expect(mockConstitutionProposalVoteUpsert).toHaveBeenCalledWith({
      where: {
        proposalId_voterId: {
          proposalId: 7,
          voterId: 9,
        },
      },
      update: {
        choice: "YES",
      },
      create: {
        proposalId: 7,
        voterId: 9,
        choice: "YES",
      },
    });

    const body = await res.json();
    expect(body.vote.viewerChoice).toBe("YES");
    expect(body.vote.resultsPublic).toBe(false);
  });
});
