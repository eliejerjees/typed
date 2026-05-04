"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Movie, MediaBucket, MediaKBCState } from "@/lib/types";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./MediaKBCStep.module.css";

const TOTAL_ROUNDS   = 5;
const ITEMS_PER_ROUND = 3;

const BUCKET_COLOR: Record<MediaBucket, string> = {
  keep:  "#4ade80",
  bench: "#facc15",
  cut:   "#f87171",
};
const BUCKET_BG: Record<MediaBucket, string> = {
  keep:  "rgba(74,222,128,0.15)",
  bench: "rgba(250,204,21,0.15)",
  cut:   "rgba(248,113,113,0.15)",
};
const BUCKET_BORDER: Record<MediaBucket, string> = {
  keep:  "rgba(74,222,128,0.55)",
  bench: "rgba(250,204,21,0.55)",
  cut:   "rgba(248,113,113,0.55)",
};
const BUCKET_LABEL: Record<MediaBucket, string> = {
  keep: "Keep", bench: "Bench", cut: "Cut",
};

interface Props {
  mediaType: "movies" | "shows";
  movieGenreIds: number[];
  actorKothChampionId: number | null;
  onComplete: (state: MediaKBCState) => void;
}

export default function MediaKBCStep({
  mediaType,
  movieGenreIds,
  actorKothChampionId,
  onComplete,
}: Props) {
  const bg = mediaType === "movies" ? "#14532d" : "#78350f";

  const [gameState, setGameState] = useState<MediaKBCState>({
    rounds: [], currentRound: 0, kept: [], benched: [], cut: [],
  });
  const [pool, setPool]                 = useState<Movie[]>([]);
  const [poolIndex, setPoolIndex]       = useState(ITEMS_PER_ROUND);
  const [currentItems, setCurrentItems] = useState<Movie[]>([]);
  const [assignments, setAssignments]   = useState<Record<number, MediaBucket>>({});
  const [loading, setLoading]           = useState(true);
  const [advancing, setAdvancing]       = useState(false);
  const [draggingId, setDraggingId]     = useState<number | null>(null);
  const [hoveredBucket, setHoveredBucket] = useState<MediaBucket | null>(null);

  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const keepRef  = useRef<HTMLDivElement>(null);
  const benchRef = useRef<HTMLDivElement>(null);
  const cutRef   = useRef<HTMLDivElement>(null);

  function getBucketAtPoint(clientX: number, clientY: number): MediaBucket | null {
    const zones: [MediaBucket, React.RefObject<HTMLDivElement | null>][] = [
      ["keep", keepRef], ["bench", benchRef], ["cut", cutRef],
    ];
    for (const [bucket, ref] of zones) {
      if (!ref.current) continue;
      const r = ref.current.getBoundingClientRect();
      if (clientX >= r.left - 20 && clientX <= r.right + 20 &&
          clientY >= r.top  - 60 && clientY <= r.bottom + 20) {
        return bucket;
      }
    }
    return null;
  }

  function clientCoordsFromEvent(event: MouseEvent | TouchEvent | PointerEvent) {
    if ("changedTouches" in event && event.changedTouches.length > 0) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
    if ("clientX" in event) return { x: event.clientX, y: event.clientY };
    return { x: 0, y: 0 };
  }

  const fetchPool = useCallback(async () => {
    try {
      const endpoint = mediaType === "movies" ? "/api/tmdb/movies" : "/api/tmdb/show-pool";
      const body = mediaType === "movies"
        ? { genreIds: movieGenreIds, actorId: actorKothChampionId }
        : { movieGenreIds, actorId: actorKothChampionId };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const items: Movie[] = data.movies ?? data.shows ?? [];

      setPool(items);
      setCurrentItems(items.slice(0, ITEMS_PER_ROUND));
      setPoolIndex(ITEMS_PER_ROUND);
      setAssignments({});
    } catch {
      setCurrentItems([]);
    } finally {
      setLoading(false);
    }
  }, [mediaType, movieGenreIds, actorKothChampionId]);

  useEffect(() => { fetchPool(); }, [fetchPool]);

  function assign(itemId: number, bucket: MediaBucket, items: Movie[]) {
    const next: Record<number, MediaBucket> = { ...assignments };
    // Each bucket holds exactly one item at a time; overwriting clears the old slot
    for (const [id, b] of Object.entries(next)) {
      if (b === bucket && Number(id) !== itemId) delete next[Number(id)];
    }
    next[itemId] = bucket;
    setAssignments(next);
    if (items.every((m) => next[m.id] != null)) {
      setAdvancing(true);
      setTimeout(() => advanceRound(next, items), 700);
    }
  }

  function handleDontKnow(itemId: number) {
    setAssignments((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
    if (poolIndex < pool.length) {
      setCurrentItems((prev) => prev.map((m) => m.id === itemId ? pool[poolIndex] : m));
      setPoolIndex((i) => i + 1);
    }
  }

  function advanceRound(finals: Record<number, MediaBucket>, items: Movie[]) {
    const gs = gameStateRef.current;
    const newKept: Movie[] = [], newBenched: Movie[] = [], newCut: Movie[] = [];
    for (const item of items) {
      const b = finals[item.id];
      if (b === "keep")  newKept.push(item);
      else if (b === "bench") newBenched.push(item);
      else if (b === "cut")   newCut.push(item);
    }
    const nextRound = gs.currentRound + 1;
    const updated: MediaKBCState = {
      rounds: [...gs.rounds, {
        items,
        assignments: items.map((m) => ({ item: m, bucket: finals[m.id]! })),
      }],
      currentRound: nextRound,
      kept:    [...gs.kept,    ...newKept],
      benched: [...gs.benched, ...newBenched],
      cut:     [...gs.cut,     ...newCut],
    };
    setGameState(updated);

    if (nextRound >= TOTAL_ROUNDS) {
      onComplete(updated);
      return;
    }

    // Advance to next 3 items from local pool
    const nextItems = pool.slice(poolIndex, poolIndex + ITEMS_PER_ROUND);
    setCurrentItems(nextItems.length >= ITEMS_PER_ROUND ? nextItems : pool.slice(-ITEMS_PER_ROUND));
    setPoolIndex((i) => i + ITEMS_PER_ROUND);
    setAssignments({});
    setAdvancing(false);
  }

  if (loading) {
    return (
      <div className={styles.loading} style={{ background: bg }}>
        <p className={styles.loadingTitle}>
          Loading {mediaType === "movies" ? "movies" : "shows"}…
        </p>
        <div className={styles.loadingDots}>
          {[0, 1, 2].map((i) => <div key={i} className={styles.loadingDot} />)}
        </div>
      </div>
    );
  }

  const assignedCount = currentItems.filter((m) => assignments[m.id] != null).length;
  const progressCurrent = mediaType === "movies" ? 6 : 7;

  return (
    <div className={styles.container} style={{ background: bg }}>
      <ProgressBar current={progressCurrent} total={7} />

      <div className={styles.inner}>
        <motion.div className={styles.header} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <p className={styles.eyebrow}>
            {mediaType === "movies" ? "Step 6 — Movies" : "Step 7 — Shows"}
          </p>
          <h2 className={styles.heading}>Keep, Bench, or Cut</h2>
          <p className={styles.sub}>Drag each {mediaType === "movies" ? "movie" : "show"} into a bucket.</p>
        </motion.div>

        <div className={styles.roundRow}>
          <span className={styles.roundPill}>
            Round {gameState.currentRound + 1} / {TOTAL_ROUNDS}
          </span>
          {!advancing && assignedCount > 0 && (
            <span className={styles.progressPill}>
              {assignedCount === 3 ? "Submitting…" : `${assignedCount} / 3 assigned`}
            </span>
          )}
        </div>

        {/* ── Item cards ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={gameState.currentRound}
            className={styles.itemsRow}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -28 }}
            transition={{ duration: 0.3 }}
          >
            {currentItems.map((item) => {
              const bucket    = assignments[item.id] ?? null;
              const isDragging = draggingId === item.id;

              return (
                <div key={item.id} className={styles.itemSlot}>
                  <motion.div
                    className={styles.itemCard}
                    style={{
                      borderColor: bucket ? BUCKET_BORDER[bucket] : "rgba(255,255,255,0.15)",
                      background:  bucket ? BUCKET_BG[bucket]     : "rgba(255,255,255,0.09)",
                      cursor: advancing ? "default" : isDragging ? "grabbing" : "grab",
                    }}
                    drag={!advancing}
                    dragSnapToOrigin
                    dragElastic={0.1}
                    dragTransition={{ bounceStiffness: 500, bounceDamping: 38 }}
                    onDragStart={() => setDraggingId(item.id)}
                    onDrag={(event) => {
                      const { x, y } = clientCoordsFromEvent(event as MouseEvent | TouchEvent | PointerEvent);
                      setHoveredBucket(getBucketAtPoint(x, y));
                    }}
                    onDragEnd={(event) => {
                      const { x, y } = clientCoordsFromEvent(event as MouseEvent | TouchEvent | PointerEvent);
                      const dropped = getBucketAtPoint(x, y);
                      if (dropped) assign(item.id, dropped, currentItems);
                      setDraggingId(null);
                      setHoveredBucket(null);
                    }}
                    whileDrag={{ scale: 1.06, zIndex: 100, boxShadow: "0 28px 64px rgba(0,0,0,0.5)" }}
                    animate={{ opacity: advancing ? 0.5 : 1 }}
                  >
                    {bucket && (
                      <div
                        className={styles.assignedBadge}
                        style={{ color: BUCKET_COLOR[bucket], background: BUCKET_BG[bucket] }}
                      >
                        {BUCKET_LABEL[bucket]}
                      </div>
                    )}

                    {item.posterUrl
                      ? <img src={item.posterUrl} alt={item.title} className={styles.poster} draggable={false} />
                      : <div className={styles.posterPlaceholder}>🎬</div>
                    }

                    <div className={styles.itemInfo}>
                      <p className={styles.itemTitle}>{item.title}</p>
                      {item.year > 0 && <p className={styles.itemYear}>{item.year}</p>}
                    </div>
                  </motion.div>

                  {!advancing && (
                    <button className={styles.dontKnow} onClick={() => handleDontKnow(item.id)}>
                      don&apos;t know
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── Drop zones ── */}
        <div className={styles.dropZones}>
          {(["keep", "bench", "cut"] as MediaBucket[]).map((bucket) => {
            const ref    = bucket === "keep" ? keepRef : bucket === "bench" ? benchRef : cutRef;
            const isHot  = hoveredBucket === bucket && draggingId !== null;
            const filled = currentItems.find((m) => assignments[m.id] === bucket);
            const prevCount = (
              bucket === "keep"  ? gameState.kept   :
              bucket === "bench" ? gameState.benched : gameState.cut
            ).length;

            return (
              <motion.div
                key={bucket}
                ref={ref}
                className={styles.dropZone}
                animate={{
                  scale:       isHot ? 1.04 : 1,
                  borderColor: isHot ? BUCKET_COLOR[bucket] : filled ? BUCKET_BORDER[bucket] : "rgba(255,255,255,0.13)",
                  background:  isHot ? BUCKET_BG[bucket]    : filled ? BUCKET_BG[bucket]     : "rgba(0,0,0,0.14)",
                }}
                transition={{ duration: 0.1 }}
              >
                <p
                  className={styles.dropZoneLabel}
                  style={{ color: isHot || filled ? BUCKET_COLOR[bucket] : "rgba(255,255,255,0.4)" }}
                >
                  {BUCKET_LABEL[bucket]}
                </p>

                {filled ? (
                  <div className={styles.dropZoneFilled}>
                    {filled.posterUrl && (
                      <img src={filled.posterUrl} alt={filled.title} className={styles.dropZoneThumb} />
                    )}
                    <span className={styles.dropZoneName}>
                      {filled.title.length > 14 ? filled.title.slice(0, 13) + "…" : filled.title}
                    </span>
                  </div>
                ) : (
                  <p className={styles.dropZoneHint}>{isHot ? "drop!" : "drag here"}</p>
                )}

                {prevCount > 0 && <p className={styles.prevCount}>+{prevCount} prev</p>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
