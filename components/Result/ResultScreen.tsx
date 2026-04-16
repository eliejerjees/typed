"use client";

import { motion } from "framer-motion";
import type { TypedResult } from "@/lib/types";
import styles from "./ResultScreen.module.css";

interface ResultScreenProps {
  result: TypedResult;
  onRetake: () => void;
}

export default function ResultScreen({ result, onRetake }: ResultScreenProps) {
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className={styles.inner}>
        {/* Header */}
        <motion.p
          className={styles.youAre}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          You are
        </motion.p>

        <motion.h1
          className={styles.typeName}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 100 }}
        >
          {result.coreType}
        </motion.h1>

        <motion.p
          className={styles.subType}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          {result.subType}
        </motion.p>

        {/* Summary */}
        <motion.p
          className={styles.summary}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          {result.summary}
        </motion.p>

        {/* Traits */}
        <motion.div
          className={styles.traits}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          {result.traits.map((trait, i) => (
            <motion.span
              key={trait}
              className={styles.trait}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 1.3 + i * 0.1,
                type: "spring",
                stiffness: 220,
              }}
            >
              {trait}
            </motion.span>
          ))}
        </motion.div>

        {/* Breakdown cards */}
        <motion.div
          className={styles.breakdowns}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
        >
          <div className={styles.card}>
            <p className={styles.cardLabel}>Music</p>
            <p className={styles.cardText}>{result.musicBreakdown}</p>
          </div>

          <div className={styles.card}>
            <p className={styles.cardLabel}>Movies & Shows</p>
            <p className={styles.cardText}>{result.movieBreakdown}</p>
          </div>

          <div className={`${styles.card} ${styles.contradictionCard}`}>
            <p className={styles.cardLabel}>The Contradiction</p>
            <p className={styles.cardText}>{result.contradictions}</p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1 }}
        >
          <button className={styles.retakeBtn} onClick={onRetake}>
            Retake
          </button>
          <p className={styles.footer}>typed.</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
