import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConstitutionProposalStatus } from "@prisma/client";

const {
  mockGetConstitutionActorFromRequest,
  mockGetViewerPrimaryOfficerSlots,
  mockGetCurrentConstitutionDocument,
  mockCommitConstitutionMarkdownToGitHub,
  mockConstitutionProposalFindUnique,
  mockConstitutionProposalUpdate,
  mockOfficerCount,
} = vi.hoisted(() => ({
  mockGetConstitutionActorFromRequest: vi.fn(),
  mockGetViewerPrimaryOfficerSlots: vi.fn(),
  mockGetCurrentConstitutionDocument: vi.fn(),
  mockCommitConstitutionMarkdownToGitHub: vi.fn(),
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

vi.mock("@/lib/constitution/github", () => ({
  commitConstitutionMarkdownToGitHub: mockCommitConstitutionMarkdownToGitHub,
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

import { POST } from "@/app/api/constitution/proposals/[id]/apply/route";

function buildPassedProposal() {
  return {
    id: 11,
    title: "Amend Article IV",
    summary: "Passed proposal",
    rationale: "Approved by voters",
    status: ConstitutionProposalStatus.SCHEDULED,
    authorId: 4,
    baseRepoOwner: "rit-sse",
    baseRepoName: "governing-docs",
    baseBranch: "main",
    basePath: "constitution.md",
    baseDocumentSha: "sha-1",
    baseMarkdown: "# Article IV\nOld\n",
    sectionHeadingPath: "Article IV",
    proposedSectionMarkdown: "# Article IV\nNew\n",
    fullProposedMarkdown: "# Article IV\nNew\n",
    unifiedDiff: "@@",
    electionStartsAt: new Date("2026-01-01T00:00:00.000Z"),
    electionEndsAt: new Date("2026-01-02T00:00:00.000Z"),
    submittedAt: new Date(),
    appliedAt: null,
    appliedCommitSha: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: 4, name: "Author", email: "author@g.rit.edu" },
    primaryApprovals: [],
    votes: [
      { voterId: 1, choice: "YES", createdAt: new Date(), updatedAt: new Date() },
      { voterId: 2, choice: "YES", createdAt: new Date(), updatedAt: new Date() },
      { voterId: 3, choice: "NO", createdAt: new Date(), updatedAt: new Date() },
    ],
  };
}

describe("/api/constitution/proposals/[id]/apply route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentConstitutionDocument.mockResolvedValue({
      markdown: "# Article IV\nOld\n",
      html: "",
      sha: "sha-1",
      headings: [],
      flatSections: [],
    });
    mockOfficerCount.mockResolvedValue(3);
    mockGetViewerPrimaryOfficerSlots.mockResolvedValue([]);
  });

  it("rejects non-presidents", async () => {
    mockGetConstitutionActorFromRequest.mockResolvedValue({
      authLevel: { isPresident: false },
    });

    const res = await POST(
      new Request("http://localhost/api/constitution/proposals/11/apply", {
        method: "POST",
      }) as any,
      { params: Promise.resolve({ id: "11" }) }
    );

    expect(res.status).toBe(403);
  });

  it("pushes a passed proposal to governing-docs main", async () => {
    mockGetConstitutionActorFromRequest.mockResolvedValue({
      authLevel: {
        userId: 99,
        isMember: false,
        isPrimary: true,
        isPresident: true,
      },
    });
    mockConstitutionProposalFindUnique.mockResolvedValue(buildPassedProposal());
    mockCommitConstitutionMarkdownToGitHub.mockResolvedValue({
      commitSha: "commit-123",
      contentSha: "sha-2",
    });
    mockConstitutionProposalUpdate.mockResolvedValue({
      ...buildPassedProposal(),
      status: ConstitutionProposalStatus.APPLIED,
      appliedAt: new Date("2026-01-03T00:00:00.000Z"),
      appliedCommitSha: "commit-123",
    });

    const res = await POST(
      new Request("http://localhost/api/constitution/proposals/11/apply", {
        method: "POST",
      }) as any,
      { params: Promise.resolve({ id: "11" }) }
    );

    expect(res.status).toBe(200);
    expect(mockCommitConstitutionMarkdownToGitHub).toHaveBeenCalledWith({
      nextMarkdown: "# Article IV\nNew\n",
      expectedSha: "sha-1",
      commitMessage: "Apply constitution amendment #11: Amend Article IV",
    });

    const body = await res.json();
    expect(body.computedStatus).toBe("APPLIED");
    expect(body.appliedCommitSha).toBe("commit-123");
  });
});
