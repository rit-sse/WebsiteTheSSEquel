import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetElectionWithRelations,
  mockGetGatewayAuthLevel,
  mockCanManageElections,
  mockElectionFindMany,
} = vi.hoisted(() => ({
  mockGetElectionWithRelations: vi.fn(),
  mockGetGatewayAuthLevel: vi.fn(),
  mockCanManageElections: vi.fn(),
  mockElectionFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: { election: { findMany: mockElectionFindMany } },
}));
vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: () => "resolved-image",
}));
vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));
vi.mock("@/lib/seAdmin", () => ({
  canManageElections: mockCanManageElections,
}));
vi.mock("@/lib/elections", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/elections")>()),
  getElectionWithRelations: mockGetElectionWithRelations,
}));

import { toPublicElectionView } from "@/lib/elections";
import { GET as getElection } from "@/app/api/elections/[id]/route";
import { GET as getNominations } from "@/app/api/elections/[id]/nominations/route";
import { GET as listElections } from "@/app/api/elections/route";

const user = (id: number) => ({
  id,
  name: `User ${id}`,
  email: `user${id}@g.rit.edu`,
});

function election() {
  return {
    id: 3,
    title: "Fall election",
    slug: "fall",
    status: "CERTIFIED",
    createdBy: user(90),
    certifiedBy: user(91),
    approvals: [{ id: 1, stage: "CONFIG", userId: 90, user: user(90) }],
    offices: [
      {
        id: 10,
        officerPosition: {
          id: 1,
          title: "President",
          is_primary: true,
          email: "president@sse.rit.edu",
        },
        nominations: [
          {
            id: 100,
            nomineeUserId: 1,
            nominee: user(1),
            nominator: user(2),
            statement: "Vote for me",
            status: "ACCEPTED",
            isOnCoop: false,
            reviewNotes: "Confirmed GPA",
            reviewedById: 90,
            reviewedBy: user(90),
            runningMateInvitation: {
              inviteeUserId: 4,
              invitee: user(4),
              statement: "Running mate statement",
              isOnCampus: false,
              declineReason: "Busy",
            },
          },
          {
            id: 101,
            nomineeUserId: 2,
            nominee: user(2),
            nominator: user(1),
            statement: "",
            status: "ACCEPTED",
            isOnCoop: true,
            reviewNotes: "On co-op in spring",
            reviewedById: 90,
            reviewedBy: user(90),
            runningMateInvitation: null,
          },
        ],
      },
    ],
    ballots: [
      {
        id: 500,
        voterId: 1,
        voter: user(1),
        rankings: [{ nominationId: 101, rank: 1 }],
      },
      {
        id: 501,
        voterId: 2,
        voter: user(2),
        rankings: [{ nominationId: 100, rank: 1 }],
      },
    ],
    emailLogs: [{ id: 1, sentBy: user(90), subject: "Vote now" }],
  };
}

const ANONYMOUS = { userId: null, isUser: false, isSeAdmin: false };
const VOTER = { userId: 2, isUser: true, isSeAdmin: false };
const ADMIN = { userId: 90, isUser: true, isSeAdmin: true };

const params = { params: Promise.resolve({ id: "3" }) };
const request = () => new Request("http://localhost/api/elections/3");

