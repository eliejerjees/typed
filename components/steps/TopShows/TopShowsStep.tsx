"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./TopShowsStep.module.css";

const MAX = 5;

interface ShowResult {
  id: number;
  name: string;
  posterUrl: string;
  year: string;
}

interface Props {
  onNext: (shows: string[]) => void;
}

export default function TopShowsStep({ onNext }: Props) {
  const [selected, setSelected] = useState<ShowResult[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ShowResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/tmdb/shows?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const alreadyNames = new Set(selected.map((s) => s.name.toLowerCase()));
      setSuggestions(
        (data.shows ?? []).filter((s: ShowResult) => !alreadyNames.has(s.name.toLowerCase()))
      );
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, [selected]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) { setSuggestions([]); return; }
    searchTimer.current = setTimeout(() => search(query), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, search]);

  function addShow(show: ShowResult) {
    if (selected.length >= MAX) return;
    if (selected.find((s) => s.name.toLowerCase() === show.name.toLowerCase())) return;
    setSelected((prev) => [...prev, show]);
    setQuery("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function removeShow(name: string) {
    setSelected((prev) => prev.filter((s) => s.name !== name));
  }

  const emptySlots = Math.max(0, MAX - selected.length);

  return (
    <div className={styles.container}>
      <ProgressBar current={7} total={7} />

      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.header}>
          <p className={styles.eyebrow}>Step 7 of 7 — Shows</p>
          <h2 className={styles.heading}>Your top 5 shows</h2>
          <p className={styles.sub}>
            Supporting signal only. Shows you&apos;d genuinely recommend — not
            critically-acclaimed ones you watched once.
          </p>
        </div>

        {/* Selected shows */}
        <div className={styles.selectedList}>
          <AnimatePresence>
            {selected.map((show, i) => (
              <motion.div
                key={show.id}
                className={styles.showCard}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ duration: 0.22 }}
                layout
              >
                <span className={styles.rankBadge}>{i + 1}</span>
                {show.posterUrl ? (
                  <img src={show.posterUrl} alt={show.name} className={styles.showPoster} />
                ) : (
                  <div className={styles.showPosterPlaceholder}>📺</div>
                )}
                <div className={styles.showInfo}>
                  <p className={styles.showName}>{show.name}</p>
                  {show.year && <p className={styles.showYear}>{show.year}</p>}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeShow(show.name)}
                  aria-label={`Remove ${show.name}`}
                >
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {selected.length < MAX && (
            <div className={styles.emptySlots}>
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={i} className={styles.emptySlot}>
                  <span className={styles.emptySlotNum}>{selected.length + i + 1}</span>
                  <span className={styles.emptySlotText}>
                    {selected.length + i === 0 ? "Search for your #1…" : "Add another…"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        {selected.length < MAX && (
          <div className={styles.searchWrapper}>
            <input
              ref={inputRef}
              className={styles.searchInput}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shows…"
              autoComplete="off"
            />

            <AnimatePresence>
              {(suggestions.length > 0 || searching) && (
                <motion.div
                  className={styles.suggestions}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {searching && (
                    <p className={styles.searchingText}>Searching…</p>
                  )}
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className={styles.suggestion}
                      onClick={() => addShow(s)}
                    >
                      {s.posterUrl ? (
                        <img src={s.posterUrl} alt={s.name} className={styles.suggestionPoster} />
                      ) : (
                        <div className={styles.suggestionPoster} style={{ background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          📺
                        </div>
                      )}
                      <div className={styles.suggestionInfo}>
                        <p className={styles.suggestionName}>{s.name}</p>
                        {s.year && <p className={styles.suggestionYear}>{s.year}</p>}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* CTA */}
        <div className={styles.cta}>
          <button
            className={styles.nextBtn}
            disabled={selected.length === 0}
            onClick={() => onNext(selected.map((s) => s.name))}
          >
            Get My Result →
          </button>
          {selected.length > 0 && selected.length < MAX && (
            <span className={styles.countHint}>
              {selected.length}/{MAX} added
            </span>
          )}
          {selected.length === 0 && (
            <p className={styles.skipHint}>At least one show required.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
