"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BracketState, Song } from "@/lib/types";
import { advanceBracket, isBracketComplete } from "@/lib/types";
import ProgressBar from "@/components/shared/ProgressBar/ProgressBar";
import styles from "./SongBracketStep.module.css";

const ROUND_LABELS = ["R16", "QF", "SF", "Final"];
const ROUND_NAMES  = ["Round of 16", "Quarterfinals", "Semifinals", "Final"];
const MATCHUP_COUNTS = [8, 4, 2, 1];

// Visual bracket constants
const H        = 500;   // total bracket height (px)
const SLOT_H   = 24;    // height of one song slot
const SLOT_GAP = 3;     // gap between the two slots in a matchup
const MATCHUP_H = SLOT_H * 2 + SLOT_GAP;
const ROUND_W  = 108;   // width of one round column
const GAP_W    = 22;    // width of the SVG connector between rounds

function centerY(round: number, idx: number): number {
  return H * (2 * idx + 1) / (2 * MATCHUP_COUNTS[round]);
}

// ─── Main component ───────────────────────────────────────────────────────────

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

  const totalMatchups  = 15;
  const progressPct    = Math.round((bracket.allChoices.length / totalMatchups) * 100);

  function pick(song: Song) {
    if (animating || done) return;
    setAnimating(true);
    setLastPicked(song.id);
    setTimeout(() => {
      setBracket(advanceBracket(bracket, song));
      setLastPicked(null);
      setAnimating(false);
    }, 320);
  }

  return (
    <div className={styles.container}>
      <ProgressBar current={3} total={7} label={`Bracket ${progressPct}%`} />

      <div className={styles.layout}>
        {/* Header */}
        <motion.div className={styles.header}
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <p className={styles.eyebrow}>Step 3 of 7 — Music</p>
          <h2 className={styles.heading}>Song Bracket</h2>
          {!done && currentMatchup && (
            <p className={styles.roundLabel}>
              {ROUND_NAMES[bracket.currentRound]} &mdash; Match{" "}
              {bracket.currentMatchup + 1} of {bracket.rounds[bracket.currentRound].length}
            </p>
          )}
        </motion.div>

        {/* Active matchup picker OR completion */}
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="complete" className={styles.completeOverlay}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 120 }}>
              <p className={styles.completeTitle}>Your bracket champion</p>
              {bracket.winner && (
                <div className={styles.completeWinner}>
                  {bracket.winner.albumCover && (
                    <img src={bracket.winner.albumCover} alt={bracket.winner.title}
                      className={styles.completeAlbum} />
                  )}
                  <p className={styles.completeSongName}>{bracket.winner.title}</p>
                  <p className={styles.completeArtist}>{bracket.winner.artist}</p>
                </div>
              )}
              <button className={styles.completeBtn} onClick={() => onComplete(bracket)}>
                Next Step →
              </button>
            </motion.div>
          ) : currentMatchup && (
            <motion.div key={`${bracket.currentRound}-${bracket.currentMatchup}`}
              className={styles.matchup}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.28 }}>
              <SongCard song={currentMatchup.songA} onPick={() => pick(currentMatchup.songA)}
                picked={lastPicked === currentMatchup.songA.id}
                dimmed={lastPicked !== null && lastPicked !== currentMatchup.songA.id} />
              <div className={styles.vs}>VS</div>
              <SongCard song={currentMatchup.songB} onPick={() => pick(currentMatchup.songB)}
                picked={lastPicked === currentMatchup.songB.id}
                dimmed={lastPicked !== null && lastPicked !== currentMatchup.songB.id} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual bracket */}
        {!done && <VisualBracket bracket={bracket} />}
      </div>
    </div>
  );
}

// ─── Visual bracket ───────────────────────────────────────────────────────────

