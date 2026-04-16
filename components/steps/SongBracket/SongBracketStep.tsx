"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BracketState, Song } from "@/lib/types";
import { advanceBracket, isBracketComplete } from "@/lib/types";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./SongBracketStep.module.css";

const ROUND_NAMES = ["Round of 16", "Quarterfinals", "Semifinals", "Final"];
const ROUND_SHORT = ["R16", "QF", "SF", "Final"];

interface Props {
  bracket: BracketState;
  onComplete: (bracket: BracketState) => void;
}

export default function SongBracketStep({ bracket: initial, onComplete }: Props) {
  const [bracket, setBracket] = useState(initial);
  const [animating, setAnimating] = useState(false);
  const [lastPicked, setLastPicked] = useState<string | null>(null);

  const done = isBracketComplete(bracket);
  const currentMatchup = done
    ? null
    : bracket.rounds[bracket.currentRound]?.[bracket.currentMatchup];

  function pick(song: Song) {
    if (animating || done) return;
    setAnimating(true);
    setLastPicked(song.id);
    setTimeout(() => {
      const next = advanceBracket(bracket, song);
      setBracket(next);
      setLastPicked(null);
      setAnimating(false);
    }, 350);
  }

  // Progress: total matchups across all rounds = 8+4+2+1 = 15
  const totalMatchups = 15;
  const completedMatchups = bracket.allChoices.length;
  const progressPct = Math.round((completedMatchups / totalMatchups) * 100);

  return (
    <div className={styles.container}>
      <ProgressBar current={3} total={7} label={`Bracket ${progressPct}%`} />

      <div className={styles.layout}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className={styles.eyebrow}>Step 3 of 7 — Music</p>
          <h2 className={styles.heading}>Song Bracket</h2>
          {!done && currentMatchup && (
            <p className={styles.roundLabel}>
              {ROUND_NAMES[bracket.currentRound]} — Match{" "}
              {bracket.currentMatchup + 1} of{" "}
              {bracket.rounds[bracket.currentRound].length}
            </p>
          )}
        </motion.div>

        {/* Round strip */}
        <div className={styles.bracketStrip}>
          {ROUND_SHORT.map((name, r) => {
            const matchupCount = [8, 4, 2, 1][r];
            const roundDone = bracket.currentRound > r || done;
            const roundActive = !done && bracket.currentRound === r;
            return (
              <div key={r} className={styles.stripRound}>
                {r > 0 && <div className={styles.stripSep} />}
                {Array.from({ length: matchupCount }).map((_, m) => {
                  const slotDone = roundDone || (roundActive && m < bracket.currentMatchup);
                  const slotActive = roundActive && m === bracket.currentMatchup;
                  return (
                    <div
                      key={m}
                      className={`${styles.stripDot} ${slotDone ? styles.stripDotDone : ""} ${slotActive ? styles.stripDotActive : ""}`}
                    />
                  );
                })}
                <span className={styles.stripLabel}>{name}</span>
              </div>
            );
          })}
        </div>

        {/* Matchup or complete */}
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="complete"
              className={styles.completeOverlay}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
            >
              <p className={styles.completeTitle}>
                🏆 Your bracket champion
              </p>
              {bracket.winner && (
                <div className={styles.completeWinner}>
                  {bracket.winner.albumCover ? (
                    <img
                      src={bracket.winner.albumCover}
                      alt={bracket.winner.title}
                      className={styles.completeAlbum}
                    />
                  ) : null}
                  <p className={styles.completeSongName}>{bracket.winner.title}</p>
                  <p className={styles.completeArtist}>{bracket.winner.artist}</p>
                </div>
              )}
              <button
                className={styles.completeBtn}
                onClick={() => onComplete(bracket)}
              >
                Next Step →
              </button>
            </motion.div>
          ) : (
            currentMatchup && (
              <motion.div
                key={`${bracket.currentRound}-${bracket.currentMatchup}`}
                className={styles.matchup}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SongCard
                  song={currentMatchup.songA}
                  onPick={() => pick(currentMatchup.songA)}
                  picked={lastPicked === currentMatchup.songA.id}
                  dimmed={lastPicked !== null && lastPicked !== currentMatchup.songA.id}
                />

                <div className={styles.vs}>VS</div>

                <SongCard
                  song={currentMatchup.songB}
                  onPick={() => pick(currentMatchup.songB)}
                  picked={lastPicked === currentMatchup.songB.id}
                  dimmed={lastPicked !== null && lastPicked !== currentMatchup.songB.id}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Bracket map */}
        {!done && (
          <div className={styles.bracketMap}>
            <p className={styles.bracketMapTitle}>Bracket Progress</p>
            {ROUND_SHORT.map((name, r) => {
              const matchups = bracket.rounds[r] ?? [];
              if (r > bracket.currentRound && matchups.length === 0) return null;
              const roundMatchupCount = [8, 4, 2, 1][r];
              return (
                <div key={r} className={styles.bracketRoundRow}>
                  <span className={styles.bracketRoundName}>{name}</span>
                  <div className={styles.bracketSlots}>
                    {Array.from({ length: roundMatchupCount }).map((_, m) => {
                      const matchup = matchups[m];
                      const isActive =
                        !done &&
                        bracket.currentRound === r &&
                        bracket.currentMatchup === m;
                      const isDone = matchup?.winner != null;
                      return (
                        <div
                          key={m}
                          className={`${styles.bracketSlotChip} ${isActive ? styles.bracketSlotChipActive : ""} ${isDone ? styles.bracketSlotChipDone : ""}`}
                        >
                          <span
                            className={`${styles.bracketSlotText} ${isActive ? styles.bracketSlotTextActive : ""}`}
                          >
                            {isDone
                              ? matchup.winner!.title.slice(0, 10)
                              : isActive
                              ? "→ NOW"
                              : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SongCard({
  song,
  onPick,
  picked,
  dimmed,
}: {
  song: Song;
  onPick: () => void;
  picked: boolean;
  dimmed: boolean;
}) {
  return (
    <motion.button
      className={`${styles.songCard} ${picked ? styles.winnerCard : ""}`}
      onClick={onPick}
      animate={{
        opacity: dimmed ? 0.3 : 1,
        scale: picked ? 1.03 : 1,
      }}
      transition={{ duration: 0.25 }}
    >
      {song.albumCover ? (
        <img src={song.albumCover} alt={song.title} className={styles.albumCover} />
      ) : (
        <div className={styles.albumCoverPlaceholder}>🎵</div>
      )}
      <div className={styles.songInfo}>
        <p className={styles.songTitle}>{song.title}</p>
        <p className={styles.songArtist}>{song.artist}</p>
      </div>
      <span className={styles.chooseArrow}>›</span>
    </motion.button>
  );
}
