import { NextRequest, NextResponse } from "next/server";
import type { Movie } from "@/lib/types";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const SHARED_GENRE_IDS = new Set([
  16, 18, 35, 80, 99, 9648, 10749, 37, 27, 53,
]);

const MOVIE_TO_TV_GENRE: Record<number, number> = {
  28:  10759,
  12:  10759,
  878: 10765,
  14:  10765,
};

interface TMDBShow {
  id: number;
  name: string;
  poster_path: string | null;
  genre_ids: number[];
  first_air_date: string;
  overview: string;
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

function rawToShow(s: TMDBShow): Movie {
  return {
    id: s.id,
    title: s.name,
    posterUrl: s.poster_path ? `${IMG_BASE}${s.poster_path}` : "",
    genreIds: s.genre_ids,
    year: s.first_air_date ? parseInt(s.first_air_date.slice(0, 4)) : 0,
    overview: s.overview,
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
  const body = await req.json().catch(() => ({}));
  const {
    movieGenreIds = [],
    actorId = null,
  }: { movieGenreIds: number[]; actorId: number | null } = body;

  const collected: Movie[] = [];

  // Randomise page start so each session gets different shows
  const pageOffset = Math.floor(Math.random() * 4);

  try {
    // ── 1. Genre-matched shows ────────────────────────────────────────────────
    if (movieGenreIds.length > 0) {
      const tvGenreIds = movieGenreIds.flatMap((id) => {
        if (SHARED_GENRE_IDS.has(id)) return [id];
        if (MOVIE_TO_TV_GENRE[id]) return [MOVIE_TO_TV_GENRE[id]];
        return [];
      });
      const uniqueTvGenres = [...new Set(tvGenreIds)];

      if (uniqueTvGenres.length > 0) {
        const genreStr = uniqueTvGenres.slice(0, 3).join(",");
        for (let i = 0; i < 4; i++) {
          const page = (pageOffset + i) % 8 + 1;
          try {
            const data = (await tmdbFetch(
              `/discover/tv?with_genres=${genreStr}&sort_by=vote_count.desc&vote_count.gte=150&vote_average.gte=6.5&page=${page}`
            )) as { results: TMDBShow[] };
            collected.push(...data.results.filter((s) => s.poster_path).map(rawToShow));
          } catch { /* continue */ }
        }
      }
    }

    // ── 2. All-time highly voted shows ────────────────────────────────────────
    for (let i = 0; i < 3; i++) {
      const page = (pageOffset + i) % 6 + 1;
      try {
        const data = (await tmdbFetch(
          `/discover/tv?sort_by=vote_count.desc&vote_count.gte=500&vote_average.gte=7.0&page=${page}`
        )) as { results: TMDBShow[] };
        collected.push(...data.results.filter((s) => s.poster_path).map(rawToShow));
      } catch { /* continue */ }
    }

    // ── 3. Top rated TV (high score, not just popular) ────────────────────────
    for (let i = 0; i < 3; i++) {
      const page = (pageOffset + i) % 6 + 1;
      try {
        const data = (await tmdbFetch(`/tv/top_rated?page=${page}`)) as { results: TMDBShow[] };
        collected.push(
          ...data.results.filter((s) => s.poster_path && s.vote_count >= 150).map(rawToShow)
        );
      } catch { /* continue */ }
    }

    // ── 4. Currently popular TV ───────────────────────────────────────────────
    for (let i = 0; i < 3; i++) {
      const page = (pageOffset + i) % 5 + 1;
      try {
        const data = (await tmdbFetch(`/tv/popular?page=${page}`)) as { results: TMDBShow[] };
        collected.push(
          ...data.results.filter((s) => s.poster_path && s.vote_count >= 100).map(rawToShow)
        );
      } catch { /* continue */ }
    }

    // ── 5. Actor KOTH champion's shows ────────────────────────────────────────
    if (actorId) {
      try {
        const credits = (await tmdbFetch(`/person/${actorId}/tv_credits`)) as {
          cast: Array<{
            id: number; name: string; poster_path: string | null;
            genre_ids: number[]; first_air_date: string; overview: string;
            vote_average: number; vote_count: number;
          }>;
        };
        const shows = credits.cast
          .filter((s) => s.poster_path && s.vote_count >= 100 && s.vote_average >= 6.0)
          .sort((a, b) => b.vote_count - a.vote_count)
          .slice(0, 8)
          .map((s) => rawToShow(s as TMDBShow));
        collected.push(...shows);
      } catch { /* continue */ }
    }

    // ── 6. Anime ──────────────────────────────────────────────────────────────
    for (let i = 0; i < 2; i++) {
      const page = (pageOffset + i) % 5 + 1;
      try {
        const data = (await tmdbFetch(
          `/discover/tv?with_genres=16&with_origin_country=JP&sort_by=vote_count.desc&vote_count.gte=150&vote_average.gte=7.0&page=${page}`
        )) as { results: TMDBShow[] };
        collected.push(...data.results.filter((s) => s.poster_path).map(rawToShow));
      } catch { /* continue */ }
    }

    // ── Dedupe, shuffle, cap at 60 ────────────────────────────────────────────
    const seen = new Set<number>();
    const unique = collected.filter((s) => {
      if (seen.has(s.id) || !s.posterUrl) return false;
      seen.add(s.id);
      return true;
    });

    const pool = shuffle(unique).slice(0, 60);
    return NextResponse.json({ shows: pool });
  } catch (err) {
    console.error("[tmdb/show-pool]", err);
    return NextResponse.json({ shows: [] }, { status: 500 });
  }
}
