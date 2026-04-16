// ─── App Flow ────────────────────────────────────────────────────────────────

export type AppStep =
  | "landing"
  | "music-genres"
  | "top-artists"
  | "song-bracket"
  | "movie-genres"
  | "actor-game"
  | "movie-koth"
  | "top-shows"
  | "processing"
  | "result";

export const STEP_ORDER: AppStep[] = [
  "landing",
  "music-genres",
  "top-artists",
  "song-bracket",
  "movie-genres",
  "actor-game",
  "movie-koth",
  "top-shows",
  "processing",
  "result",
];

export const STEP_COLORS: Record<AppStep, string> = {
  landing: "#c026d3",
  "music-genres": "#7c3aed",
  "top-artists": "#e11d48",
  "song-bracket": "#1d4ed8",
  "movie-genres": "#059669",
  "actor-game": "#ea580c",
  "movie-koth": "#4338ca",
  "top-shows": "#d97706",
  processing: "#7e22ce",
  result: "#c026d3",
};

// ─── Music Types ─────────────────────────────────────────────────────────────

export interface Artist {
  name: string;          // Primary identifier — Last.fm uses artist names
  mbid?: string;         // Last.fm MBID (optional, not always present)
  tags: string[];        // Last.fm tags = genres
  imageUrl?: string;
  listeners?: number;
}

// Kept for backwards compat in any code that still uses the old name
export type SpotifyArtist = Artist;

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  albumCover: string;
  previewUrl?: string;
}

// ─── Bracket Types ────────────────────────────────────────────────────────────

export interface BracketMatchup {
  songA: Song;
  songB: Song;
  winner: Song | null;
}

export interface BracketSlot {
  song: Song | null;
  isEliminated: boolean;
}

export interface BracketState {
  seeds: Song[]; // 16 songs, indexed 0-15
  // rounds[0] = R16 (8 matchups), [1] = QF (4), [2] = SF (2), [3] = Final (1)
  rounds: BracketMatchup[][];
  currentRound: number;
  currentMatchup: number;
  winner: Song | null;
  // Full history for signal computation
  allChoices: Array<{ winner: Song; loser: Song; round: number }>;
}

// ─── Movie Types ──────────────────────────────────────────────────────────────

export interface Movie {
  id: number;
  title: string;
  posterUrl: string;
  genreIds: number[];
  year: number;
  overview?: string;
}

// ─── Actor Types ──────────────────────────────────────────────────────────────

export interface Actor {
  id: number;
  name: string;
  imageUrl: string;
  knownFor: string[];
}

export type ActorBucket = "keep" | "bench" | "cut";

export interface ActorAssignment {
  actor: Actor;
  bucket: ActorBucket;
}

export interface ActorRound {
  actors: Actor[];
  assignments: ActorAssignment[];
}

export interface ActorGameState {
  rounds: ActorRound[];
  currentRound: number; // 0-4
  kept: Actor[];
  benched: Actor[];
  cut: Actor[];
}

// ─── King of the Hill Types ───────────────────────────────────────────────────

export interface KOTHRound {
  champion: Movie;
  challenger: Movie;
  winner: Movie;
}

export interface KOTHState {
  champion: Movie | null;
  challengerQueue: Movie[];
  round: number; // 1-10
  history: KOTHRound[];
}

// ─── App Data (full session state) ────────────────────────────────────────────

export interface AppData {
  // Music
  musicGenres: string[];
  musicSubgenres: Record<string, string[]>;
  topArtists: Artist[];

  // Bracket
  songPool: Song[];
  bracketState: BracketState | null;

  // Movie
  movieGenres: string[];
  movieGenreIds: number[];

  // Actor game
  actorGameState: ActorGameState | null;

  // Movie KOTH
  moviePool: Movie[];
  kothState: KOTHState | null;

  // Shows
  topShows: string[];

  // Result
  finalResult: TypedResult | null;
}

