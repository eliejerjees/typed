import type {
  AppData,
  BracketState,
  MediaKBCState,
  Actor,
  Movie,
  Song,
} from "./types";

// ─── Behavioral signal computation ───────────────────────────────────────────

export interface ComputedSignals {
  // Music
  bracketWinner: Song | null;
  bracketRunnerUp: Song | null;
  bracketTopGenres: string[];
  musicMoodSignal: string;
  musicVarietySignal: string;

  // Actor KOTH
  actorKothChampion: Actor | null;

  // Movie KBC
  keptMovies: Movie[];
  cutMovies: Movie[];
  movieTopGenreIds: string[];
  movieMoodSignal: string;
  movieVarietySignal: string;

  // Show KBC
  keptShows: Movie[];
  showTopGenreIds: string[];

  // Cross-signal
  contradictions: string[];
}

function getSongFromHistory(bracketState: BracketState, round: number): Song | null {
  const finalRound = bracketState.rounds[3];
  if (!finalRound || finalRound.length === 0) return null;
  const finalMatchup = finalRound[0];
  if (round === 3) return finalMatchup.winner;
  if (round === 2) {
    if (!finalMatchup.winner) return null;
    return finalMatchup.songA.id === finalMatchup.winner.id
      ? finalMatchup.songB
      : finalMatchup.songA;
  }
  return null;
}

function detectMusicMood(bracketState: BracketState, artistGenres: string[]): string {
  const allGenres = artistGenres.join(" ").toLowerCase();
  const moodyKeywords    = ["sad", "soul", "blues", "slow", "folk", "acoustic", "melancholy", "emo", "indie", "dream", "ambient", "lo-fi", "r&b"];
  const highEnergyKeywords = ["punk", "metal", "hip-hop", "rap", "edm", "dance", "pop", "trap", "house", "techno", "club", "drill"];
  const introspectiveKeywords = ["indie", "alternative", "jazz", "classical", "post-", "progressive", "art"];

  let moodyScore = 0, energyScore = 0, introspectiveScore = 0;
  moodyKeywords.forEach((k) => { if (allGenres.includes(k)) moodyScore++; });
  highEnergyKeywords.forEach((k) => { if (allGenres.includes(k)) energyScore++; });
  introspectiveKeywords.forEach((k) => { if (allGenres.includes(k)) introspectiveScore++; });

  if (moodyScore > energyScore && moodyScore > introspectiveScore) return "leans emotional/moody";
  if (energyScore > moodyScore && energyScore > introspectiveScore) return "leans high-energy/hype";
  if (introspectiveScore > 0) return "leans introspective/atmospheric";
  return "balanced energy range";
}

function detectMediaMood(kbcState: MediaKBCState, statedGenreIds: number[]): string {
  // TMDB genre IDs: 27=Horror, 53=Thriller, 18=Drama, 28=Action, 35=Comedy, 10749=Romance, 878=Sci-Fi
  const darkGenres      = [27, 53, 9648];
  const heavyGenres     = [18, 36];
  const spectacleGenres = [28, 12, 878, 14];
  const lightGenres     = [35, 10749, 10751];

  const net = { dark: 0, spectacle: 0, light: 0, heavy: 0 };

  // Kept = positive signal
  kbcState.kept.forEach((m) => {
    m.genreIds.forEach((id) => {
      if (darkGenres.includes(id))      net.dark      += 1;
      if (spectacleGenres.includes(id)) net.spectacle += 1;
      if (lightGenres.includes(id))     net.light     += 1;
      if (heavyGenres.includes(id))     net.heavy     += 1;
    });
  });

  // Cut = negative signal (half weight so kept dominates)
  kbcState.cut.forEach((m) => {
    m.genreIds.forEach((id) => {
      if (darkGenres.includes(id))      net.dark      -= 0.5;
      if (spectacleGenres.includes(id)) net.spectacle -= 0.5;
      if (lightGenres.includes(id))     net.light     -= 0.5;
      if (heavyGenres.includes(id))     net.heavy     -= 0.5;
    });
  });

  // Stated genres add a light nudge
  statedGenreIds.forEach((id) => {
    if (darkGenres.includes(id))      net.dark      += 0.3;
    if (spectacleGenres.includes(id)) net.spectacle += 0.3;
    if (lightGenres.includes(id))     net.light     += 0.3;
    if (heavyGenres.includes(id))     net.heavy     += 0.3;
  });

  const max = Math.max(net.dark, net.spectacle, net.light, net.heavy);
  if (max <= 0) return "balanced range";
  if (net.dark === max)      return "prefers dark/psychological stories";
  if (net.spectacle === max) return "drawn to spectacle and scale";
  if (net.heavy === max)     return "favors heavy, prestige-style dramas";
  return "prefers lighter, crowd-pleasing fare";
}

