"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type {
  AppData,
  AppStep,
  BracketState,
  KOTHState,
  ActorGameState,
  Artist,
  Song,
  TypedResult,
} from "@/lib/types";
import { DEFAULT_APP_DATA, buildInitialBracket } from "@/lib/types";

import LandingScreen from "@/components/Landing/LandingScreen";
import ProcessingScreen from "@/components/Processing/ProcessingScreen";
import ResultScreen from "@/components/Result/ResultScreen";
import MusicGenresStep from "@/components/steps/MusicGenres/MusicGenresStep";
import TopArtistsStep from "@/components/steps/TopArtists/TopArtistsStep";
import SongBracketStep from "@/components/steps/SongBracket/SongBracketStep";
import MovieGenresStep from "@/components/steps/MovieGenres/MovieGenresStep";
import ActorGameStep from "@/components/steps/ActorGame/ActorGameStep";
import MovieKOTHStep from "@/components/steps/MovieKOTH/MovieKOTHStep";
import TopShowsStep from "@/components/steps/TopShows/TopShowsStep";

const LS_KEY = "typed_session_v2";
const LS_STEP_KEY = "typed_step_v2";

const STEP_BG: Record<AppStep, string> = {
  "landing":      "#c026d3",
  "music-genres": "#7c3aed",
  "top-artists":  "#e11d48",
  "song-bracket": "#1d4ed8",
  "movie-genres": "#059669",
  "actor-game":   "#0f172a",
  "movie-koth":   "#4338ca",
  "top-shows":    "#d97706",
  "processing":   "#c026d3",
  "result":       "#7e22ce",
};


