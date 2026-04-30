"use client";

import { motion } from "motion/react";
import styles from "./nominate.module.scss";

interface BallotHeroProps {
  ballotNo: string;
  termLabel: string;
  closesAt: Date | null;
  numSeats: number;
}

const headlineWords = [
  { text: "Nominate", accent: false },
  { text: "the", accent: false },
  { text: "Next", accent: false },
  { text: "Officers", accent: true },
];

function daysUntil(date: Date): number {
  const now = new Date();
  const ms = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function BallotHero({
  ballotNo,
  termLabel,
  closesAt,
  numSeats,
}: BallotHeroProps) {
  const days = closesAt ? daysUntil(closesAt) : null;

  return (
    <header className={styles.hero}>
      <div>
        <motion.span
          className={styles.heroEyebrow}
          initial={{ opacity: 0, y: -16, rotate: -8 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 16,
            delay: 0.1,
          }}
        >
          <span className={styles.heroEyebrowDot} aria-hidden />
          BALLOT NO. {ballotNo}
        </motion.span>

        <h1 className={styles.heroHeadline}>
          {headlineWords.map((w, idx) => (
            <motion.span
              key={idx}
              className={`${styles.heroHeadlineWord} ${
                w.accent ? styles.heroAccent : ""
              }`}
              initial={{ opacity: 0, y: "100%", rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2 + idx * 0.08,
              }}
            >
              {w.text}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className={styles.heroSub}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {numSeats === 1 ? "One seat." : `${numSeats} seats.`} One ballot.{" "}
          {days !== null
            ? days === 0
              ? "Closing today."
              : days === 1
                ? "One day left."
                : `${days} days to weigh in.`
            : "Lend your voice."}{" "}
          The next chapter of <em>{termLabel}</em> is yours to shape.
        </motion.p>
      </div>

      <motion.aside
        className={styles.heroSide}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 22,
          delay: 0.45,
        }}
      >
        <h3>Ballot Stub</h3>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "0.4rem 0.85rem",
            fontFamily: "var(--font-mono-stub), ui-monospace, monospace",
            fontSize: "0.78rem",
            letterSpacing: "0.06em",
            margin: 0,
          }}
        >
          <dt style={{ color: "var(--ink-mid)" }}>TERM</dt>
          <dd style={{ margin: 0, fontWeight: 700 }}>{termLabel.toUpperCase()}</dd>
          <dt style={{ color: "var(--ink-mid)" }}>SEATS</dt>
          <dd style={{ margin: 0, fontWeight: 700 }}>{numSeats}</dd>
          <dt style={{ color: "var(--ink-mid)" }}>CLOSES IN</dt>
          <dd style={{ margin: 0, fontWeight: 700 }}>
            {days !== null ? `${days} DAY${days === 1 ? "" : "S"}` : "—"}
          </dd>
          <dt style={{ color: "var(--ink-mid)" }}>METHOD</dt>
          <dd style={{ margin: 0, fontWeight: 700 }}>RANKED CHOICE</dd>
        </dl>

        <svg
          className={styles.heroStamp}
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--riso-red)"
            strokeWidth="4"
            strokeDasharray="6 3"
            opacity="0.85"
          />
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke="var(--riso-red)"
            strokeWidth="2"
            opacity="0.85"
          />
          <text
            x="50"
            y="46"
            fontFamily="var(--font-display), sans-serif"
            fontWeight="900"
            fontSize="14"
            textAnchor="middle"
            fill="var(--riso-red)"
            opacity="0.85"
          >
            OFFICIAL
          </text>
          <text
            x="50"
            y="60"
            fontFamily="var(--font-display), sans-serif"
            fontWeight="900"
            fontSize="9"
            textAnchor="middle"
            fill="var(--riso-red)"
            opacity="0.85"
          >
            SSE BALLOT
          </text>
        </svg>
      </motion.aside>
    </header>
  );
}
