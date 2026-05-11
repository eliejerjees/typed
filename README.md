# Typed

**Your taste has a type.** Typed is a personality quiz that analyzes your music and media preferences through a series of interactive games — a song bracket, actor King of the Hill, and movie/show Keep-Bench-Cut — then uses GPT-4o to assign you one of 16 personality archetypes based on your actual behavioral choices.

---

## How it works

The app runs users through 7 steps:

1. **Music Genres** — pick your top genres and subgenres
2. **Top Artists** — search and select up to 5 of your favorite artists (powered by Deezer)
3. **Song Bracket** — 16-song single-elimination bracket seeded from your artists via Last.fm
4. **Media Preference** — choose movies, shows, or both
5. **Movie Genres** — pick the genres that interest you
6. **Actor King of the Hill** — 10 rounds of head-to-head matchups using TMDB's most popular actors
7. **Movie / Show Keep-Bench-Cut** — drag each title into Keep, Bench, or Cut across 5 rounds of 3

After the last step, all session data is sent to GPT-4o, which produces a personality result including a type name, hook, behavioral patterns, a contradiction, a "you are most like" character (with poster), predictions, and recommendations.

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI / Animation | React + Framer Motion |
| Styling | CSS Modules |
| Music search | Deezer API (no auth required) |
| Music data + tags | Last.fm API |
| Album artwork | iTunes Search API (no auth required) |
| Movies / shows / actors | TMDB API |
| Personality result | OpenAI GPT-4o |
| Session persistence | localStorage (no backend, no account) |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| `LASTFM_API_KEY` | [last.fm/api](https://www.last.fm/api/account/create) |
| `TMDB_API_KEY` | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
  page.tsx                  # Main app — all step routing and state
  layout.tsx                # Root layout + metadata
  globals.css               # Design tokens (CSS custom properties)
  api/
    music/
      search/               # Artist search via Deezer
      pool/                 # Song pool via Last.fm + iTunes artwork
      genres/               # Music genre list
    tmdb/
      actor-pool/           # Top 50 famous actors via TMDB /person/popular
      movies/               # Movie pool for KBC (60 items, randomised pages)
      show-pool/            # Show pool for KBC (60 items, randomised pages)
      poster/               # Poster lookup by title (used for "most like" result)
      genres/               # TMDB movie genre list
    result/                 # GPT-4o personality result generation

components/
  Landing/                  # Landing screen
  Processing/               # Loading screen shown during result generation
  Result/                   # Final result display
  shared/
    ProgressBar/            # Step progress indicator
  steps/
    MusicGenres/            # Genre + subgenre selection
    TopArtists/             # Artist search and selection
    SongBracket/            # 16-song elimination bracket
    MediaPreference/        # Movies / shows / both selector
    MovieGenres/            # TMDB genre picker
    ActorKOTH/              # Actor King of the Hill game
    MediaKBC/               # Keep / Bench / Cut drag-and-drop (movies + shows)

lib/
  types.ts                  # All shared TypeScript types and interfaces
  signals.ts                # Signal computation from raw session data
  resultPrompt.ts           # Prompt builder + system prompt for GPT-4o
  lastfmClient.ts           # Last.fm API client
  tmdbClient.ts             # Shared TMDB fetch helper
  utils.ts                  # Shared utilities (shuffle)
```

---

## Session data

All user data is stored in `localStorage` under the key `typed_session_v3`. The app can restore an interrupted session on the landing screen. No data is sent anywhere except to the OpenAI API at the final step.

---

## Result generation

`lib/signals.ts` computes behavioral signals from the raw session data (music mood, movie tone, decade lean, genre frequency, contradictions). These signals plus the actual lists of kept/cut movie titles and chosen artists are bundled into a structured JSON payload and sent to GPT-4o with a strict system prompt that enforces casual, direct, non-generic language and a specific output schema.

The 16 possible core types are: The Main Character, The Strategist, The Escapist, The Lover, The Grinder, The Watcher, The Chaos Agent, The Perfectionist, The Minimalist, The Dreamer, The Control Freak, The Story Seeker, The Realist, The Empath, The Explorer, The Hedonist.
