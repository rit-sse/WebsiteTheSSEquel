import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetActorFromRequest,
  mockComputeVoteSummary,
  mockGetActiveMemberCount,
  mockCreateAmendmentPR,
  mockFetchConstitutionSnapshot,
  mockAmendmentCreate,
  mockAmendmentFindUnique,
  mockAmendmentUpdate,
  mockAmendmentVoteFindMany,
  mockOfficerPositionCount,
} = vi.hoisted(() => ({
  mockGetActorFromRequest: vi.fn(),
  mockComputeVoteSummary: vi.fn(),
  mockGetActiveMemberCount: vi.fn(),
  mockCreateAmendmentPR: vi.fn(),
  mockFetchConstitutionSnapshot: vi.fn(),
  mockAmendmentCreate: vi.fn(),
  mockAmendmentFindUnique: vi.fn(),
  mockAmendmentUpdate: vi.fn(),
  mockAmendmentVoteFindMany: vi.fn(),
  mockOfficerPositionCount: vi.fn(),
}));

vi.mock("@/lib/services/amendmentService", () => ({
  getActorFromRequest: mockGetActorFromRequest,
  computeVoteSummary: mockComputeVoteSummary,
  getActiveMemberCount: mockGetActiveMemberCount,
  getActivePrimaryOfficerCount: vi.fn(),
  computePrimaryReviewResult: vi.fn(),
}));

vi.mock("@/lib/services/githubAmendmentService", () => ({
  buildAmendmentBranchName: vi.fn(() => "amendment-55-retry-branch"),
  createAmendmentPR: mockCreateAmendmentPR,
  fetchConstitutionSnapshot: mockFetchConstitutionSnapshot,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    amendment: {
      create: mockAmendmentCreate,
      findUnique: mockAmendmentFindUnique,
      update: mockAmendmentUpdate,
    },
    amendmentVote: {
      findMany: mockAmendmentVoteFindMany,
    },
    officerPosition: {
      count: mockOfficerPositionCount,
    },
  },
}));

import { POST } from "@/app/api/amendments/route";
import { PATCH } from "@/app/api/amendments/[id]/route";
import { POST as resubmitPOST } from "@/app/api/amendments/[id]/resubmit-pr/route";

describe("/api/amendments routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActorFromRequest.mockResolvedValue({
      id: 7,
      isMember: true,
      isPrimary: true,
      isSeAdmin: false,
    });
    mockComputeVoteSummary.mockReturnValue({
      totalVotes: 0,
      approveVotes: 0,
      rejectVotes: 0,
    });
    mockGetActiveMemberCount.mockResolvedValue(30);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("POST persists the client baseline when GitHub snapshot creation fails", async () => {
    mockFetchConstitutionSnapshot.mockRejectedValue(
      new Error("github offline"),
    );
    mockCreateAmendmentPR.mockRejectedValue(new Error("pr create failed"));
    mockAmendmentCreate.mockResolvedValue({ id: 42 });
    mockAmendmentFindUnique.mockResolvedValue({
      id: 42,
      title: "Presidential Running Mate Appointment",
      status: "PRIMARY_REVIEW",
      githubPrNumber: null,
      githubBranch: null,
    });

    const res = await POST(
      new Request("http://localhost/api/amendments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Presidential Running Mate Appointment",
          description: "Adds a VP appointment flow.",
          originalContent: "# SSE Constitution\n\nCurrent text",
          proposedContent: "# SSE Constitution\n\nUpdated text",
          isSemanticChange: true,
        }),
      }) as any,
    );

    expect(res.status).toBe(201);
    expect(mockAmendmentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        originalContent: "# SSE Constitution\n\nCurrent text",
        proposedContent: "# SSE Constitution\n\nUpdated text",
      }),
    });
  });

  it("PATCH allows primary officers to edit the voting window while voting is live", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T16:30:00.000Z"));

    mockAmendmentFindUnique.mockResolvedValue({
      id: 12,
      status: "VOTING",
      authorId: 7,
      publishedAt: new Date("2026-04-15T12:00:00.000Z"),
      votingOpenedAt: new Date("2026-04-15T13:00:00.000Z"),
    });
    mockAmendmentUpdate.mockResolvedValue({
      id: 12,
      status: "VOTING",
    });

    const res = await PATCH(
      new Request("http://localhost/api/amendments/12", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "VOTING",
          votingDurationHours: 72,
          resetVotingWindowFromNow: true,
        }),
      }) as any,
      { params: Promise.resolve({ id: "12" }) },
    );

    expect(res.status).toBe(200);
    expect(mockAmendmentUpdate).toHaveBeenCalledWith({
      where: { id: 12 },
      data: expect.objectContaining({
        status: "VOTING",
        votingDurationHours: 72,
        votingClosedAt: null,
        votingEndsAt: new Date("2026-04-18T16:30:00.000Z"),
      }),
    });
  });

  it("POST can re-submit a missing amendment PR for the author", async () => {
    mockGetActorFromRequest.mockResolvedValue({
      id: 7,
      isMember: true,
      isPrimary: false,
      isSeAdmin: false,
    });
    mockAmendmentFindUnique.mockResolvedValue({
      id: 55,
      title: "Presidential Running Mate Appointment",
      description: "Adds a VP appointment flow.",
      proposedContent: "# SSE Constitution\n\nUpdated text",
      authorId: 7,
      githubPrNumber: null,
      status: "PRIMARY_REVIEW",
    });
    mockCreateAmendmentPR.mockResolvedValue({
      branch: "amendment-55-retry-branch",
      prNumber: 123,
      prUrl: "https://github.com/rit-sse/governing-docs/pull/123",
      originalContent: "# SSE Constitution\n\nCurrent text",
    });
    mockAmendmentUpdate.mockResolvedValue({
      id: 55,
      githubBranch: "amendment-55-retry-branch",
      githubPrNumber: 123,
      originalContent: "# SSE Constitution\n\nCurrent text",
    });

    const res = await resubmitPOST(
      new Request("http://localhost/api/amendments/55/resubmit-pr", {
        method: "POST",
      }) as any,
      { params: Promise.resolve({ id: "55" }) },
    );

    expect(res.status).toBe(200);
    expect(mockCreateAmendmentPR).toHaveBeenCalledWith({
      title: "Presidential Running Mate Appointment",
      description: "Adds a VP appointment flow.",
      proposedContent: "# SSE Constitution\n\nUpdated text",
      proposedBy: "Member #7",
      branchName: "amendment-55-retry-branch",
    });
    expect(mockAmendmentUpdate).toHaveBeenCalledWith({
      where: { id: 55 },
      data: {
        githubBranch: "amendment-55-retry-branch",
        githubPrNumber: 123,
        originalContent: "# SSE Constitution\n\nCurrent text",
      },
      select: {
        id: true,
        githubBranch: true,
        githubPrNumber: true,
        originalContent: true,
      },
    });
  });
});
