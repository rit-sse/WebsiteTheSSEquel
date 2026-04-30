"use client";

import styles from "./nominate.module.scss";

interface MarqueeProps {
  items: string[];
}

/**
 * Continuous-scroll ticker strip at the very top of the page.
 * Doubles its content so the CSS `translateX(-50%)` keyframe loops
 * seamlessly. Pauses on hover (CSS handles that — no JS).
 */
export default function Marquee({ items }: MarqueeProps) {
  // Fall back to a default cadence if no items provided
  const finalItems = items.length > 0 ? items : ["NOMINATE TODAY"];
  const repeated = [...finalItems, ...finalItems, ...finalItems, ...finalItems];

  return (
    <div className={styles.marquee} role="status" aria-live="polite">
      <div className={styles.marqueeTrack}>
        {repeated.map((item, idx) => (
          <span key={idx} className={styles.marqueeItem}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
