import Link from "next/link";
import { Skull } from "lucide-react";

/**
 * Friendly placeholder for soft-deleted pages. Crawlers should ideally
 * see a 410, but the App Router doesn't surface a direct way to set
 * the HTTP status from a server component. As a compromise we render
 * a clear "this page was removed" message so humans aren't confused
 * by a generic 404.
 */
export function GoneNotice({ slug }: { slug: string }) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center">
      <Skull className="mb-6 h-14 w-14 text-muted-foreground" />
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        This page is gone.
      </h1>
      <p className="mt-3 text-muted-foreground">
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm">/{slug}</code>{" "}
        was removed by an officer. The link is preserved in case anyone
        bookmarked it.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1 rounded-lg border-2 border-border bg-categorical-orange px-5 py-2.5 font-display text-sm font-semibold neo:shadow-neo neo:hover:translate-x-[2px] neo:hover:translate-y-[2px] neo:hover:shadow-none"
      >
        Back to the homepage
      </Link>
    </section>
  );
}
