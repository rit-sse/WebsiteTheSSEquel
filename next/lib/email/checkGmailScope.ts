import prisma from "@/lib/prisma";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

/**
 * Check if a user has granted the gmail.send OAuth scope
 * 
 * @param userId - The user's database ID
 * @returns true if the user has the gmail.send scope, false otherwise
 */
export async function hasGmailScope(userId: number): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: { 
      userId, 
      provider: "google" 
    },
    select: { 
      scope: true 
    },
  });
  
  return account?.scope?.includes(GMAIL_SEND_SCOPE) ?? false;
}

/**
 * Check if a user has the necessary setup for Gmail API email sending
 * This includes having both the scope and a refresh token
 * 
 * @param userId - The user's database ID
 * @returns Object with hasScope and hasRefreshToken flags
 */
export async function checkGmailSetup(userId: number): Promise<{
  hasScope: boolean;
  hasRefreshToken: boolean;
  isReady: boolean;
}> {
  const account = await prisma.account.findFirst({
    where: { 
      userId, 
      provider: "google" 
    },
    select: { 
      scope: true,
      refresh_token: true,
    },
  });
  
  const hasScope = account?.scope?.includes(GMAIL_SEND_SCOPE) ?? false;
  const hasRefreshToken = !!account?.refresh_token;
  
  return {
    hasScope,
    hasRefreshToken,
    isReady: hasScope && hasRefreshToken,
  };
}

export { GMAIL_SEND_SCOPE };
