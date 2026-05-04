import { NextRequest, NextResponse } from "next/server";
import type { Movie } from "@/lib/types";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// Movie genre IDs that map directly to the same TV genre ID
const SHARED_GENRE_IDS = new Set([
  16,    // Animation
  18,    // Drama
  35,    // Comedy
  80,    // Crime
  99,    // Documentary
  9648,  // Mystery
  10749, // Romance
  37,    // Western
  27,    // Horror
  53,    // Thriller
]);

// Movie genre IDs that map to a different TV genre ID
const MOVIE_TO_TV_GENRE: Record<number, number> = {
  28:  10759, // Action → Action & Adventure
  12:  10759, // Adventure → Action & Adventure
  878: 10765, // Science Fiction → Sci-Fi & Fantasy
  14:  10765, // Fantasy → Sci-Fi & Fantasy
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

  try {
    // ── 1. Genre-matched shows — translate movie genre IDs to TV genre IDs ──
    if (movieGenreIds.length > 0) {
      const tvGenreIds = movieGenreIds.flatMap((id) => {
        if (SHARED_GENRE_IDS.has(id)) return [id];
        if (MOVIE_TO_TV_GENRE[id]) return [MOVIE_TO_TV_GENRE[id]];
        return [];
      });
      const uniqueTvGenres = [...new Set(tvGenreIds)];

      if (uniqueTvGenres.length > 0) {
        const genreStr = uniqueTvGenres.slice(0, 3).join(",");
        for (let page = 1; page <= 2; page++) {
          try {
            const data = (await tmdbFetch(
              `/discover/tv?with_genres=${genreStr}&sort_by=vote_count.desc&vote_count.gte=300&vote_average.gte=7.0&page=${page}`
            )) as { results: TMDBShow[] };

            collected.push(...data.results.filter((s) => s.poster_path).map(rawToShow));
          } catch { /* continue */ }
        }
      }
    }

    // ── 2. High-quality baseline — well-known shows everyone has heard of ──
    for (let page = 1; page <= 3 && collected.length < 40; page++) {
      try {
        const data = (await tmdbFetch(
          `/discover/tv?sort_by=vote_count.desc&vote_count.gte=500&vote_average.gte=7.0&page=${page}`
        )) as { results: TMDBShow[] };

        collected.push(...data.results.filter((s) => s.poster_path).map(rawToShow));
      } catch { /* continue */ }
    }

    // ── 3. Currently popular TV ───────────────────────────────────────────
    for (let page = 1; page <= 2; page++) {
      try {
        const data = (await tmdbFetch(`/tv/popular?page=${page}`)) as { results: TMDBShow[] };
        collected.push(
          ...data.results.filter((s) => s.poster_path && s.vote_count >= 200).map(rawToShow)
        );
      } catch { /* continue */ }
    }

    // ── 4. Shows starring the actor KOTH champion ────────────────────────
    if (actorId) {
      try {
        const credits = (await tmdbFetch(`/person/${actorId}/tv_credits`)) as {
          cast: Array<{ id: number; name: string; poster_path: string | null; genre_ids: number[]; first_air_date: string; overview: string; vote_average: number; vote_count: number }>;
        };
        const shows = credits.cast
          .filter((s) => s.poster_path && s.vote_count >= 100 && s.vote_average >= 6.0)
          .sort((a, b) => b.vote_count - a.vote_count)
          .slice(0, 6)
          .map((s) => rawToShow(s as TMDBShow));
        collected.push(...shows);
      } catch { /* continue */ }
    }

    // ── 5. Anime — animation genre (16) from Japan ────────────────────────
    for (let page = 1; page <= 2; page++) {
      try {
        const data = (await tmdbFetch(
          `/discover/tv?with_genres=16&with_origin_country=JP&sort_by=vote_count.desc&vote_count.gte=200&vote_average.gte=7.0&page=${page}`
        )) as { results: TMDBShow[] };

        collected.push(...data.results.filter((s) => s.poster_path).map(rawToShow));
      } catch { /* continue */ }
    }

    // ── Dedupe, shuffle, cap at 35 ────────────────────────────────────────
    const seen = new Set<number>();
    const unique = collected.filter((s) => {
      if (seen.has(s.id) || !s.posterUrl) return false;
      seen.add(s.id);
      return true;
    });

    const pool = shuffle(unique).slice(0, 30);
    return NextResponse.json({ shows: pool });
  } catch (err) {
    console.error("[tmdb/show-pool]", err);
    return NextResponse.json({ shows: [] }, { status: 500 });
  }
}
