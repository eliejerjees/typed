import type {
  AppData,
  BracketState,
  KOTHState,
  Song,
  Movie,
} from "./types";

// ─── Behavioral signal computation ───────────────────────────────────────────
// These heuristics turn raw game data into qualitative signals
// that the LLM can interpret more meaningfully.

export interface ComputedSignals {
  // Music
  bracketWinner: Song | null;
  bracketRunnerUp: Song | null;
  bracketTopGenres: string[];
  musicMoodSignal: string; // e.g. "leans emotional/moody", "leans high-energy"
  musicVarietySignal: string; // e.g. "consistent genre focus", "eclectic range"

  // Movies
  kothChampion: Movie | null;
  kothTopGenres: string[];
  movieMoodSignal: string; // e.g. "prefers dark/psychological", "favors spectacle"
  movieVarietySignal: string;

  // Actors
  keptActorTypes: string[];
  cutActorTypes: string[];

  // Cross-signal
  contradictions: string[];
}

function getSongFromHistory(
  bracketState: BracketState,
  round: number
): Song | null {
  const finalRound = bracketState.rounds[3];
  if (!finalRound || finalRound.length === 0) return null;
  const finalMatchup = finalRound[0];
  if (round === 3) return finalMatchup.winner;
  if (round === 2) {
    // Runner up: loser of the final
    if (!finalMatchup.winner) return null;
    return finalMatchup.songA.id === finalMatchup.winner.id
      ? finalMatchup.songB
      : finalMatchup.songA;
  }
  return null;
}

function detectMusicMood(bracketState: BracketState, artistGenres: string[]): string {
  const choices = bracketState.allChoices;
  if (choices.length === 0) return "unclear";

  // Simple heuristic: look for genre keywords in artist genres
  const allGenres = artistGenres.join(" ").toLowerCase();

  const moodyKeywords = ["sad", "soul", "blues", "slow", "folk", "acoustic", "melancholy", "emo", "indie", "dream", "ambient", "lo-fi", "r&b"];
  const highEnergyKeywords = ["punk", "metal", "hip-hop", "rap", "edm", "dance", "pop", "trap", "house", "techno", "club", "drill"];
  const introspectiveKeywords = ["indie", "alternative", "jazz", "classical", "post-", "progressive", "art"];

  let moodyScore = 0;
  let energyScore = 0;
  let introspectiveScore = 0;

  moodyKeywords.forEach((k) => { if (allGenres.includes(k)) moodyScore++; });
  highEnergyKeywords.forEach((k) => { if (allGenres.includes(k)) energyScore++; });
  introspectiveKeywords.forEach((k) => { if (allGenres.includes(k)) introspectiveScore++; });

  if (moodyScore > energyScore && moodyScore > introspectiveScore) return "leans emotional/moody";
  if (energyScore > moodyScore && energyScore > introspectiveScore) return "leans high-energy/hype";
  if (introspectiveScore > 0) return "leans introspective/atmospheric";
  return "balanced energy range";
}

function detectMovieMood(kothState: KOTHState, movieGenreIds: number[]): string {
  // TMDB genre IDs: 27=Horror, 53=Thriller, 18=Drama, 28=Action, 35=Comedy, 10749=Romance, 878=Sci-Fi
  const darkGenres = [27, 53, 9648]; // horror, thriller, mystery
  const heavyGenres = [18, 36]; // drama, history
  const spectacleGenres = [28, 12, 878, 14]; // action, adventure, sci-fi, fantasy
  const lightGenres = [35, 10749, 10751]; // comedy, romance, family

  const champion = kothState.history[kothState.history.length - 1]?.winner;
  if (!champion) return "unclear";

  let darkScore = 0;
  let spectacleScore = 0;
  let lightScore = 0;
  let heavyScore = 0;

  // Weight all movies that won at least one round
  const winners = kothState.history.map((h) => h.winner);
  winners.forEach((m) => {
    m.genreIds.forEach((id) => {
      if (darkGenres.includes(id)) darkScore++;
      if (spectacleGenres.includes(id)) spectacleScore++;
      if (lightGenres.includes(id)) lightScore++;
      if (heavyGenres.includes(id)) heavyScore++;
    });
  });

  // Also weight stated genre preferences
  movieGenreIds.forEach((id) => {
    if (darkGenres.includes(id)) darkScore += 0.5;
    if (spectacleGenres.includes(id)) spectacleScore += 0.5;
    if (lightGenres.includes(id)) lightScore += 0.5;
    if (heavyGenres.includes(id)) heavyScore += 0.5;
  });

  const max = Math.max(darkScore, spectacleScore, lightScore, heavyScore);
  if (max === 0) return "balanced range";
  if (darkScore === max) return "prefers dark/psychological stories";
  if (spectacleScore === max) return "drawn to spectacle and scale";
  if (heavyScore === max) return "favors heavy, prestige-style dramas";
  return "prefers lighter, crowd-pleasing fare";
}

