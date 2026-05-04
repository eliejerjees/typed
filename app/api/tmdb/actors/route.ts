import { NextRequest, NextResponse } from "next/server";
import type { Actor } from "@/lib/types";

interface TMDBCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  order?: number;
  known_for_department?: string;
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
    kothMovies = [],
    kothShows = [],
    excludeIds = [],
  }: {
    kothMovies: Array<{ id: number; title: string }>;
    kothShows: Array<{ id: number; title: string }>;
    excludeIds: number[];
  } = body;

  const allExcluded = new Set(excludeIds);
  // Map: actor id → Actor (knownFor accumulates up to 3 titles)
  const actorMap = new Map<number, Actor>();

  function upsert(id: number, name: string, imageUrl: string, title: string) {
    if (!imageUrl || allExcluded.has(id)) return;
    if (actorMap.has(id)) {
      const existing = actorMap.get(id)!;
      if (!existing.knownFor.includes(title) && existing.knownFor.length < 3) {
        actorMap.set(id, { ...existing, knownFor: [...existing.knownFor, title] });
      }
    } else {
      actorMap.set(id, { id, name, imageUrl, knownFor: [title] });
    }
  }

  try {
    // ── Actors from movies the user picked in movie KOTH ──────────────────
    for (const { id, title } of kothMovies) {
      try {
        const data = (await tmdbFetch(`/movie/${id}/credits`)) as { cast: TMDBCastMember[] };
        data.cast
          .filter(
            (a) =>
              a.profile_path &&
              !allExcluded.has(a.id) &&
              (a.order ?? 99) < 5 &&
              (a.known_for_department === "Acting" || !a.known_for_department)
          )
          .forEach((a) => upsert(a.id, a.name, `${IMG_BASE}${a.profile_path}`, title));
      } catch { /* continue */ }
    }

    // ── Actors from shows the user picked in show KOTH ────────────────────
    for (const { id, title } of kothShows) {
      try {
        const data = (await tmdbFetch(`/tv/${id}/credits`)) as { cast: TMDBCastMember[] };
        data.cast
          .filter(
            (a) =>
              a.profile_path &&
              !allExcluded.has(a.id) &&
              (a.order ?? 99) < 5 &&
              (a.known_for_department === "Acting" || !a.known_for_department)
          )
          .forEach((a) => upsert(a.id, a.name, `${IMG_BASE}${a.profile_path}`, title));
      } catch { /* continue */ }
    }

    const pool = shuffle(Array.from(actorMap.values())).slice(0, 25);
    return NextResponse.json({ actors: pool });
  } catch (err) {
    console.error("[tmdb/actors]", err);
    return NextResponse.json({ actors: [] }, { status: 500 });
  }
}
