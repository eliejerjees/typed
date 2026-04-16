import { NextRequest, NextResponse } from "next/server";

interface TMDBShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
}

const IMG_BASE = "https://image.tmdb.org/t/p/w185";

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

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ shows: [] });

  try {
    const data = (await tmdbFetch(
      `/search/tv?query=${encodeURIComponent(q)}&include_adult=false&page=1`
    )) as { results: TMDBShow[] };

    const shows = data.results
      .filter((s) => s.vote_count > 10)
      .slice(0, 8)
      .map((s) => ({
        id: s.id,
        name: s.name,
        posterUrl: s.poster_path ? `${IMG_BASE}${s.poster_path}` : "",
        year: s.first_air_date ? s.first_air_date.slice(0, 4) : "",
      }));

    return NextResponse.json({ shows });
  } catch (err) {
    console.error("[tmdb/shows]", err);
    return NextResponse.json({ shows: [] });
  }
}
