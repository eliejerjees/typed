"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Actor, ActorBucket, ActorGameState } from "@/lib/types";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./ActorGameStep.module.css";

const TOTAL_ROUNDS = 5;
const ACTORS_PER_ROUND = 3;
const POOL_FETCH_SIZE = 20;

interface Props {
  movieGenreIds: number[];
  onComplete: (state: ActorGameState) => void;
}

export default function ActorGameStep({ movieGenreIds, onComplete }: Props) {
  const [gameState, setGameState] = useState<ActorGameState>({
    rounds: [],
    currentRound: 0,
    kept: [],
    benched: [],
    cut: [],
  });

  // Full fetched pool for this round; first 3 shown, rest are replacements
  const [actorPool, setActorPool] = useState<Actor[]>([]);
  const [poolIndex, setPoolIndex] = useState(ACTORS_PER_ROUND);
  const [currentActors, setCurrentActors] = useState<Actor[]>([]);

  // actorId → bucket (only one actor per bucket at a time)
  const [assignments, setAssignments] = useState<Record<number, ActorBucket>>({});
  const [activeActor, setActiveActor] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const allUsedIds = useRef(new Set<number>());
  // Store latest gameState in a ref so advanceRound doesn't close over stale state
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const fetchPool = useCallback(async (
    round: number,
    kept: Actor[],
    cut: Actor[]
  ) => {
    try {
      const res = await fetch("/api/tmdb/actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieGenreIds,
          round,
          keptActorIds: kept.map((a) => a.id),
          cutActorIds: cut.map((a) => a.id),
          excludeIds: Array.from(allUsedIds.current),
        }),
      });
      const data = await res.json();
      const actors: Actor[] = (data.actors ?? [])
        .filter((a: Actor) => !allUsedIds.current.has(a.id))
        .slice(0, POOL_FETCH_SIZE);

      actors.forEach((a) => allUsedIds.current.add(a.id));

      setActorPool(actors);
      setCurrentActors(actors.slice(0, ACTORS_PER_ROUND));
      setPoolIndex(ACTORS_PER_ROUND);
      setAssignments({});
      setActiveActor(null);
      setAdvancing(false);
    } catch {
      setCurrentActors([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [movieGenreIds]);

  useEffect(() => {
    fetchPool(0, [], []);
  }, [fetchPool]);

  // ── Assign a bucket, enforcing one-per-bucket ─────────────────────────────
  function assign(actorId: number, bucket: ActorBucket, actors: Actor[]) {
    const next: Record<number, ActorBucket> = { ...assignments };

    // Unassign whoever currently holds this bucket
    for (const [id, b] of Object.entries(next)) {
      if (b === bucket && Number(id) !== actorId) {
        delete next[Number(id)];
      }
    }
    next[actorId] = bucket;
    setAssignments(next);
    setActiveActor(null);

    // Auto-advance if all 3 now have distinct buckets
    const allDone = actors.every((a) => next[a.id] != null);
    if (allDone) {
      setAdvancing(true);
      setTimeout(() => advanceRound(next, actors), 500);
    }
  }

  // ── "Don't know" → swap actor out for next in pool ───────────────────────
  function handleDontKnow(actorId: number) {
    setActiveActor(null);

    // Remove any assignment for this actor
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[actorId];
      return next;
    });

    if (poolIndex < actorPool.length) {
      const replacement = actorPool[poolIndex];
      const newActors = currentActors.map((a) => (a.id === actorId ? replacement : a));
      setCurrentActors(newActors);
      setPoolIndex((i) => i + 1);
    }
    // else pool exhausted — actor just stays and user must assign them
  }

  // ── Advance to next round ─────────────────────────────────────────────────
  function advanceRound(
    finalAssignments: Record<number, ActorBucket>,
    actors: Actor[]
  ) {
    const gs = gameStateRef.current;

    const newKept: Actor[] = [];
    const newBenched: Actor[] = [];
    const newCut: Actor[] = [];

    for (const actor of actors) {
      const bucket = finalAssignments[actor.id];
      if (bucket === "keep") newKept.push(actor);
      else if (bucket === "bench") newBenched.push(actor);
      else if (bucket === "cut") newCut.push(actor);
    }

    const nextRound = gs.currentRound + 1;

    const updatedState: ActorGameState = {
      rounds: [
        ...gs.rounds,
        {
          actors,
          assignments: actors.map((a) => ({
            actor: a,
            bucket: finalAssignments[a.id]!,
          })),
        },
      ],
      currentRound: nextRound,
      kept: [...gs.kept, ...newKept],
      benched: [...gs.benched, ...newBenched],
      cut: [...gs.cut, ...newCut],
    };

    setGameState(updatedState);

    if (nextRound >= TOTAL_ROUNDS) {
      onComplete(updatedState);
    } else {
      setLoadingMore(true);
      fetchPool(nextRound, updatedState.kept, updatedState.cut);
    }
  }

  // ── What buckets are already used this round ──────────────────────────────
  const usedBuckets = new Set(
    currentActors
      .map((a) => assignments[a.id])
      .filter((b): b is ActorBucket => b != null)
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <p className={styles.loadingTitle}>Loading actors…</p>
        <div className={styles.loadingDots}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.loadingDot} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ProgressBar current={5} total={7} />

      <div className={styles.inner}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className={styles.eyebrow}>Step 5 of 7 — Movies</p>
          <h2 className={styles.heading}>Keep, Bench, or Cut</h2>
          <p className={styles.sub}>
            One actor per bucket — assign each a different fate.
            Don&apos;t recognize someone? Swap them out.
          </p>
        </motion.div>

        <p className={styles.roundInfo}>
          Round {gameState.currentRound + 1} of {TOTAL_ROUNDS}
        </p>

        <div className={styles.instructions}>
          <span className={styles.instrItem}>Keep: you like them</span>
          <span className={styles.instrItem}>Bench: neutral</span>
          <span className={styles.instrItem}>Cut: not your vibe</span>
        </div>

        {/* Actor cards */}
        <AnimatePresence mode="wait">
          {!loadingMore && (
            <motion.div
              key={gameState.currentRound}
              className={styles.actorsRow}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {currentActors.map((actor) => {
                const assignedBucket = assignments[actor.id] ?? null;
                const isAssigned = assignedBucket !== null;
                const isActive = activeActor === actor.id;

                return (
                  <div
                    key={actor.id}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
                  >
                    <motion.div
                      className={`${styles.actorCard} ${
                        activeActor !== null && !isActive
                          ? styles.actorCardSelecting
                          : styles.actorCardActive
                      }`}
                      style={{
                        outline: isAssigned
                          ? assignedBucket === "keep"
                            ? "2px solid rgba(74,222,128,0.7)"
                            : assignedBucket === "cut"
                            ? "2px solid rgba(252,165,165,0.7)"
                            : "2px solid rgba(255,255,255,0.4)"
                          : "none",
                      }}
                      onClick={() => {
                        if (!advancing) setActiveActor(isActive ? null : actor.id);
                      }}
                      whileTap={{ scale: 0.96 }}
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        boxShadow: isActive ? "0 0 0 3px rgba(255,255,255,0.5)" : "none",
                      }}
                    >
                      {actor.imageUrl ? (
                        <img
                          src={actor.imageUrl}
                          alt={actor.name}
                          className={styles.actorImage}
                        />
                      ) : (
                        <div className={styles.actorImagePlaceholder}>🎬</div>
                      )}
                      <p className={styles.actorName}>{actor.name}</p>

                      {/* Assigned badge */}
                      {isAssigned && (
                        <span style={{ fontSize: 16, position: "absolute" }}>
                          {assignedBucket === "keep" ? "Keep" : assignedBucket === "cut" ? "Cut" : "Bench"}
                        </span>
                      )}
                    </motion.div>

                    {/* Don't know — swaps actor out */}
                    {!advancing && (
                      <button
                        className={styles.dontKnow}
                        onClick={(e) => { e.stopPropagation(); handleDontKnow(actor.id); }}
                      >
                        don&apos;t know
                      </button>
                    )}

                    {/* Assign buttons — only show available buckets */}
                    <AnimatePresence>
                      {isActive && !advancing && (
                        <motion.div
                          className={styles.assignButtons}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          {(["keep", "bench", "cut"] as ActorBucket[]).map((b) => {
                            const taken = usedBuckets.has(b) && assignments[actor.id] !== b;
                            return (
                              <button
                                key={b}
                                className={`${styles.assignBtn} ${
                                  b === "keep"
                                    ? styles.assignBtnKeep
                                    : b === "cut"
                                    ? styles.assignBtnCut
                                    : styles.assignBtnBench
                                }`}
                                style={{ opacity: taken ? 0.3 : 1, cursor: taken ? "not-allowed" : "pointer" }}
                                disabled={taken}
                                onClick={() => assign(actor.id, b, currentActors)}
                              >
                                {b === "keep" ? "Keep" : b === "bench" ? "Bench" : "Cut"}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {(loadingMore || advancing) && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "var(--text-sm)" }}>
            {advancing ? "Moving on…" : "Loading next round…"}
          </div>
        )}

        {/* Buckets summary (previous rounds only) */}
        <div className={styles.bucketsRow}>
          {(["keep", "bench", "cut"] as ActorBucket[]).map((bucket) => {
            const actors =
              bucket === "keep"
                ? gameState.kept
                : bucket === "bench"
                ? gameState.benched
                : gameState.cut;

            return (
              <div
                key={bucket}
                className={`${styles.bucket} ${
                  bucket === "keep"
                    ? styles.bucketKeep
                    : bucket === "cut"
                    ? styles.bucketCut
                    : ""
                }`}
              >
                <p className={styles.bucketLabel}>
                  {bucket === "keep" ? "Keep" : bucket === "bench" ? "Bench" : "Cut"}
                </p>
                <div className={styles.bucketActors}>
                  {actors.length === 0 ? (
                    <p className={styles.bucketEmptyHint}>—</p>
                  ) : (
                    actors.map((a) => (
                      <div key={a.id} className={styles.bucketActorChip}>
                        {a.imageUrl && (
                          <img src={a.imageUrl} alt={a.name} className={styles.bucketActorImg} />
                        )}
                        <span>{a.name.split(" ")[0]}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
