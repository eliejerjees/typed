import type { AppData } from "./types";
import { CORE_TYPES } from "./types";
import { computeSignals } from "./signals";

export function buildResultPrompt(data: AppData): string {
  const s = computeSignals(data);

  const payload = {
    allowedCoreTypes: CORE_TYPES,

    musicData: {
      topArtists: data.topArtists.map((a) => ({
        name: a.name,
        genres: a.tags.slice(0, 4),
      })),
      statedGenres: data.musicGenres,
      bracketWinner: s.bracketWinner
        ? { title: s.bracketWinner.title, artist: s.bracketWinner.artist }
        : null,
      bracketRunnerUp: s.bracketRunnerUp
        ? { title: s.bracketRunnerUp.title, artist: s.bracketRunnerUp.artist }
        : null,
      bracketTopGenres: s.bracketTopGenres,
      computedMood: s.musicMoodSignal,
      computedVariety: s.musicVarietySignal,
    },

    actorData: {
      kothChampion: s.actorKothChampion
        ? { name: s.actorKothChampion.name, knownFor: s.actorKothChampion.knownFor }
        : null,
    },

    movieData: {
      keptMovies: s.keptMovies.slice(0, 10).map((m) => ({ title: m.title, year: m.year })),
      cutMovies:  s.cutMovies.slice(0, 6).map((m)  => ({ title: m.title, year: m.year })),
      statedGenres: data.movieGenres,
      dominantGenres: s.keptMovieGenreNames,
      rejectedGenres: s.cutMovieGenreNames,
      computedMood: s.movieMoodSignal,
      decadeLean: s.movieDecadeLean,
    },

    showData: {
      keptShows: s.keptShows.slice(0, 8).map((m) => ({ title: m.title, year: m.year })),
      dominantGenres: s.keptShowGenreNames,
    },

    precomputedContradictions: s.contradictions,

    outputSchema: {
      coreType: "Exactly one of allowedCoreTypes",
      subType: "2–5 words. Specific to this person's actual data. Think of it as their specific flavor of the type — punchy, no filler.",
      hook: "1–2 sentences. Sharp, casual, direct. Drop into their head and say the true thing. No motivational poster language. No therapy-speak. Write it like a text message from someone who just figured them out.",
      traits: "Array of 5–6 short behavioral descriptors. Specific behaviors, not personality adjectives. 'skips the setup, needs the payoff' not 'impatient'. 'picks the villain's logic over the hero's feelings' not 'analytical'.",
      receipts: "Array of 3–4 strings. At least 2 must name actual titles from keptMovies, keptShows, or artists. State what that choice says about them — casually, directly. No AI formulas. Example: 'kept Succession, Ozark, and The Social Network — all about people with too much ambition and not enough self-awareness. relatable.'",
      patterns: "Array of 4–5 strings starting with 'you prefer', 'you choose', 'you avoid', or 'you don't have patience for'. Psychological not genre-based. 'you prefer escalation over resolution' not 'you prefer action over drama'. No hedging.",
      contradiction: "1 sentence. The uncomfortable true thing that creates tension between two real patterns. Make it sting a little. 'your music is chaotic and your movie taste is obsessed with control. one of these is lying.' not 'you appreciate both intensity and calm.'",
      mostLike: {
        character: "A specific famous character or real person. Can be fictional or real.",
        sourceTitle: "ONLY if the character is from a specific movie or TV show, include the exact title here. Leave null for real people (e.g., Elon Musk) or characters whose source is ambiguous.",
        explanation: "2 sentences. Why, based on their actual behavioral patterns — not just vibes. Casual, a little funny if it fits. No 'both are ambitious' — say what specific thing makes them alike."
      },
      predictions: {
        wouldLove: "Specific title or very specific type of content with a brief reason. 'Nightcrawler — it's basically a tutorial on how you think' not just 'psychological thrillers'",
        wouldntEnjoy: "1 sentence, specific reason based on their patterns.",
        wouldNeverFinish: "Type of content + brief reason. Casual tone."
      },
      recommendations: {
        movies: "Array of 2–3 movie titles not in their keptMovies",
        artists: "Array of 2 artist names based on their music patterns",
        show: "1 show title not in their keptShows"
      },
      summary: "2–3 sentence backup. Same tone as hook.",
      musicBreakdown: "1–2 sentences. Reference specific artists or bracket winner. Casual.",
      movieBreakdown: "1–2 sentences. Reference specific titles. Casual.",
      contradictions: "Same as contradiction. Kept for compatibility."
    },
  };

  return JSON.stringify(payload, null, 2);
}

export const RESULT_SYSTEM_PROMPT = `You are Typed. You read what someone watched and listened to and tell them something true about themselves that they weren't fully aware of.

THE VOICE — THIS IS EVERYTHING:
Write like a sharp, funny person who just figured someone out and can't help but say it. Casual. Direct. A little sarcastic but not mean — the friend who roasts you because they're right, not because they're being cruel. Think: a very smart teenager who reads people well. Short sentences. No academic language. No therapy-speak. No corporate wellness tone. Lowercase is fine in informal sections.

BANNED PATTERNS — DO NOT WRITE THESE:
- "You don't just X; you Y" — this sounds like AI, kill it
- "It's not X; it's Y" — same problem
- "You are drawn to" — boring and vague
- "You appreciate the complexity of" — says nothing
- "You tend to" — hedge words, cut them
- "high-energy vibes" — meaningless
- Any sentence that sounds like it belongs on a personality quiz website
- Any two-part "not just X but also Y" construction

WHAT GOOD SOUNDS LIKE:
- "you kept every movie where the protagonist makes terrible decisions on purpose. there's something to unpack there."
- "your music taste has one mood: it's 2am and something went wrong. your movie taste is weirdly optimistic by comparison."
- "Tony Stark, basically. not the 'genius billionaire' part — the part where you walk into a room and immediately start ranking everyone by competence."
- "comfort feels like settling and you know it."
- "you have a thing against happy endings. not because you're dark, because they feel dishonest."

CRITICAL RULES:
1. RECEIPTS MUST NAME ACTUAL TITLES from the data. Don't say "your kept movies show a pattern" — say "you kept Succession and Ozark and called it a personality."
2. PATTERNS are psychological, not genre descriptions. "you prefer escalation" not "you prefer thrillers."
3. THE CONTRADICTION should make them go "...okay fine, that's true." One sentence, slightly uncomfortable.
4. MOST LIKE: behavioral reasoning only. Not surface resemblance.
5. NEVER invent titles. Only reference what's in the data.
6. Return ONLY valid JSON matching outputSchema. No markdown, no preamble, no explanation.`;
