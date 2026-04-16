"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./MusicGenresStep.module.css";

interface Props {
  onNext: (genres: string[], subgenres: Record<string, string[]>) => void;
}

const MAX_SUBGENRES_PER_GENRE = 3;

export default function MusicGenresStep({ onNext }: Props) {
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [subgenreMap, setSubgenreMap] = useState<Record<string, string[]>>({});
  const [selectedGenres, setSelectedGenres] = useState<[string, string, string]>(["", "", ""]);
  const [selectedSubs, setSelectedSubs] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/music/genres")
      .then((r) => r.json())
      .then((data) => {
        setAllGenres(data.genres ?? []);
        setSubgenreMap(data.subgenreMap ?? {});
      })
      .catch(() => {
        // Static fallback
        setAllGenres(["Pop", "Hip-Hop", "R&B", "Rock", "Alternative", "Indie", "Electronic", "Jazz", "Classical", "Metal", "Country", "Folk", "Soul", "Reggae", "Latin", "Punk", "Blues", "Funk", "Ambient", "K-Pop"]);
      })
      .finally(() => setLoading(false));
  }, []);

  function setGenre(index: 0 | 1 | 2, value: string) {
    const updated = [...selectedGenres] as [string, string, string];
    // Clear old genre's subs if genre changes
    if (updated[index] && updated[index] !== value) {
      setSelectedSubs((prev) => {
        const next = { ...prev };
        delete next[updated[index]];
        return next;
      });
    }
    updated[index] = value;
    setSelectedGenres(updated);
  }

  function toggleSub(genre: string, sub: string) {
    setSelectedSubs((prev) => {
      const current = prev[genre] ?? [];
      if (current.includes(sub)) {
        return { ...prev, [genre]: current.filter((s) => s !== sub) };
      }
      if (current.length >= MAX_SUBGENRES_PER_GENRE) return prev;
      return { ...prev, [genre]: [...current, sub] };
    });
  }

  const filledGenres = selectedGenres.filter(Boolean);
  const canContinue = filledGenres.length >= 1;

  // Available options for each slot (exclude already-picked in other slots)
  function availableFor(index: 0 | 1 | 2): string[] {
    const others = selectedGenres.filter((_, i) => i !== index).filter(Boolean);
    return allGenres.filter((g) => !others.includes(g));
  }

  function handleNext() {
    const genres = selectedGenres.filter(Boolean);
    const subs: Record<string, string[]> = {};
    genres.forEach((g) => {
      if (selectedSubs[g]?.length) subs[g] = selectedSubs[g];
    });
    onNext(genres, subs);
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.inner}>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading genres…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ProgressBar current={1} total={7} />

      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.header}>
          <p className={styles.eyebrow}>Step 1 of 7 — Music</p>
          <h2 className={styles.heading}>Pick your top music genres</h2>
          <p className={styles.sub}>
            Choose up to 3. Pick what you actually listen to most — not what you
            think sounds cool.
          </p>
        </div>

        <div className={styles.slots}>
          {([0, 1, 2] as const).map((i) => (
            <motion.div
              key={i}
              className={styles.slot}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <p className={styles.slotLabel}>
                {i === 0 ? "Primary genre" : i === 1 ? "Second genre" : "Third genre"}{" "}
                {i > 0 && <span style={{ opacity: 0.5 }}>(optional)</span>}
              </p>

              <select
                className={styles.select}
                value={selectedGenres[i]}
                onChange={(e) => setGenre(i, e.target.value)}
              >
                <option value="" disabled>
                  {i === 0 ? "Choose a genre…" : "Add another…"}
                </option>
                {availableFor(i).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {/* Subgenres */}
              {selectedGenres[i] && (subgenreMap[selectedGenres[i]] ?? []).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className={styles.subgenreHint}>
                    Subgenres{" "}
                    <span style={{ opacity: 0.6 }}>
                      — pick up to {MAX_SUBGENRES_PER_GENRE}
                    </span>
                  </p>
                  <div className={styles.subgenres} style={{ marginTop: 8 }}>
                    {(subgenreMap[selectedGenres[i]] ?? []).map((sub) => {
                      const active = (selectedSubs[selectedGenres[i]] ?? []).includes(sub);
                      return (
                        <button
                          key={sub}
                          className={`${styles.subgenreChip} ${active ? styles.subgenreChipActive : ""}`}
                          onClick={() => toggleSub(selectedGenres[i], sub)}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div className={styles.cta}>
          <button
            className={styles.nextBtn}
            disabled={!canContinue}
            onClick={handleNext}
          >
            Next →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
