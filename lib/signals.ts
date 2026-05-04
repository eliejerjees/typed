import type {
  AppData,
  BracketState,
  MediaKBCState,
  Actor,
  Movie,
  Song,
} from "./types";

// ─── TMDB genre map ───────────────────────────────────────────────────────────

const TMDB_GENRE_NAMES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
  10752: "War", 37: "Western",
  10759: "Action & Adventure", 10765: "Sci-Fi & Fantasy",
};

export function genreNamesFromIds(ids: number[]): string[] {
  return ids.map((id) => TMDB_GENRE_NAMES[id]).filter(Boolean);
}

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
  keptMovieGenreNames: string[];
  cutMovieGenreNames: string[];
  movieMoodSignal: string;
  movieVarietySignal: string;
  movieDecadeLean: string;

  // Show KBC
  keptShows: Movie[];
  showTopGenreIds: string[];
  keptShowGenreNames: string[];

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
  const moodyKeywords      = ["sad", "soul", "blues", "slow", "folk", "acoustic", "melancholy", "emo", "indie", "dream", "ambient", "lo-fi", "r&b"];
  const highEnergyKeywords = ["punk", "metal", "hip-hop", "rap", "edm", "dance", "pop", "trap", "house", "techno", "club", "drill"];
  const introspectiveKeywords = ["indie", "alternative", "jazz", "classical", "post-", "progressive", "art"];

  let moodyScore = 0, energyScore = 0, introspectiveScore = 0;
  moodyKeywords.forEach((k)        => { if (allGenres.includes(k)) moodyScore++; });
  highEnergyKeywords.forEach((k)   => { if (allGenres.includes(k)) energyScore++; });
  introspectiveKeywords.forEach((k) => { if (allGenres.includes(k)) introspectiveScore++; });

  if (moodyScore > energyScore && moodyScore > introspectiveScore) return "leans emotional/moody";
  if (energyScore > moodyScore && energyScore > introspectiveScore) return "leans high-energy/hype";
  if (introspectiveScore > 0) return "leans introspective/atmospheric";
  return "balanced energy range";
}

function detectMediaMood(kbcState: MediaKBCState, statedGenreIds: number[]): string {
  const darkGenres      = [27, 53, 9648];
  const heavyGenres     = [18, 36];
  const spectacleGenres = [28, 12, 878, 14];
  const lightGenres     = [35, 10749, 10751];

  const net = { dark: 0, spectacle: 0, light: 0, heavy: 0 };

  kbcState.kept.forEach((m) => {
    m.genreIds.forEach((id) => {
      if (darkGenres.includes(id))      net.dark      += 1;
      if (spectacleGenres.includes(id)) net.spectacle += 1;
      if (lightGenres.includes(id))     net.light     += 1;
      if (heavyGenres.includes(id))     net.heavy     += 1;
    });
  });

  kbcState.cut.forEach((m) => {
    m.genreIds.forEach((id) => {
      if (darkGenres.includes(id))      net.dark      -= 0.5;
      if (spectacleGenres.includes(id)) net.spectacle -= 0.5;
      if (lightGenres.includes(id))     net.light     -= 0.5;
      if (heavyGenres.includes(id))     net.heavy     -= 0.5;
    });
  });

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

function topGenreNames(movies: Movie[], n = 4): string[] {
  const freq: Record<number, number> = {};
  movies.forEach((m) => {
    m.genreIds.forEach((id) => {
      freq[id] = (freq[id] ?? 0) + 1;
    });
  });
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([id]) => TMDB_GENRE_NAMES[Number(id)])
    .filter(Boolean);
}

function computeDecadeLean(movies: Movie[]): string {
  if (movies.length === 0) return "unknown";
  const counts = { recent: 0, mid: 0, classic: 0 };
  movies.forEach((m) => {
    if (m.year >= 2015)      counts.recent++;
    else if (m.year >= 2000) counts.mid++;
    else if (m.year > 0)     counts.classic++;
  });
  const max = Math.max(counts.recent, counts.mid, counts.classic);
  if (counts.recent === max) return "skews recent (2015+)";
  if (counts.mid === max)    return "skews 2000s–2010s";
  return "includes classics (pre-2000)";
}

function detectContradictions(data: AppData): string[] {
  const contradictions: string[] = [];
  if (!data.bracketState || !data.movieKbcState) return contradictions;

  const artistGenres = data.topArtists.flatMap((a) => a.tags);
  const musicMood    = detectMusicMood(data.bracketState, artistGenres);
  const movieMood    = detectMediaMood(data.movieKbcState, data.movieGenreIds);

  if (musicMood.includes("high-energy") && movieMood.includes("dark/psychological")) {
    contradictions.push("Your music says you want energy and momentum — your movie choices say you want dread and moral complexity.");
  }
  if (musicMood.includes("emotional/moody") && movieMood.includes("spectacle")) {
    contradictions.push("You seek intimacy in music but spectacle in film. You're two different people depending on the medium.");
  }
  if (musicMood.includes("introspective") && movieMood.includes("spectacle")) {
    contradictions.push("You think quietly but watch loudly.");
  }

  const statedMusicGenres = data.musicGenres.map((g) => g.toLowerCase());
  const bracketWinnerArtistGenres =
    data.topArtists.find((a) => a.name === data.bracketState?.winner?.artistId)?.tags ?? [];
  const claimsMainstream = statedMusicGenres.some((g) => ["pop", "hip-hop", "rap"].includes(g));
  const winnerIsNiche    = bracketWinnerArtistGenres.some((g) =>
    ["indie", "alternative", "folk", "jazz", "classical", "ambient"].some((k) => g.includes(k))
  );
  if (claimsMainstream && winnerIsNiche) {
    contradictions.push("You said mainstream, but when it came to picking a winner you went niche. Your stated taste and your actual taste aren't the same.");
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
  const keptMovies         = data.movieKbcState?.kept ?? [];
  const cutMovies          = data.movieKbcState?.cut  ?? [];
  const movieTopGenreIds   = topGenreIds(keptMovies);
  const keptMovieGenreNames = topGenreNames(keptMovies, 5);
  const cutMovieGenreNames  = topGenreNames(cutMovies, 3);
  const movieDecadeLean    = computeDecadeLean(keptMovies);

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
  const keptShows          = data.showKbcState?.kept ?? [];
  const showTopGenreIds    = topGenreIds(keptShows);
  const keptShowGenreNames = topGenreNames(keptShows, 4);

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
    keptMovieGenreNames,
    cutMovieGenreNames,
    movieMoodSignal,
    movieVarietySignal,
    movieDecadeLean,
    keptShows,
    showTopGenreIds,
    keptShowGenreNames,
    contradictions,
  };
}
