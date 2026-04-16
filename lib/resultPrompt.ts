import type { AppData } from "./types";
import { CORE_TYPES } from "./types";
import { computeSignals } from "./signals";

export function buildResultPrompt(data: AppData): string {
  const signals = computeSignals(data);

  const payload = {
    allowedCoreTypes: CORE_TYPES,
    interpretationPriority: {
      highest: ["song bracket winner and path", "movie king-of-the-hill champion and path"],
      strong: ["top 5 artists", "actor keep/bench/cut patterns"],
      moderate: ["music subgenres", "top 5 shows"],
      light: ["music genres", "movie genres"],
      note: "Behavioral patterns from games should heavily influence the result. Stated preferences matter but should not override clear behavioral signals.",
    },
    musicData: {
      statedGenres: data.musicGenres,
      statedSubgenres: data.musicSubgenres,
      topArtists: data.topArtists.map((a) => ({
        name: a.name,
        genres: a.tags.slice(0, 4),
      })),
      bracketWinner: signals.bracketWinner
        ? { title: signals.bracketWinner.title, artist: signals.bracketWinner.artist }
        : null,
      bracketRunnerUp: signals.bracketRunnerUp
        ? { title: signals.bracketRunnerUp.title, artist: signals.bracketRunnerUp.artist }
        : null,
      bracketTopGenres: signals.bracketTopGenres,
      computedMusicMood: signals.musicMoodSignal,
      computedMusicVariety: signals.musicVarietySignal,
    },
    movieData: {
      statedGenres: data.movieGenres,
      kothChampion: signals.kothChampion
        ? { title: signals.kothChampion.title, year: signals.kothChampion.year }
        : null,
      kothTopGenreIds: signals.kothTopGenres,
      keptActors: signals.keptActorTypes,
      cutActors: signals.cutActorTypes,
      computedMovieMood: signals.movieMoodSignal,
      computedMovieVariety: signals.movieVarietySignal,
    },
    showsData: {
      topShows: data.topShows,
    },
    computedContradictions: signals.contradictions,
    outputSchema: {
      coreType: "One of the allowedCoreTypes exactly",
      subType: "2–5 word personalized modifier (e.g. 'Late-Night Romantic', 'Dark-Leaning Minimalist')",
      traits: "Array of 3–5 short trait phrases",
      summary: "2–3 sentence overall personality summary. Fun, slightly blunt, feels personal.",
      musicBreakdown: "1–2 sentences specifically about their music taste and what it signals.",
      movieBreakdown: "1–2 sentences specifically about their movie/show taste and what it signals.",
      contradictions: "1 sentence noting any interesting contradictions. If none exist, say something lightly self-aware instead. Do NOT say 'No contradictions found'.",
    },
  };

  return JSON.stringify(payload, null, 2);
}

export const RESULT_SYSTEM_PROMPT = `You are Typed — a sharp, insightful media taste analyzer. You determine a person's personality type based on their music and movie preferences.

Your job is to produce ONE combined result that feels personal, slightly blunt, and like it actually "gets" the person.

Rules:
- Choose the coreType that best fits the behavioral patterns, not the stated preferences
- The subType should add a personal, specific modifier that makes the coreType feel tailored
- Traits should feel like real descriptors a friend might use, not academic labels
- Summary tone: fun, a little sharp, short. Not fluffy. Not corporate.
- The result should feel like it accurately reflects the person's actual taste, including their contradictions
- IMPORTANT: Return ONLY a JSON object matching the outputSchema. No markdown, no explanation, no preamble.`;
