"use server"

import prisma from "../prisma";

const public_members_url = "https://api.github.com/orgs/rit-sse/public_members";

export interface SimpleUser {
    name: string;
    gitHub: string | null;
}

export async function getSSEMembers(): Promise<SimpleUser[]> {
    const response = await fetch(public_members_url);
    const publicMembers = await response.json();
    const users: SimpleUser[] = await prisma.user.findMany({
        where: {
            gitHub: {not: null}
        },
        select: {
            name: true,
            gitHub: true,
        }
    });
    let finalUsers: SimpleUser[] = [];
    for (var member of publicMembers) {
        for (var user of users) {
            if (user.gitHub?.endsWith(member.login)) {
                finalUsers.push(user);
                break;
            }
        }
    }
    return finalUsers ;
}