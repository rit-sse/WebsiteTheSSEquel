import { beforeEach, describe, expect, it, vi } from "vitest";

const { claim } = vi.hoisted(() => ({ claim: vi.fn() }));
vi.mock("@next-auth/prisma-adapter", () => ({ PrismaAdapter: () => ({}) }));
vi.mock("@/lib/prisma", () => ({ default: {} }));
vi.mock("@/lib/s3Utils", () => ({ resolveUserImage: vi.fn() }));
vi.mock("@/lib/services/alumniCandidateService", () => ({
  maybeCreateAlumniCandidate: vi.fn(),
}));
vi.mock("@/lib/services/membershipAwardService", () => ({
  claimPendingMembershipAwards: claim,
}));

import { authOptions } from "@/lib/authOptions";
import type { GoogleProfile } from "next-auth/providers/google";
import type { OAuthConfig } from "next-auth/providers/oauth";

const verifiedSignIn = {
  user: { id: "42", email: "new@g.rit.edu" },
  account: { provider: "google" },
  profile: { email: "new@g.rit.edu", emailVerified: new Date() },
  isNewUser: true,
};

describe("membership claims after account creation", () => {
  beforeEach(() => vi.resetAllMocks());
  it.each([true, false])(
    "claims on completed Google sign-in, isNewUser=%s",
    async (isNewUser) => {
      await authOptions.events!.signIn!({
        ...verifiedSignIn,
        isNewUser,
      } as any);
      expect(claim).toHaveBeenCalledWith(42, "new@g.rit.edu");
    }
  );
  it.each([
    {
      ...verifiedSignIn,
      profile: { email: "new@g.rit.edu", emailVerified: null },
    },
    { ...verifiedSignIn, profile: { email: "new@g.rit.edu" } },
    {
      ...verifiedSignIn,
      profile: { email: "other@g.rit.edu", emailVerified: new Date() },
    },
    { ...verifiedSignIn, account: { provider: "other" } },
  ])(
    "does not claim without a matching verified Google identity",
    async (event) => {
      await authOptions.events!.signIn!(event as any);
      expect(claim).not.toHaveBeenCalled();
    }
  );
  it("allows sign-in to finish if claim processing fails, leaving credit for retry", async () => {
    claim.mockRejectedValue(new Error("database unavailable"));
    await expect(
      authOptions.events!.signIn!(verifiedSignIn as any)
    ).resolves.toBeUndefined();
  });
});

describe("Google profile verification mapping", () => {
  beforeEach(() => vi.resetAllMocks());
  const google = authOptions.providers.find(
    (provider) => provider.id === "google"
  ) as OAuthConfig<GoogleProfile>;
  const rawProfile = {
    sub: "google-user-42",
    name: "New Member",
    email: "new@g.rit.edu",
    picture: "https://example.com/avatar.png",
    email_verified: true,
  } as GoogleProfile;

  it("preserves verification through the provider mapper used by the sign-in event", async () => {
    const profile = await google.options!.profile!(rawProfile, {});
    expect(profile).toMatchObject({
      id: rawProfile.sub,
      email: rawProfile.email,
      emailVerified: expect.any(Date),
    });
    expect(profile).not.toHaveProperty("email_verified");
    await authOptions.events!.signIn!({ ...verifiedSignIn, profile } as any);
    expect(claim).toHaveBeenCalledWith(42, "new@g.rit.edu");
  });

  it.each([false, undefined])(
    "does not claim when Google's verification value is %s",
    async (email_verified) => {
      const profile = await google.options!.profile!(
        { ...rawProfile, email_verified } as GoogleProfile,
        {}
      );
      expect(profile).toMatchObject({ emailVerified: null });
      await authOptions.events!.signIn!({ ...verifiedSignIn, profile } as any);
      expect(claim).not.toHaveBeenCalled();
    }
  );
});
