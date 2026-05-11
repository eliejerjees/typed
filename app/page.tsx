"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type {
  AppData,
  AppStep,
  BracketState,
  ActorKOTHState,
  MediaKBCState,
  Artist,
  Song,
  TypedResult,
  MediaPreference,
} from "@/lib/types";
import { DEFAULT_APP_DATA, buildInitialBracket } from "@/lib/types";

import Link from "next/link";
import LandingScreen from "@/components/Landing/LandingScreen";
import ProcessingScreen from "@/components/Processing/ProcessingScreen";
import ResultScreen from "@/components/Result/ResultScreen";
import MusicGenresStep from "@/components/steps/MusicGenres/MusicGenresStep";
import TopArtistsStep from "@/components/steps/TopArtists/TopArtistsStep";
import SongBracketStep from "@/components/steps/SongBracket/SongBracketStep";
import MediaPreferenceStep from "@/components/steps/MediaPreference/MediaPreferenceStep";
import MovieGenresStep from "@/components/steps/MovieGenres/MovieGenresStep";
import ActorKOTHStep from "@/components/steps/ActorKOTH/ActorKOTHStep";
import MediaKBCStep from "@/components/steps/MediaKBC/MediaKBCStep";

const LS_KEY = "typed_session_v3";
const LS_STEP_KEY = "typed_step_v3";

const STEP_BG: Record<AppStep, string> = {
  "landing": "#c026d3",
  "music-genres": "#7c3aed",
  "top-artists": "#e11d48",
  "song-bracket": "#1d4ed8",
  "media-preference": "#0f172a",
  "movie-genres": "#059669",
  "actor-koth": "#312e81",
  "movie-kbc": "#14532d",
  "show-kbc": "#78350f",
  "processing": "#7e22ce",
  "result": "#c026d3",
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

  useEffect(() => { setBg(step); }, [step]);

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

  // ── Song pool ─────────────────────────────────────────────────────────────────
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
      const enrichedArtists = data.enrichedArtists ?? artists;

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

  // ── Result generation ─────────────────────────────────────────────────────────
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
    update({ bracketState: bracket }, "media-preference");
  }

  function handleMediaPreference(pref: MediaPreference) {
    update({ mediaPreference: pref }, "movie-genres");
  }

  function handleMovieGenres(genres: string[], genreIds: number[]) {
    // All paths → actor KOTH first, then KOTH champion personalises the media pool
    update({ movieGenres: genres, movieGenreIds: genreIds }, "actor-koth");
  }

  function handleActorKOTH(actorKothState: ActorKOTHState) {
    // After actor KOTH, route to movies or shows KBC (or movies first if both)
    const next = appData.mediaPreference === "shows" ? "show-kbc" : "movie-kbc";
    update({ actorKothState }, next);
  }

  function handleMovieKBC(movieKbcState: MediaKBCState) {
    if (appData.mediaPreference === "both") {
      update({ movieKbcState }, "show-kbc");
    } else {
      // movies only → done
      const nextData: AppData = { ...appData, movieKbcState };
      setAppData(nextData);
      saveToStorage("processing", nextData);
      setBg("processing");
      setStep("processing");
      generateResult(nextData);
    }
  }

  function handleShowKBC(showKbcState: MediaKBCState) {
    const nextData: AppData = { ...appData, showKbcState };
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
    exit: { opacity: 0, y: -24, scale: 1.01 },
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <Link
        href="/about"
        style={{
          position: "fixed",
          top: 24,
          right: 28,
          zIndex: 300,
          color: "rgba(255,255,255,0.8)",
          textDecoration: "none",
          fontWeight: 800,
          fontSize: "0.95rem",
          letterSpacing: "0.04em",
        }}
      >
        About
      </Link>
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

          {step === "media-preference" && (
            <MediaPreferenceStep onChoice={handleMediaPreference} />
          )}

          {step === "movie-genres" && (
            <MovieGenresStep onNext={handleMovieGenres} />
          )}

          {step === "actor-koth" && (
            <ActorKOTHStep onComplete={handleActorKOTH} />
          )}

          {step === "movie-kbc" && (
            <MediaKBCStep
              mediaType="movies"
              movieGenreIds={appData.movieGenreIds}
              actorKothChampionId={appData.actorKothState?.champion?.id ?? null}
              onComplete={handleMovieKBC}
            />
          )}

          {step === "show-kbc" && (
            <MediaKBCStep
              mediaType="shows"
              movieGenreIds={appData.movieGenreIds}
              actorKothChampionId={appData.actorKothState?.champion?.id ?? null}
              onComplete={handleShowKBC}
            />
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
