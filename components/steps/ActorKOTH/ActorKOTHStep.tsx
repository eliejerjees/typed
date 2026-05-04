"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Actor, ActorKOTHState } from "@/lib/types";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./ActorKOTHStep.module.css";

const TOTAL_ROUNDS = 10;

interface Props {
  onComplete: (state: ActorKOTHState) => void;
}

export default function ActorKOTHStep({ onComplete }: Props) {
  const [kothState, setKothState] = useState<ActorKOTHState>({
    champion: null,
    challengerQueue: [],
    round: 0,
    history: [],
  });
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [exiting, setExiting] = useState<"challenger" | "champion" | null>(null);

  useEffect(() => {
    fetch("/api/tmdb/actor-pool")
      .then((r) => r.json())
      .then((data) => {
        const actors: Actor[] = data.actors ?? [];
        if (actors.length < 2) return;
        const [first, second, ...rest] = actors;
        setKothState({
          champion: first,
          challengerQueue: [second, ...rest],
          round: 1,
          history: [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function pick(winner: Actor) {
    if (animating) return;
    const { champion, challengerQueue, round, history } = kothState;
    if (!champion || challengerQueue.length === 0) return;

    const challenger = challengerQueue[0];
    setAnimating(true);
    setExiting(winner.id === champion.id ? "challenger" : "champion");

    setTimeout(() => {
      const newHistory = [...history, { champion, challenger, winner }];
      const newQueue = challengerQueue.slice(1);

      if (round >= TOTAL_ROUNDS || newQueue.length === 0) {
        onComplete({
          champion: winner,
          challengerQueue: newQueue,
          round: round + 1,
          history: newHistory,
        });
        return;
      }

      setKothState({
        champion: winner,
        challengerQueue: newQueue,
        round: round + 1,
        history: newHistory,
      });
      setExiting(null);
      setAnimating(false);
    }, 380);
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <p className={styles.loadingTitle}>Loading actors…</p>
        <div className={styles.loadingDots}>
          {[0, 1, 2].map((i) => <div key={i} className={styles.loadingDot} />)}
        </div>
      </div>
    );
  }

  const { champion, challengerQueue, round } = kothState;
  const challenger = challengerQueue[0] ?? null;

  return (
    <div className={styles.container}>
      <ProgressBar current={5} total={7} />

      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className={styles.eyebrow}>Step 5 — Actors</p>
          <h2 className={styles.heading}>King of the Hill</h2>
          <p className={styles.sub}>Pick the actor you prefer. Winner holds the throne.</p>
        </motion.div>

        <p className={styles.roundCounter}>Round {round} of {TOTAL_ROUNDS}</p>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${champion?.id}-${challenger?.id}`}
            className={styles.vsLayout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {champion && (
              <motion.div
                key={`champ-${champion.id}`}
                className={styles.actorCard}
                animate={{
                  opacity: exiting === "champion" ? 0 : 1,
                  y: exiting === "champion" ? 40 : 0,
                  scale: exiting === "champion" ? 0.85 : 1,
                }}
                transition={{ duration: 0.35 }}
                onClick={() => pick(champion)}
              >
                {round > 1 && <span className={styles.championBadge}> Champion</span>}
                {champion.imageUrl
                  ? <img src={champion.imageUrl} alt={champion.name} className={styles.actorPhoto} />
                  : <div className={styles.actorPhotoPlaceholder}>🎬</div>
                }
                <p className={styles.actorName}>{champion.name}</p>
                {champion.knownFor.length > 0 && (
                  <ul className={styles.knownFor}>
                    {champion.knownFor.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                )}
                <button className={styles.chooseBtn}>
                  {round === 1 ? "Pick this" : "Defend the throne"}
                </button>
              </motion.div>
            )}

            <div className={styles.vsText}>VS</div>

            {challenger && (
              <motion.div
                key={`challenger-${challenger.id}`}
                className={styles.actorCard}
                initial={{ opacity: 0, y: -30 }}
                animate={{
                  opacity: exiting === "challenger" ? 0 : 1,
                  y: exiting === "challenger" ? 40 : 0,
                  scale: exiting === "challenger" ? 0.85 : 1,
                }}
                transition={{ duration: 0.35 }}
                onClick={() => pick(challenger)}
              >
                {challenger.imageUrl
                  ? <img src={challenger.imageUrl} alt={challenger.name} className={styles.actorPhoto} />
                  : <div className={styles.actorPhotoPlaceholder}>🎬</div>
                }
                <p className={styles.actorName}>{challenger.name}</p>
                {challenger.knownFor.length > 0 && (
                  <ul className={styles.knownFor}>
                    {challenger.knownFor.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                )}
                <button className={styles.chooseBtn}>Pick this</button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
