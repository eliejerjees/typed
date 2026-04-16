"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { KOTHState, Movie } from "@/lib/types";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./MovieKOTHStep.module.css";

const TOTAL_ROUNDS = 15;

interface Props {
  movieGenreIds: number[];
  keptActorIds: number[];
  onComplete: (state: KOTHState) => void;
}

export default function MovieKOTHStep({ movieGenreIds, keptActorIds, onComplete }: Props) {
  const [pool, setPool] = useState<Movie[]>([]);
  const [kothState, setKothState] = useState<KOTHState>({
    champion: null,
    challengerQueue: [],
    round: 0,
    history: [],
  });
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [exiting, setExiting] = useState<"challenger" | "champion" | null>(null);

  useEffect(() => {
    fetch("/api/tmdb/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genreIds: movieGenreIds, keptActorIds }),
    })
      .then((r) => r.json())
      .then((data) => {
        const movies: Movie[] = data.movies ?? [];
        if (movies.length < 2) return;

        const [first, second, ...rest] = movies;
        setPool(movies);
        setKothState({
          champion: first,
          challengerQueue: [second, ...rest],
          round: 1,
          history: [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [movieGenreIds, keptActorIds]);

  function refreshChallenger() {
    if (kothState.round > 1) return;
    // Rotate: move current challenger to back
    setKothState((prev) => {
      const [current, ...rest] = prev.challengerQueue;
      return { ...prev, challengerQueue: [...rest, current] };
    });
  }

  function pick(winner: Movie) {
    if (animating) return;
    const { champion, challengerQueue, round, history } = kothState;
    if (!champion || challengerQueue.length === 0) return;

    const challenger = challengerQueue[0];
    const loser = winner.id === champion.id ? challenger : champion;

    setAnimating(true);
    setExiting(winner.id === champion.id ? "challenger" : "champion");

    setTimeout(() => {
      const newHistory = [...history, { champion, challenger, winner }];
      const newQueue = challengerQueue.slice(1);

      if (round >= TOTAL_ROUNDS || newQueue.length === 0) {
        const finalState: KOTHState = {
          champion: winner,
          challengerQueue: newQueue,
          round: round + 1,
          history: newHistory,
        };
        onComplete(finalState);
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
      void loser; // suppress unused var
    }, 380);
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <p className={styles.loadingTitle}>Building your movie pool…</p>
        <div className={styles.loadingDots}>
          {[0, 1, 2].map((i) => <div key={i} className={styles.loadingDot} />)}
        </div>
      </div>
    );
  }

  const { champion, challengerQueue, round, history } = kothState;
  const challenger = challengerQueue[0] ?? null;
  const done = round > TOTAL_ROUNDS || !challenger;

  if (done && champion) {
    return (
      <div className={styles.container}>
        <div className={styles.inner}>
          <motion.div
            className={styles.completeOverlay}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <p className={styles.completeTitle}>🏆 Your King of the Hill</p>
            {champion.posterUrl && (
              <img src={champion.posterUrl} alt={champion.title} className={styles.completePoster} />
            )}
            <p className={styles.completeMovieName}>{champion.title}</p>
            <button
              className={styles.completeBtn}
              onClick={() => onComplete(kothState)}
            >
              Next →
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ProgressBar current={6} total={7} />

      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className={styles.eyebrow}>Step 6 of 7 — Movies</p>
          <h2 className={styles.heading}>King of the Hill</h2>
          <p className={styles.sub}>
            Pick the movie you like more. Winner holds the throne.
          </p>
        </motion.div>

        <p className={styles.roundCounter}>
          Round {round} of {TOTAL_ROUNDS}
        </p>

        {/* VS layout */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${champion?.id}-${challenger?.id}`}
            className={styles.vsLayout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Champion */}
            {champion && (
              <motion.div
                key={`champ-${champion.id}`}
                className={styles.movieCard}
                animate={{
                  opacity: exiting === "champion" ? 0 : 1,
                  y: exiting === "champion" ? 40 : 0,
                  scale: exiting === "champion" ? 0.85 : 1,
                }}
                transition={{ duration: 0.35 }}
                onClick={() => pick(champion)}
              >
                {round > 1 && (
                  <span className={styles.championBadge}>👑 Champion</span>
                )}
                {champion.posterUrl ? (
                  <img src={champion.posterUrl} alt={champion.title} className={styles.moviePoster} />
                ) : (
                  <div className={styles.moviePosterPlaceholder}>🎬</div>
                )}
                <p className={styles.movieTitle}>{champion.title}</p>
                {champion.year > 0 && (
                  <p className={styles.movieYear}>{champion.year}</p>
                )}
                <button className={styles.chooseBtn}>
                  {round === 1 ? "Pick this" : "Defend the throne"}
                </button>
              </motion.div>
            )}

            <div className={styles.vsText}>VS</div>

            {/* Challenger */}
            {challenger && (
              <motion.div
                key={`challenger-${challenger.id}`}
                className={styles.movieCard}
                initial={{ opacity: 0, y: -30 }}
                animate={{
                  opacity: exiting === "challenger" ? 0 : 1,
                  y: exiting === "challenger" ? 40 : 0,
                  scale: exiting === "challenger" ? 0.85 : 1,
                }}
                transition={{ duration: 0.35 }}
                onClick={() => pick(challenger)}
              >
                {challenger.posterUrl ? (
                  <img src={challenger.posterUrl} alt={challenger.title} className={styles.moviePoster} />
                ) : (
                  <div className={styles.moviePosterPlaceholder}>🎬</div>
                )}
                <p className={styles.movieTitle}>{challenger.title}</p>
                {challenger.year > 0 && (
                  <p className={styles.movieYear}>{challenger.year}</p>
                )}
                <button className={styles.chooseBtn}>Pick this</button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Refresh only on round 1 */}
        {round === 1 && (
          <div className={styles.refreshHint}>
            <span>Don&apos;t know either movie?</span>
            <button className={styles.refreshBtn} onClick={refreshChallenger}>
              ↻ Swap challenger
            </button>
          </div>
        )}

        {/* History strip */}
        {history.length > 0 && (
          <div className={styles.historyStrip}>
            <p className={styles.historyTitle}>Previous champions</p>
            <div className={styles.historyItems}>
              {history.map((h, i) => (
                <span key={i} className={styles.historyChip}>
                  {h.winner.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
