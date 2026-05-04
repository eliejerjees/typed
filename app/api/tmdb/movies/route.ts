import { NextRequest, NextResponse } from "next/server";
import type { Movie } from "@/lib/types";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
  release_date: string;
  overview: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

async function tmdbFetch(path: string): Promise<unknown> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("Missing TMDB_API_KEY");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(
    `https://api.themoviedb.org/3${path}${sep}api_key=${apiKey}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

function rawToMovie(m: TMDBMovie): Movie {
  return {
    id: m.id,
    title: m.title,
    posterUrl: m.poster_path ? `${IMG_BASE}${m.poster_path}` : "",
    genreIds: m.genre_ids,
    year: m.release_date ? parseInt(m.release_date.slice(0, 4)) : 0,
    overview: m.overview,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    genreIds = [],
    actorId = null,
  }: { genreIds: number[]; actorId: number | null } = body;

  const collected: Movie[] = [];

  // Randomise which pages we pull so each session sees different movies
  const pageOffset = Math.floor(Math.random() * 4); // 0–3

  try {
    // ── 1. Genre-specific discover ────────────────────────────────────────────
    if (genreIds.length > 0) {
      const genreStr = genreIds.slice(0, 3).join(",");
      for (let i = 0; i < 4; i++) {
        const page = (pageOffset + i) % 8 + 1; // pages 1–8, offset per session
        try {
          const data = (await tmdbFetch(
            `/discover/movie?with_genres=${genreStr}&sort_by=vote_count.desc&vote_count.gte=1500&vote_average.gte=6.0&page=${page}`
          )) as { results: TMDBMovie[] };
          collected.push(...data.results.filter((m) => m.poster_path).map(rawToMovie));
        } catch { /* continue */ }
      }
    }

    // ── 2. All-time highly voted ──────────────────────────────────────────────
    for (let i = 0; i < 3; i++) {
      const page = (pageOffset + i) % 6 + 1;
      try {
        const data = (await tmdbFetch(
          `/discover/movie?sort_by=vote_count.desc&vote_count.gte=5000&vote_average.gte=6.5&page=${page}`
        )) as { results: TMDBMovie[] };
        collected.push(...data.results.filter((m) => m.poster_path).map(rawToMovie));
      } catch { /* continue */ }
    }

    // ── 3. Top rated (high score, not just blockbusters) ──────────────────────
    for (let i = 0; i < 3; i++) {
      const page = (pageOffset + i) % 6 + 1;
      try {
        const data = (await tmdbFetch(
          `/movie/top_rated?page=${page}`
        )) as { results: TMDBMovie[] };
        collected.push(
          ...data.results.filter((m) => m.poster_path && m.vote_count >= 500).map(rawToMovie)
        );
      } catch { /* continue */ }
    }

    // ── 4. Currently popular (recent titles people actually know) ─────────────
    for (let i = 0; i < 3; i++) {
      const page = (pageOffset + i) % 5 + 1;
      try {
        const data = (await tmdbFetch(`/movie/popular?page=${page}`)) as { results: TMDBMovie[] };
        collected.push(
          ...data.results.filter((m) => m.poster_path && m.vote_count >= 500).map(rawToMovie)
        );
      } catch { /* continue */ }
    }

    // ── 5. Actor KOTH champion's top movies ───────────────────────────────────
    if (actorId) {
      try {
        const data = (await tmdbFetch(`/person/${actorId}/movie_credits`)) as {
          cast: TMDBMovie[];
        };
        const movies = data.cast
          .filter((m) => m.poster_path && m.vote_count >= 500 && m.vote_average >= 6.0)
          .sort((a, b) => b.vote_count - a.vote_count)
          .slice(0, 10)
          .map(rawToMovie);
        collected.push(...movies);
      } catch { /* continue */ }
    }

    // ── Dedupe, shuffle, cap at 60 ────────────────────────────────────────────
    const seen = new Set<number>();
    const unique = collected.filter((m) => {
      if (seen.has(m.id) || !m.posterUrl) return false;
      seen.add(m.id);
      return true;
    });

    const pool = shuffle(unique).slice(0, 60);
    return NextResponse.json({ movies: pool });
  } catch (err) {
    console.error("[tmdb/movies]", err);
    return NextResponse.json({ movies: [] }, { status: 500 });
  }
}
