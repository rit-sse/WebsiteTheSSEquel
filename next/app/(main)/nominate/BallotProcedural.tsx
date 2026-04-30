"use client";

import { motion } from "motion/react";
import styles from "./nominate.module.scss";

interface BallotProceduralProps {
  number: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

/**
 * Numbered procedural section wrapper. The "01.", "02.", "03." numerals
 * are part of the ballot-stub aesthetic — each section reads like a
 * step in an official voting procedure.
 *
 * Reveals once on scroll, never again. Respects prefers-reduced-motion
 * (CSS handles the kill switch in nominate.module.scss).
 */
export default function BallotProcedural({
  number,
  title,
  children,
  delay = 0,
}: BallotProceduralProps) {
  return (
    <motion.section
      className={styles.procedural}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      <header className={styles.proceduralHeader}>
        <span className={styles.proceduralNumeral}>{number}.</span>
        <h2 className={styles.proceduralTitle}>{title}</h2>
      </header>
      <div className={styles.proceduralBody}>{children}</div>
    </motion.section>
  );
}
