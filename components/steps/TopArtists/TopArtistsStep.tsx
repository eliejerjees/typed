"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Artist } from "@/lib/types";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./TopArtistsStep.module.css";

const MAX = 5;

interface Props {
  onNext: (artists: Artist[]) => void;
  initialArtists?: Artist[];
}

function formatListeners(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M listeners`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K listeners`;
  return `${n} listeners`;
}

export default function TopArtistsStep({ onNext, initialArtists = [] }: Props) {
  const [selected, setSelected] = useState<Artist[]>(initialArtists);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Artist[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const already = new Set(selected.map((a) => a.name.toLowerCase()));
      setSuggestions(
        (data.artists ?? []).filter((a: Artist) => !already.has(a.name.toLowerCase()))
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
    searchTimer.current = setTimeout(() => search(query), 320);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, search]);

  function addArtist(artist: Artist) {
    if (selected.length >= MAX) return;
    if (selected.find((a) => a.name.toLowerCase() === artist.name.toLowerCase())) return;
    setSelected((prev) => [...prev, artist]);
    setQuery("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function removeArtist(name: string) {
    setSelected((prev) => prev.filter((a) => a.name !== name));
  }

  const emptySlots = Math.max(0, MAX - selected.length);

  return (
    <div className={styles.container}>
      <ProgressBar current={2} total={7} />

      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.header}>
          <p className={styles.eyebrow}>Step 2 of 7 — Music</p>
          <h2 className={styles.heading}>Your top 5 artists</h2>
          <p className={styles.sub}>
            These are your anchors — artists you actually come back to. Not your
            most-impressive pick, your most-played.
          </p>
        </div>

        {/* Selected artists */}
        <div className={styles.selectedList}>
          <AnimatePresence>
            {selected.map((artist, i) => (
              <motion.div
                key={`${artist.name}-${i}`}
                className={styles.artistCard}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ duration: 0.25 }}
                layout
              >
                <span className={styles.rankBadge}>{i + 1}</span>
                {artist.imageUrl ? (
                  <img src={artist.imageUrl} alt={artist.name} className={styles.artistAvatar} />
                ) : (
                  <div className={styles.artistAvatarPlaceholder}>🎵</div>
                )}
                <div className={styles.artistInfo}>
                  <p className={styles.artistName}>{artist.name}</p>
                  {artist.listeners ? (
                    <p className={styles.artistGenres}>{formatListeners(artist.listeners)}</p>
                  ) : artist.tags.length > 0 ? (
                    <p className={styles.artistGenres}>{artist.tags.slice(0, 2).join(", ")}</p>
                  ) : null}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeArtist(artist.name)}
                  aria-label={`Remove ${artist.name}`}
                >
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty placeholder slots */}
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
              placeholder="Search artists…"
              autoComplete="off"
            />

            <AnimatePresence>
              {(suggestions.length > 0 || searching) && (
                <motion.div
                  className={styles.suggestions}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {searching && (
                    <p className={styles.searchingText}>Searching…</p>
                  )}
                  {suggestions.map((a, i) => (
                    <div
                      key={`${a.name}-${i}`}
                      className={styles.suggestion}
                      onClick={() => addArtist(a)}
                    >
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt={a.name} className={styles.suggestionAvatar} />
                      ) : (
                        <div
                          className={styles.suggestionAvatar}
                          style={{ background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}
                        >
                          🎵
                        </div>
                      )}
                      <div className={styles.suggestionInfo}>
                        <p className={styles.suggestionName}>{a.name}</p>
                        {a.listeners ? (
                          <p className={styles.suggestionGenre}>{formatListeners(a.listeners)}</p>
                        ) : null}
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
            onClick={() => onNext(selected)}
          >
            {selected.length >= MAX ? "Build My Bracket →" : "Continue →"}
          </button>
          {selected.length > 0 && selected.length < MAX && (
            <span className={styles.countHint}>
              {selected.length}/{MAX} added
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
