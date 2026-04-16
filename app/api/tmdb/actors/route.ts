import { NextRequest, NextResponse } from "next/server";
import type { Actor } from "@/lib/types";

interface TMDBCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  order?: number;
  known_for_department?: string;
}

interface TMDBDiscoverMovie {
  id: number;
  title: string;
  vote_count: number;
}

const IMG_BASE = "https://image.tmdb.org/t/p/w300";

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
    movieGenreIds = [],
    keptActorIds = [],
    cutActorIds = [],
    excludeIds = [],
    round = 0,
  }: {
    movieGenreIds: number[];
    keptActorIds: number[];
    cutActorIds: number[];
    excludeIds: number[];
    round: number;
  } = body;

  const allExcluded = new Set([...keptActorIds, ...cutActorIds, ...excludeIds]);

  // Use a Map so we can accumulate knownFor across multiple movies per actor
  const actorMap = new Map<number, Actor>();

  function upsert(id: number, name: string, imageUrl: string, film: string) {
    if (!imageUrl || allExcluded.has(id)) return;
    if (actorMap.has(id)) {
      const existing = actorMap.get(id)!;
      if (!existing.knownFor.includes(film) && existing.knownFor.length < 3) {
        actorMap.set(id, { ...existing, knownFor: [...existing.knownFor, film] });
      }
    } else {
      actorMap.set(id, { id, name, imageUrl, knownFor: [film] });
    }
  }

  try {
    // ── 1. Top movies by vote count — guaranteed household names ──────────
    // Pages 1-5 of movies sorted by vote_count gives ~100 all-time popular films
    const pages = round >= 3 ? 5 : 3;
    for (let page = 1; page <= pages; page++) {
      try {
        const data = (await tmdbFetch(
          `/discover/movie?sort_by=vote_count.desc&vote_count.gte=8000&page=${page}`
        )) as { results: TMDBDiscoverMovie[] };

        for (const movie of data.results.slice(0, 10)) {
          try {
            const castData = (await tmdbFetch(
              `/movie/${movie.id}/credits`
            )) as { cast: TMDBCastMember[] };

            // Top-billed cast only (order 0–3 = main stars), acting department
            castData.cast
              .filter(
                (a) =>
                  a.profile_path &&
                  !allExcluded.has(a.id) &&
                  (a.order ?? 99) < 4 &&
                  (a.known_for_department === "Acting" || !a.known_for_department)
              )
              .forEach((a) =>
                upsert(a.id, a.name, `${IMG_BASE}${a.profile_path}`, movie.title)
              );
          } catch { /* continue */ }
        }
      } catch { /* continue */ }
    }

    // ── 2. Genre-specific top films for variety ───────────────────────────
    if (movieGenreIds.length > 0) {
      const genreStr = movieGenreIds.slice(0, 2).join(",");
      try {
        const data = (await tmdbFetch(
          `/discover/movie?with_genres=${genreStr}&sort_by=vote_count.desc&vote_count.gte=3000&page=1`
        )) as { results: TMDBDiscoverMovie[] };

        for (const movie of data.results.slice(0, 8)) {
          try {
            const castData = (await tmdbFetch(
              `/movie/${movie.id}/credits`
            )) as { cast: TMDBCastMember[] };

            castData.cast
              .filter((a) => a.profile_path && !allExcluded.has(a.id) && (a.order ?? 99) < 4)
              .forEach((a) =>
                upsert(a.id, a.name, `${IMG_BASE}${a.profile_path}`, movie.title)
              );
          } catch { /* continue */ }
        }
      } catch { /* continue */ }
    }

    // ── 3. Co-stars of kept actors in later rounds ────────────────────────
    if (round >= 2 && keptActorIds.length > 0) {
      for (const actorId of keptActorIds.slice(0, 2)) {
        try {
          const credits = (await tmdbFetch(
            `/person/${actorId}/movie_credits`
          )) as { cast: Array<{ id: number; title: string; vote_count: number; vote_average: number }> };

          const topMovies = credits.cast
            .filter((m) => m.vote_count >= 3000)
            .sort((a, b) => b.vote_count - a.vote_count)
            .slice(0, 4);

          for (const movie of topMovies) {
            try {
              const castData = (await tmdbFetch(
                `/movie/${movie.id}/credits`
              )) as { cast: TMDBCastMember[] };

              castData.cast
                .filter((a) => a.profile_path && !allExcluded.has(a.id) && (a.order ?? 99) < 4)
                .forEach((a) =>
                  upsert(a.id, a.name, `${IMG_BASE}${a.profile_path}`, movie.title)
                );
            } catch { /* continue */ }
          }
        } catch { /* continue */ }
      }
    }

    const pool = shuffle(Array.from(actorMap.values())).slice(0, 25);
    return NextResponse.json({ actors: pool });
  } catch (err) {
    console.error("[tmdb/actors]", err);
    return NextResponse.json({ actors: [] }, { status: 500 });
  }
}
