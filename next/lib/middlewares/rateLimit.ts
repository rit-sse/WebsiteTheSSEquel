import { NextRequest, NextResponse } from "next/server";

type RateLimitRule = {
  id: string;
  limit: number;
  windowMs: number;
  method?: string;
  pathname: RegExp;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;
// Hard cap to prevent unbounded growth if an attacker generates many unique keys.
// When the cap is reached we still prioritize pruning expired entries first.
const MAX_BUCKETS = 10_000;

function sweepBuckets(now: number) {
  // Remove expired buckets (safe: a new bucket will be created on the next request).
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  if (buckets.size <= MAX_BUCKETS) {
    return;
  }

  // If we're still above the cap, drop the oldest entries.
  const toRemove = buckets.size - MAX_BUCKETS;
  let removed = 0;
  for (const key of buckets.keys()) {
    buckets.delete(key);
    removed += 1;
    if (removed >= toRemove) {
      break;
    }
  }
}

function maybeSweepBuckets(now: number) {
  if (buckets.size === 0) {
    return;
  }

  if (buckets.size < MAX_BUCKETS && now - lastSweepAt < SWEEP_INTERVAL_MS) {
    return;
  }

  lastSweepAt = now;
  sweepBuckets(now);
}

const RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    id: "auth",
    limit: 10,
    windowMs: 60_000,
    pathname: /^\/api\/auth(?:\/|$)/,
  },
  {
    id: "quotes-post",
    limit: 5,
    windowMs: 60_000,
    method: "POST",
    pathname: /^\/api\/quotes$/,
  },
  {
    id: "mentor-application-post",
    limit: 3,
    windowMs: 3_600_000,
    method: "POST",
    pathname: /^\/api\/mentor-application$/,
  },
  {
    id: "alumni-requests-post",
    limit: 3,
    windowMs: 3_600_000,
    method: "POST",
    pathname: /^\/api\/alumni-requests$/,
  },
  {
    id: "email-send-post",
    limit: 5,
    windowMs: 60_000,
    method: "POST",
    pathname: /^\/api\/email\/send$/,
  },
];

// Intentionally in-memory for now. The current app is deployed as a standalone
// Next server and the repo has no Redis dependency; distributed rate limiting
// can be added later without changing the route matching contract here.
export function resolveClientIp(request: Pick<NextRequest, "headers">): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  return "unknown";
}

export function getRateLimitRule(
  request: Pick<NextRequest, "method" | "nextUrl">
) {
  return (
    RATE_LIMIT_RULES.find((rule) => {
      if (rule.method && rule.method !== request.method) {
        return false;
      }

      return rule.pathname.test(request.nextUrl.pathname);
    }) ?? null
  );
}

export function resetRateLimitBuckets() {
  buckets.clear();
}

export async function rateLimitMiddleware(request: NextRequest) {
  if (process.env.NODE_ENV === "test") {
    return NextResponse.next();
  }

  const rule = getRateLimitRule(request);
  if (!rule) {
    return NextResponse.next();
  }

  const now = Date.now();
  maybeSweepBuckets(now);
  const ip = resolveClientIp(request);
  const bucketKey = `${rule.id}:${ip}:${request.method}`;
  const existing = buckets.get(bucketKey);

  let bucket: RateLimitBucket;
  if (!existing || existing.resetAt <= now) {
    bucket = {
      count: 1,
      resetAt: now + rule.windowMs,
    };
  } else {
    bucket = {
      count: existing.count + 1,
      resetAt: existing.resetAt,
    };
  }

  buckets.set(bucketKey, bucket);

  if (bucket.count <= rule.limit) {
    return NextResponse.next();
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.resetAt - now) / 1000)
  );

  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
