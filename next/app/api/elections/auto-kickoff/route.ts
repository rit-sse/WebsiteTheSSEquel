import { kickoffElectionForCurrentTerm } from "@/lib/electionAutoKickoff";

export const dynamic = "force-dynamic";

/**
 * Cron-secret guarded endpoint that auto-creates a fresh
 * NOMINATIONS_OPEN primary officer election when the system has
 * crossed into a new academic term and nothing is in flight.
 *
 * Hit this from Vercel Cron, GitHub Actions, or any external
 * scheduler. The request must include an `x-cron-secret` header
 * matching `process.env.CRON_SECRET`. If the env var is unset, the
 * endpoint refuses to run — auto-kickoff is gated, never anonymous.
 *
 * The page route at `/nominate` *also* triggers kickoff lazily on
 * load, so this endpoint is redundancy for environments without a
 * scheduler.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response(
      "Auto-kickoff is disabled (CRON_SECRET is not configured).",
      { status: 503 }
    );
  }

  const presented = request.headers.get("x-cron-secret");
  if (!presented || presented !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await kickoffElectionForCurrentTerm();
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Auto-kickoff failed",
      { status: 500 }
    );
  }
}

/**
 * GET is intentionally not implemented — kickoff is a write action
 * and must come through POST so it isn't accidentally fired by
 * crawlers or link-previewers.
 */
export async function GET() {
  return new Response("Use POST.", { status: 405 });
}
