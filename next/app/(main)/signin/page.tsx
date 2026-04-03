import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isGoogleAuthConfigured } from "@/lib/authConfig";
import { DevSignInForm } from "./DevSignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl && params.callbackUrl.startsWith("/")
      ? params.callbackUrl
      : "/";

  if (session) {
    redirect(callbackUrl);
  }

  if (isGoogleAuthConfigured()) {
    redirect(
      `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl grow items-center justify-center px-4 py-20">
      <div className="w-full rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Sign In Required</h1>
        <p className="mt-3 text-muted-foreground">
          Google OAuth is not configured in this local server session, so dev
          sign-in is enabled instead.
        </p>
        <DevSignInForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
