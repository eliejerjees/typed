import { NextResponse } from "next/server";
import type { Actor } from "@/lib/types";

interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  known_for_department?: string;
  known_for: Array<{ title?: string; name?: string; media_type: string }>;
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

// GET — no user-specific params needed, just return the most famous actors
export async function GET() {
  const collected: Actor[] = [];

  try {
    // /person/popular is TMDB's pre-ranked list by fame/activity.
    // Pages 1–4 gives ~80 people; filtering to actors yields ~50–60.
    for (let page = 1; page <= 4; page++) {
      try {
        const data = (await tmdbFetch(`/person/popular?page=${page}`)) as {
          results: TMDBPerson[];
        };

        data.results
          .filter(
            (p) =>
              p.profile_path &&
              (p.known_for_department === "Acting" || !p.known_for_department)
          )
          .forEach((p) => {
            const knownFor = p.known_for
              .map((k) => k.title ?? k.name)
              .filter((t): t is string => Boolean(t))
              .slice(0, 3);

            collected.push({
              id: p.id,
              name: p.name,
              imageUrl: `${IMG_BASE}${p.profile_path}`,
              knownFor,
            });
          });
      } catch { /* continue */ }
    }

    // Shuffle so the KOTH doesn't always start with the same two actors
    const pool = shuffle(collected).slice(0, 50);
    return NextResponse.json({ actors: pool });
  } catch (err) {
    console.error("[tmdb/actor-pool]", err);
    return NextResponse.json({ actors: [] }, { status: 500 });
  }
}
