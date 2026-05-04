"use client";

import { motion } from "framer-motion";
import type { MediaPreference } from "@/lib/types";
import styles from "./MediaPreferenceStep.module.css";

interface Props {
  onChoice: (pref: MediaPreference) => void;
}

const OPTIONS: { pref: MediaPreference; emoji: string; label: string; sub: string }[] = [
  { pref: "movies", emoji: "🎬", label: "Movies",     sub: "Skip the shows section" },
  { pref: "shows",  emoji: "📺", label: "TV Shows",   sub: "Includes anime. Skip movies." },
  { pref: "both",   emoji: "🍿", label: "Both",       sub: "Movies, then shows" },
];

export default function MediaPreferenceStep({ onChoice }: Props) {
  return (
    <div className={styles.container}>
      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.header}>
          <p className={styles.eyebrow}>Step 4 — Visual Taste</p>
          <h2 className={styles.heading}>What do you actually watch?</h2>
          <p className={styles.sub}>We'll only ask about what applies to you.</p>
        </div>

        <div className={styles.options}>
          {OPTIONS.map(({ pref, emoji, label, sub }, i) => (
            <motion.button
              key={pref}
              className={styles.card}
              onClick={() => onChoice(pref)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
            >
              <span className={styles.emoji}>{emoji}</span>
              <div className={styles.cardText}>
                <p className={styles.cardLabel}>{label}</p>
                <p className={styles.cardSub}>{sub}</p>
              </div>
              <span className={styles.arrow}>›</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
