import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockResolveUserImage } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockResolveUserImage: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: mockFindMany,
    },
  },
}));

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
  normalizeToS3Key: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));
vi.mock("@/lib/services/s3Service", () => ({
  s3Service: { deleteObject: vi.fn() },
}));
vi.mock("@/lib/services/profileCompletionService", () => ({
  maybeGrantProfileCompletionMembership: vi.fn(),
}));
vi.mock("@/lib/services/alumniCandidateService", () => ({
  maybeCreateAlumniCandidate: vi.fn(),
}));
vi.mock("@/lib/authGateway", () => ({ getGatewayAuthLevel: vi.fn() }));

import { GET, POST } from "@/app/api/user/route";

describe("/api/user route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
  });

  it("GET returns transformed user list with membership fields", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 1,
        name: "User A",
        email: "a@example.com",
        linkedIn: null,
        gitHub: null,
        description: null,
        graduationTerm: null,
        graduationYear: null,
        major: null,
        coopSummary: null,
        profileImageKey: null,
        googleImageURL: null,
        _count: { Memberships: 2 },
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0]).toMatchObject({
      id: 1,
      image: "resolved-image",
      membershipCount: 2,
      isMember: true,
    });
  });

  it("POST is disabled and returns 410", async () => {
    const res = await POST();
    expect(res.status).toBe(410);
  });
});
