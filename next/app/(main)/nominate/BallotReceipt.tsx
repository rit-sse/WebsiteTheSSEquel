"use client";

import Link from "next/link";
import { motion } from "motion/react";
import styles from "./nominate.module.scss";

interface BallotReceiptProps {
  serialNumber: string;
  nominatorName: string;
  nomineeName: string;
  position: string;
  electionSlug: string;
  onNominateAnother: () => void;
}

/**
 * The screenshot moment. After a successful nomination POST the form
 * morphs into this paper receipt: serial number, names in display
 * type, "RECEIVED" rubber-stamp animating in, perforated tear-off
 * edge along the top (handled by the CSS mask).
 */
export default function BallotReceipt({
  serialNumber,
  nominatorName,
  nomineeName,
  position,
  electionSlug,
  onNominateAnother,
}: BallotReceiptProps) {
  return (
    <motion.div
      className={styles.receipt}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
    >
      <div className={styles.receiptHead}>Official Nomination Receipt</div>
      <div className={styles.receiptSerial}>NOM&nbsp;·&nbsp;{serialNumber}</div>

      <div className={styles.receiptBody}>
        <span style={{ color: "var(--ink-mid)" }}>
          {nominatorName} nominated
        </span>
        <span className={styles.receiptNominee}>{nomineeName}</span>
        <span style={{ color: "var(--ink-mid)" }}>for the office of</span>
        <div style={{ marginTop: "0.5rem" }}>
          <span className={styles.receiptPosition}>{position}</span>
        </div>
      </div>

      <motion.svg
        className={styles.receiptStamp}
        viewBox="0 0 200 200"
        initial={{ scale: 1.4, rotate: -28, opacity: 0 }}
        animate={{ scale: 1, rotate: -8, opacity: 0.92 }}
        transition={{
          type: "spring",
          stiffness: 240,
          damping: 14,
          delay: 0.35,
        }}
        aria-hidden
      >
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="var(--riso-red)"
          strokeWidth="6"
          strokeDasharray="8 4"
        />
        <circle
          cx="100"
          cy="100"
          r="74"
          fill="none"
          stroke="var(--riso-red)"
          strokeWidth="3"
        />
        <text
          x="100"
          y="92"
          fontFamily="var(--font-display), sans-serif"
          fontWeight="900"
          fontSize="34"
          textAnchor="middle"
          fill="var(--riso-red)"
          letterSpacing="2"
        >
          RECEIVED
        </text>
        <text
          x="100"
          y="118"
          fontFamily="var(--font-mono-stub), monospace"
          fontWeight="700"
          fontSize="11"
          textAnchor="middle"
          fill="var(--riso-red)"
          letterSpacing="3"
        >
          {new Date()
            .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
            .toUpperCase()}
        </text>
        <text
          x="100"
          y="135"
          fontFamily="var(--font-mono-stub), monospace"
          fontSize="8"
          textAnchor="middle"
          fill="var(--riso-red)"
          letterSpacing="2"
        >
          SSE / RIT
        </text>
      </motion.svg>

      <div className={styles.receiptActions}>
        <Link
          href={`/elections/${electionSlug}`}
          className={styles.receiptAction}
        >
          View the full ballot →
        </Link>
        <button
          type="button"
          className={styles.receiptAction}
          onClick={onNominateAnother}
        >
          Nominate someone else
        </button>
      </div>
    </motion.div>
  );
}
