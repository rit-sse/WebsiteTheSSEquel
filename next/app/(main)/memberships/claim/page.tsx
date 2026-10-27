"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function ClaimMembershipPage() {
  const { data: session, status } = useSession();
  const [signingIn, setSigningIn] = useState(false);

  function claim() {
    setSigningIn(true);
    const email = new URLSearchParams(window.location.search).get("email");
    void signIn(
      "google",
      { callbackUrl: "/memberships" },
      email ? { login_hint: email } : {}
    ).finally(() => setSigningIn(false));
  }

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-12">
      <h1 className="text-2xl font-semibold">Claim your SSE memberships</h1>
      <p className="text-muted-foreground">
        Sign in with the RIT Google account that received the invitation.
      </p>
      {session?.user?.email && (
        <p className="text-sm">Signed in as {session.user.email}.</p>
      )}
      <Button onClick={claim} disabled={status === "loading" || signingIn}>
        {signingIn ? "Opening Google..." : "Sign in to claim memberships"}
      </Button>
      <p>
        <a className="text-primary underline" href="/memberships">
          View membership leaderboard
        </a>
      </p>
    </section>
  );
}
