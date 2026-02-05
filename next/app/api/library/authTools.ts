import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'
export async function getAuth(authToken: string | null): Promise<{
    userId: number | null;
    isUser: boolean;
    isMember: boolean;
    membershipCount: number;
    isMentor: boolean;
    isOfficer: boolean;
}> {

    const authLevel: {
        userId: number | null;
        isUser: boolean;
        isMember: boolean;
        membershipCount: number;
        isMentor: boolean;
        isOfficer: boolean;
    } = {
        userId: null,
        isUser: false,
        isMember: false,
        membershipCount: 0,
        isMentor: false,
        isOfficer: false,
    };

    if (authToken == null) {
        return Promise.resolve(authLevel);
    }

    const user = await prisma.user.findFirst({
        where: {
            session: {
                some: {
                    sessionToken: authToken,
                },
            },
        },
        select: {
            id: true,
            mentor: {
                where: { isActive: true },
                select: { id: true },
            },
            officers: {
                where: { is_active: true },
                select: { id: true },
            },
            _count: {
                select: { Memberships: true },
            },
        },
    });

    if (user != null) {
        const membershipCount = user._count.Memberships;
        authLevel.userId = user.id;
        authLevel.isUser = true;
        authLevel.membershipCount = membershipCount;
        authLevel.isMember = membershipCount >= 1;
        authLevel.isMentor = user.mentor.length > 0;
        authLevel.isOfficer = user.officers.length > 0;
    } else {
        return Promise.resolve(authLevel);
    }
    return authLevel;
}