describe("toPublicElectionView", () => {
  it("removes voter identities and rankings, keeping only the viewer's own ballot id", () => {
    const view = toPublicElectionView(election(), 2);
    expect(view.ballots).toEqual([
      { id: 500, voterId: null },
      { id: 501, voterId: 2 },
    ]);
  });

  it("hides every ballot's voter from anonymous viewers", () => {
    const view = toPublicElectionView(election(), null);
    expect(view.ballots.every((ballot) => ballot.voterId === null)).toBe(true);
  });

  it("drops email logs and user emails but keeps role emails", () => {
    const serialized = JSON.stringify(toPublicElectionView(election(), null));
    expect(serialized).not.toMatch(/user\d+@g\.rit\.edu/);
    expect(serialized).toContain("president@sse.rit.edu");
    expect(toPublicElectionView(election(), null).emailLogs).toEqual([]);
  });

  it("keeps eligibility answers and review notes only on the viewer's own nomination", () => {
    const [someoneElses, viewersOwn] = toPublicElectionView(election(), 2)
      .offices[0].nominations as any[];
    expect(someoneElses.reviewNotes).toBeUndefined();
    expect(someoneElses.isOnCoop).toBeUndefined();
    expect(someoneElses.statement).toBe("Vote for me");
    expect(viewersOwn.reviewNotes).toBe("On co-op in spring");
    expect(viewersOwn.isOnCoop).toBe(true);
  });

  it("shows running-mate decline reasons and eligibility answers only to the people involved", () => {
    const invitation = (viewer: number | null) =>
      (
        toPublicElectionView(election(), viewer).offices[0]
          .nominations[0] as any
      ).runningMateInvitation;
    expect(invitation(null).declineReason).toBeUndefined();
    expect(invitation(null).isOnCampus).toBeUndefined();
    expect(invitation(null).statement).toBe("Running mate statement");
    expect(invitation(4).declineReason).toBe("Busy");
    expect(invitation(4).isOnCampus).toBe(false);
    expect(invitation(1).declineReason).toBe("Busy");
    expect(invitation(1).isOnCampus).toBe(false);
  });

  it("does not modify the input", () => {
    const input = election();
    toPublicElectionView(input, null);
    expect(input).toEqual(election());
  });
});

describe("GET /api/elections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetElectionWithRelations.mockResolvedValue(election());
    mockCanManageElections.mockImplementation(
      async (auth: { isSeAdmin: boolean }) => auth.isSeAdmin
    );
  });

  it.each([
    ["anonymous", ANONYMOUS],
    ["a signed-in voter", VOTER],
  ])("redacts ballots and emails for %s", async (_label, auth) => {
    mockGetGatewayAuthLevel.mockResolvedValue(auth);
    const res = await getElection(request(), params);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain("rankings");
    expect(text).not.toMatch(/user\d+@g\.rit\.edu/);
    expect(JSON.parse(text).ballots).toHaveLength(2);
  });

  it("returns the full election to election admins", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue(ADMIN);
    const res = await getElection(request(), params);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.ballots[0].voter.email).toBe("user1@g.rit.edu");
    expect(body.ballots[0].rankings).toHaveLength(1);
  });
});

describe("GET /api/elections/[id]/nominations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetElectionWithRelations.mockResolvedValue(election());
    mockCanManageElections.mockImplementation(
      async (auth: { isSeAdmin: boolean }) => auth.isSeAdmin
    );
  });

  it("redacts emails and review notes for anonymous callers", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue(ANONYMOUS);
    const res = await getNominations(request(), params);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toMatch(/user\d+@g\.rit\.edu/);
    expect(text).not.toContain("reviewNotes");
    expect(JSON.parse(text)).toHaveLength(2);
  });

  it("returns full nominations to election admins", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue(ADMIN);
    const res = await getNominations(request(), params);
    const body = await res.json();
    expect(body[1].reviewNotes).toBe("On co-op in spring");
    expect(body[0].nominee.email).toBe("user1@g.rit.edu");
  });
});

describe("GET /api/elections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElectionFindMany.mockResolvedValue([
      { id: 3, createdBy: user(90), certifiedBy: user(91), offices: [] },
    ]);
    mockCanManageElections.mockImplementation(
      async (auth: { isSeAdmin: boolean }) => auth.isSeAdmin
    );
  });

  it("hides creator and certifier emails from non-admins", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue(ANONYMOUS);
    const res = await listElections(
      new Request("http://localhost/api/elections")
    );
    const [item] = await res.json();
    expect(item.createdBy).toEqual({ id: 90, name: "User 90" });
    expect(item.certifiedBy.email).toBeUndefined();
  });

  it("keeps emails for election admins", async () => {
    mockGetGatewayAuthLevel.mockResolvedValue(ADMIN);
    const res = await listElections(
      new Request("http://localhost/api/elections")
    );
    const [item] = await res.json();
    expect(item.createdBy.email).toBe("user90@g.rit.edu");
  });
});
