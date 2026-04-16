"use client";

import { motion } from "framer-motion";
import styles from "./LandingScreen.module.css";

interface LandingScreenProps {
  onStart: () => void;
  hasProgress: boolean;
  onRestore: () => void;
}

export default function LandingScreen({
  onStart,
  hasProgress,
  onRestore,
}: LandingScreenProps) {
  return (
    <div className={styles.container}>
      <motion.div
        className={styles.inner}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 40, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.9, type: "spring", stiffness: 80 }}
        >
          Typed
        </motion.h1>

        <motion.p
          className={styles.tagline}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
        >
          Your taste has a type.
        </motion.p>

        <motion.p
          className={styles.description}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.7 }}
        >
          Music you love + movies you actually watch = one combined result.
          Pick your favorites, not what you think is best.
        </motion.p>

        <motion.button
          className={styles.startBtn}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.35, duration: 0.55, type: "spring" }}
          onClick={onStart}
        >
          Let&apos;s Go
        </motion.button>

        {hasProgress && (
          <motion.button
            className={styles.restoreBadge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
            onClick={onRestore}
          >
            ↩ Continue where you left off
          </motion.button>
        )}

        <motion.p
          className={styles.meta}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9 }}
        >
          Music · Movies · Shows · One result
        </motion.p>
      </motion.div>
    </div>
  );
}
