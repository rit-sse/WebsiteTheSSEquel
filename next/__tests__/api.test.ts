import { GET } from '../app/api/mentor/route';

// Mock Prisma client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        mentor: {
            findMany: jest.fn(),
        },
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma),
    };
});

// Get the mocked Prisma instance
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

describe('Mentor API Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /api/mentor returns list of mentors', async () => {
        // Mock data that Prisma would return
        const mockMentors = [
            {
                id: 1,
                isActive: true,
                expirationDate: '2025-12-31T00:00:00.000Z',
                user: {
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                },
            },
            {
                id: 2,
                isActive: false,
                expirationDate: '2024-06-30T00:00:00.000Z',
                user: {
                    id: 2,
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                },
            },
        ];

        // Setup the mock to return our test data
        (prisma.mentor.findMany as jest.Mock).mockResolvedValue(mockMentors);

        // Call the route handler directly
        const response = await GET();

        // Verify the response
        expect(response.status).toBe(200);
        
        const body = await response.json();
        expect(body).toEqual(mockMentors);
        expect(body).toHaveLength(2);
        expect(body[0]).toEqual(expect.objectContaining({
            id: expect.any(Number),
            isActive: expect.any(Boolean),
            expirationDate: expect.any(String),
            user: expect.objectContaining({
                id: expect.any(Number),
                name: expect.any(String),
                email: expect.any(String),
            }),
        }));
    });

    it('GET /api/mentor returns empty array when no mentors exist', async () => {
        // Setup the mock to return empty array
        (prisma.mentor.findMany as jest.Mock).mockResolvedValue([]);

        const response = await GET();

        expect(response.status).toBe(200);
        
        const body = await response.json();
        expect(body).toEqual([]);
        expect(body).toHaveLength(0);
    });
});