export default function Home() {
  const [step, setStep] = useState<AppStep>("landing");
  const [appData, setAppData] = useState<AppData>(DEFAULT_APP_DATA);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetchingPool, setIsFetchingPool] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    try { setHasProgress(!!localStorage.getItem(LS_KEY)); } catch { /* ignore */ }
  }, []);

  // Keep html + body background in sync so safe-area / overscroll matches the step colour
  useEffect(() => {
    setBg(step);
  }, [step]);

  function setBg(s: AppStep) {
    const color = STEP_BG[s];
    document.documentElement.style.background = color;
    document.body.style.background = color;
  }

  function saveToStorage(s: AppStep, d: AppData) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(d));
      localStorage.setItem(LS_STEP_KEY, s);
    } catch { /* ignore */ }
  }

  function clearStorage() {
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_STEP_KEY);
    } catch { /* ignore */ }
  }

  function loadFromStorage(): { step: AppStep; data: AppData } | null {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const savedStep = localStorage.getItem(LS_STEP_KEY) as AppStep | null;
      if (!raw || !savedStep) return null;
      return { step: savedStep, data: JSON.parse(raw) as AppData };
    } catch { return null; }
  }

  function go(nextStep: AppStep) {
    setBg(nextStep);
    setStep(nextStep);
    saveToStorage(nextStep, appData);
  }

  function update(partial: Partial<AppData>, nextStep?: AppStep) {
    setAppData((prev) => {
      const next = { ...prev, ...partial };
      const s = nextStep ?? step;
      saveToStorage(s, next);
      return next;
    });
    if (nextStep) { setBg(nextStep); setStep(nextStep); }
  }

  // ── Song pool ────────────────────────────────────────────────────────────────
  async function fetchSongPoolAndGo(artists: Artist[], genres: string[]) {
    setIsFetchingPool(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/music/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistNames: artists.map((a) => a.name), genres }),
      });
      const data = await res.json();
      const songs: Song[] = data.songs ?? [];
      const enrichedArtists: Artist[] = data.enrichedArtists ?? artists;

      if (songs.length < 16) {
        setFetchError("Couldn't load enough songs. Try different artists.");
        setIsFetchingPool(false);
        return;
      }

      const bracket = buildInitialBracket(songs);
      update({ songPool: songs, bracketState: bracket, topArtists: enrichedArtists }, "song-bracket");
    } catch {
      setFetchError("Failed to load songs. Check your connection.");
    } finally {
      if (mountedRef.current) setIsFetchingPool(false);
    }
  }

  // ── Result generation ────────────────────────────────────────────────────────
  async function generateResult(data: AppData) {
    try {
      const res = await fetch("/api/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appData: data }),
      });
      const json = await res.json();
      const result: TypedResult = json.result;
      if (mountedRef.current) {
        update({ finalResult: result }, "result");
        clearStorage();
      }
    } catch {
      if (mountedRef.current) go("result");
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Step handlers ─────────────────────────────────────────────────────────────
  function handleStart() {
    clearStorage();
    setAppData(DEFAULT_APP_DATA);
    go("music-genres");
  }

  function handleRestore() {
    const saved = loadFromStorage();
    if (!saved) return;
    setAppData(saved.data);
    setStep(saved.step);
  }

  function handleMusicGenres(genres: string[], subgenres: Record<string, string[]>) {
    update({ musicGenres: genres, musicSubgenres: subgenres }, "top-artists");
  }

  function handleTopArtists(artists: Artist[]) {
    update({ topArtists: artists });
    fetchSongPoolAndGo(artists, appData.musicGenres);
  }

  function handleBracketComplete(bracket: BracketState) {
    update({ bracketState: bracket }, "movie-genres");
  }

  function handleMovieGenres(genres: string[], genreIds: number[]) {
    update({ movieGenres: genres, movieGenreIds: genreIds }, "actor-game");
  }

  function handleActorGameComplete(actorState: ActorGameState) {
    update({ actorGameState: actorState }, "movie-koth");
  }

  function handleKOTHComplete(kothState: KOTHState) {
    update({ kothState }, "top-shows");
  }

  function handleTopShows(shows: string[]) {
    const nextData: AppData = { ...appData, topShows: shows };
    setAppData(nextData);
    saveToStorage("processing", nextData);
    setBg("processing");
    setStep("processing");
    generateResult(nextData);
  }

  function handleRetake() {
    clearStorage();
    setAppData(DEFAULT_APP_DATA);
    setBg("landing");
    setStep("landing");
  }

  const variants = {
    initial: { opacity: 0, y: 24, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit:    { opacity: 0, y: -24, scale: 1.01 },
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          {step === "landing" && (
            <LandingScreen
              onStart={handleStart}
              hasProgress={hasProgress}
              onRestore={handleRestore}
            />
          )}

          {step === "music-genres" && (
            <MusicGenresStep onNext={handleMusicGenres} />
          )}

          {step === "top-artists" && (
            <div>
              <TopArtistsStep onNext={handleTopArtists} initialArtists={appData.topArtists} />
              {isFetchingPool && (
                <div style={{
                  position: "fixed", inset: 0,
                  background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 16, zIndex: 200,
                }}>
                  <p style={{ color: "#fff", fontWeight: 900, fontSize: "1.5rem" }}>Building your bracket…</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>Fetching songs…</p>
                </div>
              )}
              {fetchError && (
                <div style={{
                  position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
                  background: "#ef4444", color: "#fff", padding: "12px 24px",
                  borderRadius: 12, fontWeight: 700, zIndex: 200,
                }}>
                  {fetchError}
                </div>
              )}
            </div>
          )}

          {step === "song-bracket" && appData.bracketState && (
            <SongBracketStep bracket={appData.bracketState} onComplete={handleBracketComplete} />
          )}

          {step === "movie-genres" && (
            <MovieGenresStep onNext={handleMovieGenres} />
          )}

          {step === "actor-game" && (
            <ActorGameStep
              movieGenreIds={appData.movieGenreIds}
              onComplete={handleActorGameComplete}
            />
          )}

          {step === "movie-koth" && (
            <MovieKOTHStep
              movieGenreIds={appData.movieGenreIds}
              keptActorIds={appData.actorGameState?.kept.map((a) => a.id) ?? []}
              onComplete={handleKOTHComplete}
            />
          )}

          {step === "top-shows" && (
            <TopShowsStep onNext={handleTopShows} />
          )}

          {step === "processing" && <ProcessingScreen />}

          {step === "result" && appData.finalResult && (
            <ResultScreen result={appData.finalResult} onRetake={handleRetake} />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