function topGenreIds(movies: Movie[], n = 3): string[] {
  const freq: Record<string, number> = {};
  movies.forEach((m) => {
    m.genreIds.forEach((id) => {
      freq[String(id)] = (freq[String(id)] ?? 0) + 1;
    });
  });
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([id]) => id);
}

function detectContradictions(data: AppData): string[] {
  const contradictions: string[] = [];
  if (!data.bracketState || !data.movieKbcState) return contradictions;

  const artistGenres = data.topArtists.flatMap((a) => a.tags);
  const musicMood = detectMusicMood(data.bracketState, artistGenres);
  const movieMood = detectMediaMood(data.movieKbcState, data.movieGenreIds);

  if (musicMood.includes("high-energy") && movieMood.includes("dark/psychological")) {
    contradictions.push("Claims high-energy music taste but consistently chose dark, psychological films.");
  }
  if (musicMood.includes("emotional/moody") && movieMood.includes("spectacle")) {
    contradictions.push("Music choices lean emotional and intimate, but movie picks favour spectacle and scale.");
  }

  const statedMusicGenres = data.musicGenres.map((g) => g.toLowerCase());
  const bracketWinnerArtistGenres =
    data.topArtists.find((a) => a.name === data.bracketState?.winner?.artistId)?.tags ?? [];
  const claimsMainstream = statedMusicGenres.some((g) => ["pop", "hip-hop", "rap"].includes(g));
  const winnerIsNiche = bracketWinnerArtistGenres.some((g) =>
    ["indie", "alternative", "folk", "jazz", "classical", "ambient"].some((k) => g.includes(k))
  );
  if (claimsMainstream && winnerIsNiche) {
    contradictions.push("Claimed mainstream music taste but bracket behaviour consistently favoured niche/indie choices.");
  }

  return contradictions;
}

export function computeSignals(data: AppData): ComputedSignals {
  // ── Music ────────────────────────────────────────────────────────────────────
  const bracketWinner = data.bracketState?.winner ?? null;
  const artistGenres  = data.topArtists.flatMap((a) => a.tags);

  let bracketRunnerUp: Song | null = null;
  let bracketTopGenres: string[] = [];
  if (data.bracketState) {
    bracketRunnerUp = getSongFromHistory(data.bracketState, 2);
    const deepChoices = data.bracketState.allChoices.filter((c) => c.round >= 2);
    const artistTagMap: Record<string, string[]> = {};
    data.topArtists.forEach((a) => { artistTagMap[a.name] = a.tags; });
    const genreFreq: Record<string, number> = {};
    deepChoices.map((c) => c.winner.artistId).forEach((name) => {
      (artistTagMap[name] ?? []).forEach((g) => {
        genreFreq[g] = (genreFreq[g] ?? 0) + 1;
      });
    });
    bracketTopGenres = Object.entries(genreFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([g]) => g);
  }

  const musicMoodSignal = data.bracketState
    ? detectMusicMood(data.bracketState, artistGenres)
    : "unknown";
  const musicVarietySignal = (() => {
    const uniqueGenres = new Set(artistGenres);
    if (uniqueGenres.size > 10) return "eclectic genre range";
    if (uniqueGenres.size > 5)  return "moderately varied";
    return "focused/consistent genre taste";
  })();

  // ── Actor KOTH ───────────────────────────────────────────────────────────────
  const actorKothChampion = data.actorKothState?.champion ?? null;

  // ── Movie KBC ────────────────────────────────────────────────────────────────
  const keptMovies = data.movieKbcState?.kept ?? [];
  const cutMovies  = data.movieKbcState?.cut  ?? [];
  const movieTopGenreIds = topGenreIds(keptMovies);

  const movieMoodSignal = data.movieKbcState
    ? detectMediaMood(data.movieKbcState, data.movieGenreIds)
    : "unknown";
  const movieVarietySignal = (() => {
    if (!data.movieKbcState) return "unknown";
    const unique = new Set(keptMovies.flatMap((m) => m.genreIds));
    if (unique.size > 4) return "wide movie genre range";
    if (unique.size > 2) return "moderately varied";
    return "narrow/consistent genre taste";
  })();

  // ── Show KBC ─────────────────────────────────────────────────────────────────
  const keptShows     = data.showKbcState?.kept ?? [];
  const showTopGenreIds = topGenreIds(keptShows);

  const contradictions = detectContradictions(data);

  return {
    bracketWinner,
    bracketRunnerUp,
    bracketTopGenres,
    musicMoodSignal,
    musicVarietySignal,
    actorKothChampion,
    keptMovies,
    cutMovies,
    movieTopGenreIds,
    movieMoodSignal,
    movieVarietySignal,
    keptShows,
    showTopGenreIds,
    contradictions,
  };
}
