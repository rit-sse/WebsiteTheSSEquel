"use client";

import { motion } from "motion/react";
import styles from "./nominate.module.scss";
import type { NominateRoleManifestEntry } from "./types";

interface RoleManifestProps {
  roles: NominateRoleManifestEntry[];
}

export default function RoleManifest({ roles }: RoleManifestProps) {
  return (
    <motion.section
      className={styles.manifest}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2>The Roles</h2>
      <ul className={styles.manifestList}>
        {roles.map((role) => (
          <li key={role.title} className={styles.manifestItem}>
            <div className={styles.manifestRole}>
              <span className={styles.manifestRoleTitle}>
                {role.title}
                {!role.onBallot && (
                  <span
                    style={{
                      marginLeft: "0.6rem",
                      fontFamily:
                        "var(--font-mono-stub), monospace",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      letterSpacing: "0.18em",
                      color: "var(--cobalt)",
                      verticalAlign: "middle",
                    }}
                  >
                    RUNNING-MATE PICK
                  </span>
                )}
              </span>
              <span className={styles.manifestRoleDesc}>
                {role.description}
              </span>
            </div>
            <div className={styles.manifestIncumbent}>
              {role.incumbent ? (
                <>
                  Currently
                  <strong>{role.incumbent.name}</strong>
                </>
              ) : (
                <span style={{ color: "var(--ink-mid)" }}>Vacant</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
