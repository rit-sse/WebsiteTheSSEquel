"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Trophy, Home } from "lucide-react";
import DancingLetters from "@/components/common/DancingLetters";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import { NeoCard, NeoCardContent } from "@/components/ui/neo-card";
import { electionAvatarStyle } from "@/components/elections/electionAvatarColor";

/**
 * "Your new officers" reveal ceremony. A full-screen carousel that
 * announces each winner in turn — eyebrow label → dancing-letters
 * name → gradient avatar fading in → platform/bio fading in after the
 * letters settle. Ends with a summary slide that links to the stats
 * page.
 *
 * Navigation: Next / Prev buttons, ArrowRight/Space/Enter to advance,
 * ArrowLeft to back up. Progress dots at bottom center.
 */

export interface RevealSlide {
  officeTitle: string;
  winnerName: string;
  winnerUserId: number;
  winnerImage: string | null;
  statement: string;
  yearLevel: number | null;
  program: string | null;
  isTicketDerived: boolean;
}

interface Props {
  electionSlug: string;
  electionTitle: string;
  slides: RevealSlide[];
}

function getInitials(name: string): string {
  return (name || "??")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ElectionResultsReveal({
  electionSlug,
  electionTitle,
  slides,
}: Props) {
  // Total step count is announcement slides + 1 summary/CTA slide.
  const totalSteps = slides.length + 1;
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.max(0, Math.min(totalSteps - 1, i + delta)));
    },
    [totalSteps]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  const onFinalSlide = index === totalSteps - 1;
  const onLastAnnouncement = index === slides.length - 1;
  const current = index < slides.length ? slides[index] : null;

  return (
    <div className="election-scope fixed inset-0 z-40 overflow-y-auto bg-gradient-to-br from-background via-background to-muted">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12 md:px-12 md:py-20">
        {/* Top bar — exit link */}
        <div className="flex items-center justify-between">
          <Link
            href={`/elections/${electionSlug}`}
            className="inline-flex items-center gap-2 text-sm text-black hover:text-black/70 transition-colors"
          >
            <Home className="h-4 w-4" />
            {electionTitle}
          </Link>
          <div className="text-xs font-semibold uppercase tracking-widest text-black">
            {index + 1} / {totalSteps}
          </div>
        </div>

        {/* Slide area */}
        <div className="flex flex-1 items-center justify-center py-10">
          <AnimatePresence mode="wait">
            {current ? (
              <SlideAnnouncement key={`slide-${index}`} slide={current} />
            ) : (
              <SlideSummary
                key="summary"
                slides={slides}
                electionSlug={electionSlug}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Nav row */}
        <div className="flex flex-col items-center gap-4">
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 w-2 rounded-full border border-black transition-all ${
                  i === index ? "w-6 bg-primary" : "bg-surface-2"
                }`}
              />
            ))}
          </div>

          {/* Prev / Next */}
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-black hover:text-black/70 hover:bg-muted/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            {!onFinalSlide && (
              <NeoBrutalistButton
                text={onLastAnnouncement ? "Show me the numbers" : "Next"}
                variant={onLastAnnouncement ? "pink" : "blue"}
                size="sm"
                icon={<ArrowRight className="h-4 w-4" />}
                onClick={() => go(1)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Announcement slide — eyebrow, dancing name, avatar, bio                  */
/* ---------------------------------------------------------------------- */

function SlideAnnouncement({ slide }: { slide: RevealSlide }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <NeoCard depth={1}>
        <NeoCardContent className="flex flex-col items-center gap-8 px-6 py-10 text-center md:px-12 md:py-14">
          <p className="eyebrow text-sm !text-black">
            YOUR NEW {slide.officeTitle.toUpperCase()} IS
          </p>

          {/* Match the home-page HeroCTA's DancingLetters formatting verbatim
              — same sizes, weight, leading, tracking. Keep `!gap-[0.5em]` so
              first + last name stay visually separated. */}
          <DancingLetters
            text={slide.winnerName}
            className="justify-center flex-nowrap !gap-[0.5em]"
            letterClassName="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold !leading-none tracking-tight font-display text-primary"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="mt-2"
          >
            {slide.winnerImage ? (
              <div className="h-[140px] w-[140px] overflow-hidden rounded-full border-[3px] border-black shadow-[6px_6px_0_0_black]">
                <Image
                  src={slide.winnerImage}
                  alt={slide.winnerName}
                  width={140}
                  height={140}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="flex h-[140px] w-[140px] items-center justify-center rounded-full border-[3px] border-black font-display text-5xl font-bold shadow-[6px_6px_0_0_black]"
                style={electionAvatarStyle(slide.winnerUserId || slide.winnerName)}
              >
                {getInitials(slide.winnerName)}
              </div>
            )}
          </motion.div>

          {(slide.yearLevel || slide.program) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="font-display text-xl text-black"
            >
              {[slide.yearLevel ? `Year ${slide.yearLevel}` : null, slide.program]
                .filter(Boolean)
                .join(" · ")}
            </motion.p>
          )}

          {slide.statement && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="max-w-prose text-lg leading-relaxed text-black"
            >
              &ldquo;{slide.statement}&rdquo;
            </motion.p>
          )}
        </NeoCardContent>
      </NeoCard>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Summary / CTA slide — mini grid of all winners + View results CTA       */
/* ---------------------------------------------------------------------- */

function SlideSummary({
  slides,
  electionSlug,
}: {
  slides: RevealSlide[];
  electionSlug: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="flex w-full flex-col items-center gap-8 text-center"
    >
      <p className="eyebrow text-sm !text-black">Your new primary officers</p>
      <h2 className="font-display text-4xl font-bold text-black md:text-5xl">
        Congratulations to the SSE.
      </h2>

      <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
        {slides.map((s) => (
          <div
            key={`${s.officeTitle}-${s.winnerName}`}
            className="flex flex-col items-center gap-2"
          >
            {s.winnerImage ? (
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-black shadow-[3px_3px_0_0_black]">
                <Image
                  src={s.winnerImage}
                  alt={s.winnerName}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black font-display text-lg font-bold shadow-[3px_3px_0_0_black]"
                style={electionAvatarStyle(s.winnerUserId || s.winnerName)}
              >
                {getInitials(s.winnerName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-black">
                {s.officeTitle}
              </p>
              <p className="truncate font-display text-sm font-bold text-black">
                {s.winnerName}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <NeoBrutalistButton
          text="View results"
          variant="orange"
          icon={<Trophy className="h-[18px] w-[18px]" />}
          href={`/elections/${electionSlug}/results`}
        />
        <Link
          href={`/elections/${electionSlug}`}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-black hover:text-black/70 transition-colors"
        >
          Back to election
        </Link>
      </div>
    </motion.div>
  );
}
