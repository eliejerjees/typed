"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./MovieGenresStep.module.css";

const MAX = 3;

interface TMDBGenre { id: number; name: string; }

interface Props {
  onNext: (genres: string[], genreIds: number[]) => void;
}

export default function MovieGenresStep({ onNext }: Props) {
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tmdb/genres")
      .then((r) => r.json())
      .then((d) => setGenres(d.genres ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX) return prev;
      return [...prev, id];
    });
  }

  function handleNext() {
    const names = selected.map((id) => genres.find((g) => g.id === id)?.name ?? "");
    onNext(names, selected);
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
      <ProgressBar current={4} total={7} />

      <motion.div
        className={styles.inner}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.header}>
          <p className={styles.eyebrow}>Step 4 of 7 — Movies</p>
          <h2 className={styles.heading}>Pick your movie genres</h2>
          <p className={styles.sub}>
            Choose up to 3. The genres you actually seek out, not the ones that
            seem impressive.
          </p>
        </div>

        <p className={styles.selectedCount}>
          {selected.length}/{MAX} selected
        </p>

        <div className={styles.genreGrid}>
          {genres.map((g, i) => {
            const isSelected = selected.includes(g.id);
            const isDisabled = !isSelected && selected.length >= MAX;
            return (
              <motion.button
                key={g.id}
                className={`${styles.genreChip} ${isSelected ? styles.genreChipSelected : ""} ${isDisabled ? styles.genreChipDisabled : ""}`}
                onClick={() => !isDisabled && toggle(g.id)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
              >
                {g.name}
              </motion.button>
            );
          })}
        </div>

        <button
          className={styles.nextBtn}
          disabled={selected.length === 0}
          onClick={handleNext}
        >
          Next →
        </button>
      </motion.div>
    </div>
  );
}
