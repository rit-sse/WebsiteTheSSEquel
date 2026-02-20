"use server"

import prisma from "../prisma";

const public_members_url = "https://api.github.com/orgs/rit-sse/public_members";

export interface SimpleUser {
    id: number;
    name: string;
    gitHub: string | null;
    linkedIn: string | null;
    email: string;
}

var finalUsers: SimpleUser[] = [] ;

export async function getSSEMembers(): Promise<SimpleUser[]> {
    if (finalUsers.length != 0) {
        return finalUsers;
    }

    const response = await fetch(public_members_url);
    const publicMembers = await response.json();
    const users: SimpleUser[] = await prisma.user.findMany({
        where: {
            gitHub: {not: null}
        },
        select: {
            id: true,
            name: true,
            linkedIn: true,
            gitHub: true,
            email: true,
        }
    });
    
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