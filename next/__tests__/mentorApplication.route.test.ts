import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetServerSession,
  mockGetGatewayAuthLevel,
  mockResolveUserImage,
  mockUserFindUnique,
  mockMentorApplicationFindMany,
  mockMentorApplicationFindUnique,
  mockMentorApplicationCreate,
  mockMentorApplicationUpdate,
  mockMentorSemesterFindUnique,
  mockTransaction,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockGetGatewayAuthLevel: vi.fn(),
  mockResolveUserImage: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockMentorApplicationFindMany: vi.fn(),
  mockMentorApplicationFindUnique: vi.fn(),
  mockMentorApplicationCreate: vi.fn(),
  mockMentorApplicationUpdate: vi.fn(),
  mockMentorSemesterFindUnique: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("next-auth/next", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/authGateway", () => ({
  getGatewayAuthLevel: mockGetGatewayAuthLevel,
}));

vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));

vi.mock("@/lib/s3Utils", () => ({
  resolveUserImage: mockResolveUserImage,
  getKeyFromS3Url: vi.fn(),
  isS3Key: vi.fn(),
  normalizeToS3Key: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mockUserFindUnique,
    },
    mentorApplication: {
      findMany: mockMentorApplicationFindMany,
      findUnique: mockMentorApplicationFindUnique,
      create: mockMentorApplicationCreate,
      update: mockMentorApplicationUpdate,
    },
    mentorSemester: {
      findUnique: mockMentorSemesterFindUnique,
    },
    $transaction: mockTransaction,
  },
}));

import { DELETE, GET, POST, PUT } from "@/app/api/mentor-application/route";

function req(url: string, method = "GET", body?: unknown) {
  return {
    method,
    nextUrl: new URL(url),
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

describe("/api/mentor-application route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveUserImage.mockReturnValue("resolved-image");
    mockGetGatewayAuthLevel.mockResolvedValue({
      isMentoringHead: false,
      isPrimary: false,
    });
    mockGetServerSession.mockResolvedValue(null);
  });

  it("GET my=true requires auth", async () => {
    const res = await GET(
      req("http://localhost/api/mentor-application?my=true")
    );
    expect(res.status).toBe(401);
  });

  it("GET id denies access when user is not owner and cannot manage", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "viewer@g.rit.edu" },
    });
    mockUserFindUnique.mockResolvedValue({ id: 99, email: "viewer@g.rit.edu" });
    mockMentorApplicationFindUnique.mockResolvedValue({
      id: 1,
      userId: 44,
      user: {
        id: 44,
        name: "Applicant",
        profileImageKey: null,
        googleImageURL: null,
      },
      semester: { id: 2, name: "Spring" },
    });

    const res = await GET(req("http://localhost/api/mentor-application?id=1"));
    expect(res.status).toBe(403);
  });

  it("POST requires sign-in", async () => {
    const res = await POST(
      req("http://localhost/api/mentor-application", "POST", {})
    );
    expect(res.status).toBe(401);
  });

  it("POST returns 404 when semester does not exist", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "applicant@g.rit.edu" },
    });
    mockUserFindUnique.mockResolvedValue({
      id: 1,
      email: "applicant@g.rit.edu",
    });
    mockMentorSemesterFindUnique.mockResolvedValue(null);

    const res = await POST(
      req("http://localhost/api/mentor-application", "POST", {
        semesterId: 100,
        discordUsername: "name",
        pronouns: "they/them",
        major: "SE",
        yearLevel: "3rd",
        whyMentor: "help",
      })
    );

    expect(res.status).toBe(404);
  });

  it("PUT denies non-managers", async () => {
    const res = await PUT(
      req("http://localhost/api/mentor-application", "PUT", {
        id: 1,
        status: "approved",
      })
    );
    expect(res.status).toBe(403);
  });

  it("DELETE rejects when application id is missing", async () => {
    const res = await DELETE(
      req("http://localhost/api/mentor-application", "DELETE", {})
    );
    expect(res.status).toBe(400);
  });
});