function detectContradictions(data: AppData): string[] {
  const contradictions: string[] = [];

  if (!data.bracketState || !data.kothState) return contradictions;

  // Music vs movie tone mismatch
  const artistGenres = data.topArtists.flatMap((a) => a.tags);
  const musicMood = detectMusicMood(data.bracketState, artistGenres);
  const movieMood = detectMovieMood(data.kothState, data.movieGenreIds);

  if (
    musicMood.includes("high-energy") &&
    movieMood.includes("dark/psychological")
  ) {
    contradictions.push(
      "Claims high-energy music taste but consistently chose dark, psychological films."
    );
  }

  if (
    musicMood.includes("emotional/moody") &&
    movieMood.includes("spectacle")
  ) {
    contradictions.push(
      "Music choices lean emotional and intimate, but movie picks favor spectacle and scale."
    );
  }

  // Stated genres vs actual behavior
  const statedMusicGenres = data.musicGenres.map((g) => g.toLowerCase());
  const bracketWinnerArtistGenres = data.topArtists
    .find((a) => a.name === data.bracketState?.winner?.artistId)
    ?.tags ?? [];

  const claimsMainstream = statedMusicGenres.some((g) =>
    ["pop", "hip-hop", "rap"].includes(g)
  );
  const winnerIsNiche = bracketWinnerArtistGenres.some((g) =>
    ["indie", "alternative", "folk", "jazz", "classical", "ambient"].some((k) =>
      g.includes(k)
    )
  );

  if (claimsMainstream && winnerIsNiche) {
    contradictions.push(
      "Claimed mainstream music taste but bracket behavior consistently favored niche/indie choices."
    );
  }

  return contradictions;
}

export function computeSignals(data: AppData): ComputedSignals {
  const bracketWinner = data.bracketState?.winner ?? null;
  const artistGenres = data.topArtists.flatMap((a) => a.tags);

  let bracketRunnerUp: Song | null = null;
  let bracketTopGenres: string[] = [];
  if (data.bracketState) {
    bracketRunnerUp = getSongFromHistory(data.bracketState, 2);
    // Top genres from artists that had songs survive deep in bracket
    const deepChoices = data.bracketState.allChoices.filter(
      (c) => c.round >= 2
    );
    const artistNames = deepChoices.map((c) => c.winner.artistId);
    const artistTagMap: Record<string, string[]> = {};
    data.topArtists.forEach((a) => {
      artistTagMap[a.name] = a.tags;
    });
    const genreFreq: Record<string, number> = {};
    artistNames.forEach((name) => {
      (artistTagMap[name] ?? []).forEach((g) => {
        genreFreq[g] = (genreFreq[g] ?? 0) + 1;
      });
    });
    bracketTopGenres = Object.entries(genreFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([g]) => g);
  }

  const kothChampion =
    data.kothState?.history[data.kothState.history.length - 1]?.winner ?? null;
  let kothTopGenres: string[] = [];
  if (data.kothState) {
    const genreFreq: Record<string, number> = {};
    data.kothState.history.forEach((h, i) => {
      const weight = i + 1; // later wins weighted more
      h.winner.genreIds.forEach((id) => {
        genreFreq[String(id)] = (genreFreq[String(id)] ?? 0) + weight;
      });
    });
    kothTopGenres = Object.entries(genreFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);
  }

  const keptActorTypes = (data.actorGameState?.kept ?? [])
    .flatMap((a) => a.knownFor)
    .slice(0, 5);
  const cutActorTypes = (data.actorGameState?.cut ?? [])
    .flatMap((a) => a.knownFor)
    .slice(0, 5);

  const musicMoodSignal = data.bracketState
    ? detectMusicMood(data.bracketState, artistGenres)
    : "unknown";
  const musicVarietySignal = (() => {
    const uniqueGenres = new Set(artistGenres);
    if (uniqueGenres.size > 10) return "eclectic genre range";
    if (uniqueGenres.size > 5) return "moderately varied";
    return "focused/consistent genre taste";
  })();

  const movieMoodSignal =
    data.kothState
      ? detectMovieMood(data.kothState, data.movieGenreIds)
      : "unknown";
  const movieVarietySignal = (() => {
    if (!data.kothState) return "unknown";
    const uniqueGenres = new Set(
      data.kothState.history.flatMap((h) => h.winner.genreIds)
    );
    if (uniqueGenres.size > 4) return "wide movie genre range";
    if (uniqueGenres.size > 2) return "moderately varied";
    return "narrow/consistent genre taste";
  })();

  const contradictions = detectContradictions(data);

  return {
    bracketWinner,
    bracketRunnerUp,
    bracketTopGenres,
    musicMoodSignal,
    musicVarietySignal,
    kothChampion,
    kothTopGenres,
    movieMoodSignal,
    movieVarietySignal,
    keptActorTypes,
    cutActorTypes,
    contradictions,
  };
}
