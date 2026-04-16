"use client";

import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  current: number; // 1-based current step (not counting landing)
  total: number;   // total steps (not counting landing/processing/result)
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label ?? `${current} / ${total}`}</span>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
