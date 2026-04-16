"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import styles from "./ProcessingScreen.module.css";

const STEPS = [
  "analyzing music patterns...",
  "mapping genre signals...",
  "cross-referencing film choices...",
  "weighing contradictions...",
  "generating your type...",
];

export default function ProcessingScreen() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      {/* Pulsing rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={styles.ring}
          animate={{ scale: [1, 2.8, 1], opacity: [0.4, 0, 0.4] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.55,
            ease: "easeOut",
          }}
        />
      ))}

      <div className={styles.content}>
        <motion.h2
          className={styles.heading}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Analyzing your taste…
        </motion.h2>

        <div className={styles.track}>
          <motion.div
            className={styles.fill}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "easeInOut" }}
          />
        </div>

        <motion.p
          key={stepIdx}
          className={styles.sub}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {STEPS[stepIdx]}
        </motion.p>

        <p className={styles.step}>this takes about 5 seconds</p>
      </div>
    </div>
  );
}
