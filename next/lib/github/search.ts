"use server"

import prisma from "../prisma";
import { getPublicS3Url } from "../s3Utils";

const public_members_url = "https://api.github.com/orgs/rit-sse/public_members";

export interface SimpleUser {
    id: number;
    name: string;
    gitHub: string | null;
    linkedIn: string | null;
    email: string;
    profileImageUrl: string | null;
    description: string | null;
    major: string | null;
    graduationTerm: string | null;
    graduationYear: number | null;
    officerTitle: string | null;
}

var finalUsers: SimpleUser[] = [];

export async function getSSEMembers(): Promise<SimpleUser[]> {
    if (finalUsers.length != 0) {
        return finalUsers;
    }

    const response = await fetch(public_members_url);
    const publicMembers = await response.json();
    const users = await prisma.user.findMany({
        where: {
            gitHub: { not: null }
        },
        select: {
            id: true,
            name: true,
            linkedIn: true,
            gitHub: true,
            email: true,
            profileImageKey: true,
            googleImageURL: true,
            description: true,
            major: true,
            graduationTerm: true,
            graduationYear: true,
            officers: {
                where: { is_active: true },
                select: { position: { select: { title: true } } },
                take: 1,
            },
        }
    });

    for (const member of publicMembers) {
        for (const user of users) {
            if (user.gitHub?.endsWith(member.login)) {
                finalUsers.push({
                    id: user.id,
                    name: user.name,
                    gitHub: user.gitHub,
                    linkedIn: user.linkedIn,
                    email: user.email,
                    profileImageUrl: user.profileImageKey
                        ? getPublicS3Url(user.profileImageKey)
                        : (user.googleImageURL ?? null),
                    description: user.description ?? null,
                    major: user.major ?? null,
                    graduationTerm: user.graduationTerm ?? null,
                    graduationYear: user.graduationYear ?? null,
                    officerTitle: user.officers[0]?.position?.title ?? null,
                });
                break;
            }
        }
    }
    return finalUsers;
}