function VisualBracket({ bracket }: { bracket: BracketState }) {
  const done = isBracketComplete(bracket);
  const totalW = 4 * ROUND_W + 3 * GAP_W;

  return (
    <div className={styles.bracketWrapper}>
      {/* Round labels header */}
      <div className={styles.bracketLabels} style={{ width: totalW }}>
        {ROUND_LABELS.map((lbl, r) => (
          <div key={r} style={{ width: ROUND_W, flexShrink: 0,
            marginLeft: r > 0 ? GAP_W : 0 }}
            className={`${styles.bracketLabelCell} ${bracket.currentRound === r && !done ? styles.bracketLabelActive : ""}`}>
            {lbl}
          </div>
        ))}
      </div>

      {/* Scrollable bracket body */}
      <div className={styles.bracketScroll}>
        <div style={{ width: totalW, height: H, display: "flex",
          flexDirection: "row", position: "relative", flexShrink: 0 }}>

          {[0, 1, 2, 3].map((r) => (
            <>
              {/* SVG connector gap before this round (skip first round) */}
              {r > 0 && (
                <svg key={`gap-${r}`} width={GAP_W} height={H}
                  style={{ flexShrink: 0, display: "block" }}>
                  {Array.from({ length: MATCHUP_COUNTS[r] }).map((_, pairIdx) => {
                    const y1   = centerY(r - 1, pairIdx * 2);
                    const y2   = centerY(r - 1, pairIdx * 2 + 1);
                    const yMid = centerY(r, pairIdx);
                    const xM   = GAP_W / 2;
                    return (
                      <g key={pairIdx}>
                        <path
                          d={`M 0 ${y1} H ${xM} V ${y2} H 0`}
                          fill="none"
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <line x1={xM} y1={yMid} x2={GAP_W} y2={yMid}
                          stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Round column */}
              <div key={`round-${r}`}
                style={{ width: ROUND_W, height: H, position: "relative", flexShrink: 0 }}>
                {Array.from({ length: MATCHUP_COUNTS[r] }).map((_, m) => {
                  const matchup = bracket.rounds[r]?.[m];
                  const cy = centerY(r, m);
                  const isActive = !done &&
                    bracket.currentRound === r && bracket.currentMatchup === m;
                  const isPast = bracket.currentRound > r ||
                    (bracket.currentRound === r && bracket.currentMatchup > m);

                  const songA = r === 0 ? bracket.seeds[m * 2]     : (matchup?.songA ?? null);
                  const songB = r === 0 ? bracket.seeds[m * 2 + 1] : (matchup?.songB ?? null);
                  const winner = matchup?.winner ?? null;

                  return (
                    <div key={m} style={{
                      position: "absolute",
                      top: cy - MATCHUP_H / 2,
                      left: 0, right: 0,
                    }}>
                      <BracketSlot song={songA}
                        isWinner={!!winner && winner.id === songA?.id}
                        isLoser={!!winner && winner.id !== songA?.id}
                        isActive={isActive} isPast={isPast} />
                      <div style={{ height: SLOT_GAP }} />
                      <BracketSlot song={songB}
                        isWinner={!!winner && winner.id === songB?.id}
                        isLoser={!!winner && winner.id !== songB?.id}
                        isActive={isActive} isPast={isPast} />
                    </div>
                  );
                })}
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bracket slot ─────────────────────────────────────────────────────────────

function BracketSlot({ song, isWinner, isLoser, isActive, isPast }: {
  song: Song | null;
  isWinner: boolean;
  isLoser: boolean;
  isActive: boolean;
  isPast: boolean;
}) {
  const cls = [
    styles.bSlot,
    isWinner ? styles.bSlotWinner : "",
    isLoser  ? styles.bSlotLoser  : "",
    isActive ? styles.bSlotActive : "",
    !song    ? styles.bSlotEmpty  : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls} style={{ height: SLOT_H }}>
      <span className={styles.bSlotText}>
        {song ? song.title : "TBD"}
      </span>
    </div>
  );
}

// ─── Song card (interactive picker) ──────────────────────────────────────────

function SongCard({ song, onPick, picked, dimmed }: {
  song: Song; onPick: () => void; picked: boolean; dimmed: boolean;
}) {
  return (
    <motion.button className={`${styles.songCard} ${picked ? styles.winnerCard : ""}`}
      onClick={onPick}
      animate={{ opacity: dimmed ? 0.3 : 1, scale: picked ? 1.03 : 1 }}
      transition={{ duration: 0.22 }}>
      {song.albumCover
        ? <img src={song.albumCover} alt={song.title} className={styles.albumCover} />
        : <div className={styles.albumCoverPlaceholder}>🎵</div>
      }
      <div className={styles.songInfo}>
        <p className={styles.songTitle}>{song.title}</p>
        <p className={styles.songArtist}>{song.artist}</p>
      </div>
      <span className={styles.chooseArrow}>›</span>
    </motion.button>
  );
}
