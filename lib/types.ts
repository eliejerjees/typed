// ─── App Flow ────────────────────────────────────────────────────────────────

export type AppStep =
  | "landing"
  | "music-genres"
  | "top-artists"
  | "song-bracket"
  | "media-preference"
  | "movie-genres"
  | "actor-koth"
  | "movie-kbc"
  | "show-kbc"
  | "processing"
  | "result";

export type MediaPreference = "movies" | "shows" | "both";

export const STEP_COLORS: Record<AppStep, string> = {
  landing:            "#c026d3",
  "music-genres":     "#7c3aed",
  "top-artists":      "#e11d48",
  "song-bracket":     "#1d4ed8",
  "media-preference": "#0f172a",
  "movie-genres":     "#059669",
  "actor-koth":       "#312e81",
  "movie-kbc":        "#14532d",
  "show-kbc":         "#78350f",
  processing:         "#7e22ce",
  result:             "#c026d3",
};

// ─── Music Types ─────────────────────────────────────────────────────────────

export interface Artist {
  name: string;
  mbid?: string;
  tags: string[];
  imageUrl?: string;
  listeners?: number;
}

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
  seeds: Song[];
  rounds: BracketMatchup[][];
  currentRound: number;
  currentMatchup: number;
  winner: Song | null;
  allChoices: Array<{ winner: Song; loser: Song; round: number }>;
}

// ─── Movie / Show Types ───────────────────────────────────────────────────────
// Shows reuse this shape — TMDB `name` is mapped to `title`

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

// ─── Actor King of the Hill ───────────────────────────────────────────────────

export interface ActorKOTHRound {
  champion: Actor;
  challenger: Actor;
  winner: Actor;
}

export interface ActorKOTHState {
  champion: Actor | null;
  challengerQueue: Actor[];
  round: number;
  history: ActorKOTHRound[];
}

// ─── Media Keep / Bench / Cut ─────────────────────────────────────────────────
// Used for both movies and shows

export type MediaBucket = "keep" | "bench" | "cut";

export interface MediaAssignment {
  item: Movie;
  bucket: MediaBucket;
}

export interface MediaKBCRound {
  items: Movie[];
  assignments: MediaAssignment[];
}

export interface MediaKBCState {
  rounds: MediaKBCRound[];
  currentRound: number;
  kept: Movie[];
  benched: Movie[];
  cut: Movie[];
}

// ─── App Data (full session state) ────────────────────────────────────────────

export interface AppData {
  // Music
  musicGenres: string[];
  musicSubgenres: Record<string, string[]>;
  topArtists: Artist[];
  songPool: Song[];
  bracketState: BracketState | null;

  // Media preference
  mediaPreference: MediaPreference | null;

  // Genres (inform both movie and show pools)
  movieGenres: string[];
  movieGenreIds: number[];

  // Actor King of the Hill
  actorKothState: ActorKOTHState | null;

  // Movie Keep / Bench / Cut
  movieKbcState: MediaKBCState | null;

  // Show Keep / Bench / Cut
  showKbcState: MediaKBCState | null;

  // Result
  finalResult: TypedResult | null;
}

export const DEFAULT_APP_DATA: AppData = {
  musicGenres: [],
  musicSubgenres: {},
  topArtists: [],
  songPool: [],
  bracketState: null,
  mediaPreference: null,
  movieGenres: [],
  movieGenreIds: [],
  actorKothState: null,
  movieKbcState: null,
  showKbcState: null,
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

export interface ResultResponse {
  result: TypedResult;
}

// ─── Bracket helpers ──────────────────────────────────────────────────────────

export function buildInitialBracket(songs: Song[]): BracketState {
  if (songs.length < 16) {
    throw new Error("Need at least 16 songs to build bracket");
  }
  const seeds = songs.slice(0, 16);

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

export function advanceBracket(state: BracketState, winner: Song): BracketState {
  const loser =
    state.rounds[state.currentRound][state.currentMatchup].songA.id === winner.id
      ? state.rounds[state.currentRound][state.currentMatchup].songB
      : state.rounds[state.currentRound][state.currentMatchup].songA;

  const newRounds = state.rounds.map((r) => [...r]);
  newRounds[state.currentRound] = [...newRounds[state.currentRound]];
  newRounds[state.currentRound][state.currentMatchup] = {
    ...newRounds[state.currentRound][state.currentMatchup],
    winner,
  };

  const newChoices = [...state.allChoices, { winner, loser, round: state.currentRound }];
  const roundMatchups = newRounds[state.currentRound].length;
  const isLastMatchupInRound = state.currentMatchup === roundMatchups - 1;

  if (isLastMatchupInRound) {
    const nextRound = state.currentRound + 1;
    if (nextRound <= 3) {
      const roundWinners = newRounds[state.currentRound].map((m) => m.winner!);
      const nextMatchups: BracketMatchup[] = [];
      for (let i = 0; i < roundWinners.length; i += 2) {
        nextMatchups.push({ songA: roundWinners[i], songB: roundWinners[i + 1], winner: null });
      }
      newRounds[nextRound] = nextMatchups;
      return {
        ...state,
        rounds: newRounds,
        currentRound: nextRound,
        currentMatchup: 0,
        allChoices: newChoices,
        winner: nextRound > 3 ? winner : null,
      };
    } else {
      return { ...state, rounds: newRounds, allChoices: newChoices, winner };
    }
  }

  return { ...state, rounds: newRounds, currentMatchup: state.currentMatchup + 1, allChoices: newChoices };
}

export function isBracketComplete(state: BracketState): boolean {
  return state.winner !== null;
}