export const DEFAULT_APP_DATA: AppData = {
  musicGenres: [],
  musicSubgenres: {},
  topArtists: [],
  songPool: [],
  bracketState: null,
  movieGenres: [],
  movieGenreIds: [],
  actorGameState: null,
  moviePool: [],
  kothState: null,
  topShows: [],
  finalResult: null,
};

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface TypedResult {
  coreType: string;
  subType: string;
  traits: string[];
  summary: string;
  musicBreakdown: string;
  movieBreakdown: string;
  contradictions: string;
}

export const CORE_TYPES = [
  "The Romantic",
  "The Realist",
  "The Explorer",
  "The Observer",
  "The Idealist",
  "The Perfectionist",
  "The Escapist",
  "The Controller",
  "The Provocateur",
  "The Minimalist",
  "The Collector",
  "The Maverick",
  "The Architect",
  "The Empath",
  "The Hedonist",
  "The Wanderer",
] as const;

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ArtistSearchResponse {
  artists: Artist[];
}

export interface SongPoolResponse {
  songs: Song[];
  enrichedArtists: Artist[];
}

export interface GenresResponse {
  genres: string[];
}

export interface TMDBGenresResponse {
  genres: Array<{ id: number; name: string }>;
}

export interface ActorPoolResponse {
  actors: Actor[];
}

export interface MoviePoolResponse {
  movies: Movie[];
}

export interface ResultResponse {
  result: TypedResult;
}

// ─── Bracket helpers ──────────────────────────────────────────────────────────

export function buildInitialBracket(songs: Song[]): BracketState {
  if (songs.length < 16) {
    throw new Error("Need at least 16 songs to build bracket");
  }
  const seeds = songs.slice(0, 16);

  // R16: 1v2, 3v4, 5v6, 7v8, 9v10, 11v12, 13v14, 15v16
  const r16: BracketMatchup[] = [];
  for (let i = 0; i < 16; i += 2) {
    r16.push({ songA: seeds[i], songB: seeds[i + 1], winner: null });
  }

  return {
    seeds,
    rounds: [r16, [], [], []],
    currentRound: 0,
    currentMatchup: 0,
    winner: null,
    allChoices: [],
  };
}

export function advanceBracket(
  state: BracketState,
  winner: Song
): BracketState {
  const loser =
    state.rounds[state.currentRound][state.currentMatchup].songA.id ===
    winner.id
      ? state.rounds[state.currentRound][state.currentMatchup].songB
      : state.rounds[state.currentRound][state.currentMatchup].songA;

  const newRounds = state.rounds.map((r) => [...r]);
  newRounds[state.currentRound] = [...newRounds[state.currentRound]];
  newRounds[state.currentRound][state.currentMatchup] = {
    ...newRounds[state.currentRound][state.currentMatchup],
    winner,
  };

  const newChoices = [
    ...state.allChoices,
    { winner, loser, round: state.currentRound },
  ];

  const roundMatchups = newRounds[state.currentRound].length;
  const isLastMatchupInRound =
    state.currentMatchup === roundMatchups - 1;

  if (isLastMatchupInRound) {
    // Build next round from winners
    const nextRound = state.currentRound + 1;
    if (nextRound <= 3) {
      const roundWinners = newRounds[state.currentRound].map((m) => m.winner!);
      const nextMatchups: BracketMatchup[] = [];
      for (let i = 0; i < roundWinners.length; i += 2) {
        nextMatchups.push({
          songA: roundWinners[i],
          songB: roundWinners[i + 1],
          winner: null,
        });
      }
      newRounds[nextRound] = nextMatchups;

      if (nextRound === 4) {
        // This was the final — shouldn't happen since final is round 3
        return { ...state, rounds: newRounds, allChoices: newChoices, winner };
      }

      return {
        ...state,
        rounds: newRounds,
        currentRound: nextRound,
        currentMatchup: 0,
        allChoices: newChoices,
        winner: nextRound > 3 ? winner : null,
      };
    } else {
      // Done — current round was the final
      return {
        ...state,
        rounds: newRounds,
        allChoices: newChoices,
        winner,
      };
    }
  }

  return {
    ...state,
    rounds: newRounds,
    currentMatchup: state.currentMatchup + 1,
    allChoices: newChoices,
  };
}

export function isBracketComplete(state: BracketState): boolean {
  return state.winner !== null;
}
