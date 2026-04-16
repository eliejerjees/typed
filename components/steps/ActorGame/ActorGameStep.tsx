"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Actor, ActorBucket, ActorGameState } from "@/lib/types";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./ActorGameStep.module.css";

const TOTAL_ROUNDS = 5;
const ACTORS_PER_ROUND = 3;
const POOL_FETCH_SIZE = 22;

const BUCKET_COLOR: Record<ActorBucket, string> = {
  keep:  "#4ade80",
  bench: "#facc15",
  cut:   "#f87171",
};
const BUCKET_BG: Record<ActorBucket, string> = {
  keep:  "rgba(74,222,128,0.15)",
  bench: "rgba(250,204,21,0.15)",
  cut:   "rgba(248,113,113,0.15)",
};
const BUCKET_BORDER: Record<ActorBucket, string> = {
  keep:  "rgba(74,222,128,0.55)",
  bench: "rgba(250,204,21,0.55)",
  cut:   "rgba(248,113,113,0.55)",
};
const BUCKET_LABEL: Record<ActorBucket, string> = {
  keep: "Keep", bench: "Bench", cut: "Cut",
};

interface Props {
  movieGenreIds: number[];
  onComplete: (state: ActorGameState) => void;
}

export default function ActorGameStep({ movieGenreIds, onComplete }: Props) {
  const [gameState, setGameState] = useState<ActorGameState>({
    rounds: [], currentRound: 0, kept: [], benched: [], cut: [],
  });
  const [actorPool, setActorPool]   = useState<Actor[]>([]);
  const [poolIndex, setPoolIndex]   = useState(ACTORS_PER_ROUND);
  const [currentActors, setCurrentActors] = useState<Actor[]>([]);
  const [assignments, setAssignments]     = useState<Record<number, ActorBucket>>({});
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [advancing, setAdvancing]   = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [hoveredBucket, setHoveredBucket] = useState<ActorBucket | null>(null);

  const allUsedIds  = useRef(new Set<number>());
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const keepRef  = useRef<HTMLDivElement>(null);
  const benchRef = useRef<HTMLDivElement>(null);
  const cutRef   = useRef<HTMLDivElement>(null);

  function getBucketAtPoint(clientX: number, clientY: number): ActorBucket | null {
    const zones: [ActorBucket, React.RefObject<HTMLDivElement | null>][] = [
      ["keep", keepRef], ["bench", benchRef], ["cut", cutRef],
    ];
    for (const [bucket, ref] of zones) {
      if (!ref.current) continue;
      const r = ref.current.getBoundingClientRect();
      // Generous padding so dropping anywhere near the bucket registers
      if (clientX >= r.left - 20 && clientX <= r.right + 20 &&
          clientY >= r.top  - 60 && clientY <= r.bottom + 20) {
        return bucket;
      }
    }
    return null;
  }

  // Extract reliable viewport coordinates from the native drag event
  function clientCoordsFromEvent(event: MouseEvent | TouchEvent | PointerEvent): { x: number; y: number } {
    if ("changedTouches" in event && event.changedTouches.length > 0) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
    if ("clientX" in event) {
      return { x: event.clientX, y: event.clientY };
    }
    return { x: 0, y: 0 };
  }

  const fetchPool = useCallback(async (round: number, kept: Actor[], cut: Actor[]) => {
    setLoadingMore(true);
    try {
      const res = await fetch("/api/tmdb/actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieGenreIds, round,
          keptActorIds: kept.map((a) => a.id),
          cutActorIds:  cut.map((a) => a.id),
          excludeIds:   Array.from(allUsedIds.current),
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
      setAdvancing(false);
    } catch {
      setCurrentActors([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [movieGenreIds]);

  useEffect(() => { fetchPool(0, [], []); }, [fetchPool]);

  function assign(actorId: number, bucket: ActorBucket, actors: Actor[]) {
    const next: Record<number, ActorBucket> = { ...assignments };
    for (const [id, b] of Object.entries(next)) {
      if (b === bucket && Number(id) !== actorId) delete next[Number(id)];
    }
    next[actorId] = bucket;
    setAssignments(next);
    if (actors.every((a) => next[a.id] != null)) {
      setAdvancing(true);
      setTimeout(() => advanceRound(next, actors), 700);
    }
  }

  function handleDontKnow(actorId: number) {
    setAssignments((prev) => { const n = { ...prev }; delete n[actorId]; return n; });
    if (poolIndex < actorPool.length) {
      setCurrentActors((prev) => prev.map((a) => a.id === actorId ? actorPool[poolIndex] : a));
      setPoolIndex((i) => i + 1);
    }
  }

  function advanceRound(finals: Record<number, ActorBucket>, actors: Actor[]) {
    const gs = gameStateRef.current;
    const newKept: Actor[] = [], newBenched: Actor[] = [], newCut: Actor[] = [];
    for (const a of actors) {
      const b = finals[a.id];
      if (b === "keep") newKept.push(a);
      else if (b === "bench") newBenched.push(a);
      else if (b === "cut") newCut.push(a);
    }
    const nextRound = gs.currentRound + 1;
    const updated: ActorGameState = {
      rounds: [...gs.rounds, { actors, assignments: actors.map((a) => ({ actor: a, bucket: finals[a.id]! })) }],
      currentRound: nextRound,
      kept:    [...gs.kept,    ...newKept],
      benched: [...gs.benched, ...newBenched],
      cut:     [...gs.cut,     ...newCut],
    };
    setGameState(updated);
    if (nextRound >= TOTAL_ROUNDS) {
      onComplete(updated);
    } else {
      setLoadingMore(true);
      fetchPool(nextRound, updated.kept, updated.cut);
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <p className={styles.loadingTitle}>Loading actors…</p>
        <div className={styles.loadingDots}>
          {[0,1,2].map((i) => <div key={i} className={styles.loadingDot} />)}
        </div>
      </div>
    );
  }

  const assignedCount = currentActors.filter((a) => assignments[a.id] != null).length;

  return (
    <div className={styles.container}>
      <ProgressBar current={5} total={7} />

      <div className={styles.inner}>
        <motion.div className={styles.header} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <p className={styles.eyebrow}>Step 5 of 7 — Movies</p>
          <h2 className={styles.heading}>Keep, Bench, or Cut</h2>
          <p className={styles.sub}>Drag each actor into a bucket. Drag to a different bucket to reassign.</p>
        </motion.div>

        <div className={styles.roundRow}>
          <span className={styles.roundPill}>Round {gameState.currentRound + 1} / {TOTAL_ROUNDS}</span>
          {!advancing && !loadingMore && assignedCount > 0 && (
            <span className={styles.progressPill}>
              {assignedCount === 3 ? "Submitting…" : `${assignedCount} / 3 assigned`}
            </span>
          )}
        </div>

        {/* ── Actor cards ── */}
        <AnimatePresence mode="wait">
          {!loadingMore && (
            <motion.div
              key={gameState.currentRound}
              className={styles.actorsRow}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.3 }}
            >
              {currentActors.map((actor) => {
                const bucket = assignments[actor.id] ?? null;
                const isDragging = draggingId === actor.id;

                return (
                  <div key={actor.id} className={styles.actorSlot}>
                    <motion.div
                      className={styles.actorCard}
                      style={{
                        borderColor: bucket ? BUCKET_BORDER[bucket] : "rgba(255,255,255,0.15)",
                        background: bucket ? BUCKET_BG[bucket] : "rgba(255,255,255,0.09)",
                        cursor: advancing ? "default" : isDragging ? "grabbing" : "grab",
                      }}
                      drag={!advancing}
                      dragSnapToOrigin
                      dragElastic={0.1}
                      dragTransition={{ bounceStiffness: 500, bounceDamping: 38 }}
                      onDragStart={() => setDraggingId(actor.id)}
                      onDrag={(event) => {
                        const { x, y } = clientCoordsFromEvent(event as MouseEvent | TouchEvent | PointerEvent);
                        setHoveredBucket(getBucketAtPoint(x, y));
                      }}
                      onDragEnd={(event) => {
                        const { x, y } = clientCoordsFromEvent(event as MouseEvent | TouchEvent | PointerEvent);
                        const dropped = getBucketAtPoint(x, y);
                        if (dropped) assign(actor.id, dropped, currentActors);
                        setDraggingId(null);
                        setHoveredBucket(null);
                      }}
                      whileDrag={{ scale: 1.06, zIndex: 100, boxShadow: "0 28px 64px rgba(0,0,0,0.5)" }}
                      animate={{ opacity: advancing ? 0.5 : 1 }}
                    >
                      {bucket && (
                        <div className={styles.assignedBadge} style={{ color: BUCKET_COLOR[bucket], background: BUCKET_BG[bucket] }}>
                          {BUCKET_LABEL[bucket]}
                        </div>
                      )}

                      {actor.imageUrl
                        ? <img src={actor.imageUrl} alt={actor.name} className={styles.actorPhoto} draggable={false} />
                        : <div className={styles.actorPhotoPlaceholder}>🎬</div>
                      }

                      <div className={styles.actorInfo}>
                        <p className={styles.actorName}>{actor.name}</p>
                        {actor.knownFor.length > 0 && (
                          <ul className={styles.filmList}>
                            {actor.knownFor.slice(0, 3).map((f, i) => (
                              <li key={i} className={styles.filmItem}>{f}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </motion.div>

                    {!advancing && (
                      <button className={styles.dontKnow} onClick={() => handleDontKnow(actor.id)}>
                        don&apos;t know
                      </button>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {loadingMore && (
          <div className={styles.loadingNext}>
            <div className={styles.loadingDots}>
              {[0,1,2].map((i) => <div key={i} className={styles.loadingDot} />)}
            </div>
          </div>
        )}

        {/* ── Drop zones ── */}
        {!loadingMore && (
          <div className={styles.dropZones}>
            {(["keep", "bench", "cut"] as ActorBucket[]).map((bucket) => {
              const ref   = bucket === "keep" ? keepRef : bucket === "bench" ? benchRef : cutRef;
              const isHot = hoveredBucket === bucket && draggingId !== null;
              const filled = currentActors.find((a) => assignments[a.id] === bucket);
              const prevCount = (bucket === "keep" ? gameState.kept : bucket === "bench" ? gameState.benched : gameState.cut).length;

              return (
                <motion.div
                  key={bucket}
                  ref={ref}
                  className={styles.dropZone}
                  animate={{
                    scale: isHot ? 1.04 : 1,
                    borderColor: isHot ? BUCKET_COLOR[bucket] : filled ? BUCKET_BORDER[bucket] : "rgba(255,255,255,0.13)",
                    background:  isHot ? BUCKET_BG[bucket]    : filled ? `${BUCKET_BG[bucket]}` : "rgba(0,0,0,0.14)",
                  }}
                  transition={{ duration: 0.1 }}
                >
                  <p className={styles.dropZoneLabel} style={{ color: isHot || filled ? BUCKET_COLOR[bucket] : "rgba(255,255,255,0.4)" }}>
                    {BUCKET_LABEL[bucket]}
                  </p>

                  {filled ? (
                    <div className={styles.dropZoneFilled}>
                      {filled.imageUrl && <img src={filled.imageUrl} alt={filled.name} className={styles.dropZoneAvatar} />}
                      <span className={styles.dropZoneName}>{filled.name.split(" ")[0]}</span>
                    </div>
                  ) : (
                    <p className={styles.dropZoneHint}>{isHot ? "drop!" : "drag here"}</p>
                  )}

                  {prevCount > 0 && <p className={styles.prevCount}>+{prevCount} prev</p>}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
