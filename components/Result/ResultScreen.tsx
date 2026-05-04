"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { TypedResult } from "@/lib/types";
import styles from "./ResultScreen.module.css";

interface ResultScreenProps {
  result: TypedResult;
  onRetake: () => void;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5 },
});

export default function ResultScreen({ result, onRetake }: ResultScreenProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    const title = result.mostLike?.sourceTitle;
    if (!title) return;
    fetch(`/api/tmdb/poster?title=${encodeURIComponent(title)}`)
      .then((r) => r.json())
      .then((d) => { if (d.posterUrl) setPosterUrl(d.posterUrl); })
      .catch(() => {});
  }, [result.mostLike?.sourceTitle]);

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className={styles.inner}>

        {/* ── Header ── */}
        <motion.p className={styles.youAre} {...fadeUp(0.2)}>
          You are
        </motion.p>

        <motion.h1
          className={styles.typeName}
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, type: "spring", stiffness: 100 }}
        >
          {result.coreType}
        </motion.h1>

        <motion.p className={styles.subType} {...fadeUp(0.7)}>
          {result.subType}
        </motion.p>

        {/* ── Hook ── */}
        <motion.p className={styles.hook} {...fadeUp(0.95)}>
          {result.hook}
        </motion.p>

        {/* ── Traits ── */}
        <motion.div className={styles.traits} {...fadeUp(1.2)}>
          {result.traits.map((trait, i) => (
            <motion.span
              key={trait}
              className={styles.trait}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + i * 0.08, type: "spring", stiffness: 220 }}
            >
              {trait}
            </motion.span>
          ))}
        </motion.div>

        {/* ── Cards ── */}
        <motion.div className={styles.sections} {...fadeUp(1.55)}>

          {/* Evidence */}
          {result.receipts?.length > 0 && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>The Evidence</p>
              <ul className={styles.bulletList}>
                {result.receipts.map((r, i) => (
                  <li key={i} className={styles.bulletItem}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Patterns */}
          {result.patterns?.length > 0 && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Your Patterns</p>
              <ul className={styles.bulletList}>
                {result.patterns.map((p, i) => (
                  <li key={i} className={styles.bulletItem}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Contradiction */}
          <div className={`${styles.card} ${styles.contradictionCard}`}>
            <p className={styles.cardLabel}>The Contradiction</p>
            <p className={styles.cardText}>{result.contradiction ?? result.contradictions}</p>
          </div>

          {/* You Are Most Like */}
          {result.mostLike && (
            <div className={`${styles.card} ${styles.mostLikeCard}`}>
              <p className={styles.cardLabel}>You Are Most Like</p>
              <div className={styles.mostLikeInner}>
                {posterUrl && (
                  <img
                    src={posterUrl}
                    alt={result.mostLike.sourceTitle ?? result.mostLike.character}
                    className={styles.mostLikePoster}
                  />
                )}
                <div className={styles.mostLikeText}>
                  <p className={styles.mostLikeCharacter}>{result.mostLike.character}</p>
                  {result.mostLike.sourceTitle && (
                    <p className={styles.mostLikeSource}>{result.mostLike.sourceTitle}</p>
                  )}
                  <p className={styles.cardText}>{result.mostLike.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Predictions */}
          {result.predictions && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Predictions</p>
              <div className={styles.predictions}>
                <div className={styles.prediction}>
                  <p className={styles.predictionLabel}>You would love</p>
                  <p className={styles.predictionValue}>{result.predictions.wouldLove}</p>
                </div>
                <div className={styles.prediction}>
                  <p className={styles.predictionLabel}>You wouldn&apos;t enjoy</p>
                  <p className={styles.predictionValue}>{result.predictions.wouldntEnjoy}</p>
                </div>
                <div className={styles.prediction}>
                  <p className={styles.predictionLabel}>You&apos;d never finish</p>
                  <p className={styles.predictionValue}>{result.predictions.wouldNeverFinish}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && (
            <div className={`${styles.card} ${styles.recoCard}`}>
              <p className={styles.cardLabel}>What&apos;s Next</p>
              <div className={styles.recoGroups}>
                {result.recommendations.movies?.length > 0 && (
                  <div className={styles.recoGroup}>
                    <p className={styles.recoGroupLabel}>Watch</p>
                    <div className={styles.recoPills}>
                      {result.recommendations.movies.map((m) => (
                        <span key={m} className={styles.recoPill}>{m}</span>
                      ))}
                      {result.recommendations.show && (
                        <span className={styles.recoPill}>{result.recommendations.show}</span>
                      )}
                    </div>
                  </div>
                )}
                {result.recommendations.artists?.length > 0 && (
                  <div className={styles.recoGroup}>
                    <p className={styles.recoGroupLabel}>Listen</p>
                    <div className={styles.recoPills}>
                      {result.recommendations.artists.map((a) => (
                        <span key={a} className={styles.recoPill}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </motion.div>

        {/* ── CTA ── */}
        <motion.div className={styles.actions} {...fadeUp(2.1)}>
          <button className={styles.retakeBtn} onClick={onRetake}>
            Retake
          </button>
          <p className={styles.footer}>typed.</p>
        </motion.div>

      </div>
    </motion.div>
  );
}
