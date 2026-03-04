import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, PrismaClientMock } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  PrismaClientMock: vi.fn(function PrismaClientMockImpl(this: unknown) {
    return {
      mentor: {
        findMany: mockFindMany,
      },
    };
  }),
}));

vi.mock("@prisma/client", () => {
  return {
    PrismaClient: PrismaClientMock,
  };
});

import { GET } from "../app/api/mentor/route";

describe("Mentor API Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/mentor returns list of mentors", async () => {
    const mockMentors = [
      {
        id: 1,
        isActive: true,
        expirationDate: new Date("2025-12-31T00:00:00.000Z"),
        user: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          profileImageKey: null,
          googleImageURL: "https://example.com/john.png",
          description: "Mentor",
          linkedIn: "john-linkedin",
          gitHub: "john-github",
        },
      },
      {
        id: 2,
        isActive: false,
        expirationDate: new Date("2024-06-30T00:00:00.000Z"),
        user: {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          profileImageKey: null,
          googleImageURL: null,
          description: "Mentor",
          linkedIn: "jane-linkedin",
          gitHub: "jane-github",
        },
      },
    ];

    mockFindMany.mockResolvedValue(mockMentors);

    const request = {
      nextUrl: new URL("http://localhost:3000/api/mentor"),
    } as any;
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual(
      expect.objectContaining({
        id: 1,
        isActive: true,
        applicationCourseCount: 0,
        latestMentorApplication: null,
        user: expect.objectContaining({
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          image: "https://example.com/john.png",
        }),
      })
    );
  });

  it("GET /api/mentor returns empty array when no mentors exist", async () => {
    mockFindMany.mockResolvedValue([]);

    const request = {
      nextUrl: new URL("http://localhost:3000/api/mentor"),
    } as any;
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });
});
