"use server"

import prisma from "../prisma";
import { getPublicS3Url } from "../s3Utils";

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
const sse_sites = [
    "WebsiteTheSSEquel",
    "OneRepoToRuleThemAll"
]

export async function getSSEMembers(): Promise<SimpleUser[]> {
    if (finalUsers.length != 0) {
        return finalUsers;
    }

    var publicMembers = new Set<string>();
    for (const repo of sse_sites) {
        const repo_url = `https://api.github.com/repos/rit-sse/${repo}/contributors`;
        const response = await fetch(repo_url);
        await response.json().then(json => {
            for (const member of json) {
                publicMembers.add(member.login);
            }
        });
    }
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
    for (const user of users) {
        if ( user.gitHub && publicMembers.has(user.gitHub)) {
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
        }
    }
    return finalUsers;
}