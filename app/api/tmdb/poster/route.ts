import { NextRequest, NextResponse } from "next/server";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

async function tmdbFetch(path: string): Promise<unknown> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("Missing TMDB_API_KEY");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(
    `https://api.themoviedb.org/3${path}${sep}api_key=${apiKey}`,
    { cache: "force-cache" }
  );
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  if (!title) return NextResponse.json({ posterUrl: null });

  try {
    // Try movie first, then TV
    const [movieData, tvData] = await Promise.allSettled([
      tmdbFetch(`/search/movie?query=${encodeURIComponent(title)}&include_adult=false`) as Promise<{
        results: Array<{ poster_path: string | null; vote_count: number }>;
      }>,
      tmdbFetch(`/search/tv?query=${encodeURIComponent(title)}&include_adult=false`) as Promise<{
        results: Array<{ poster_path: string | null; vote_count: number }>;
      }>,
    ]);

    const movieResult =
      movieData.status === "fulfilled"
        ? movieData.value.results.find((r) => r.poster_path)
        : null;
    const tvResult =
      tvData.status === "fulfilled"
        ? tvData.value.results.find((r) => r.poster_path)
        : null;

    // Prefer the one with more votes (more likely to be what we want)
    const best = (() => {
      if (movieResult && tvResult) {
        return (movieResult.vote_count ?? 0) >= (tvResult.vote_count ?? 0)
          ? movieResult
          : tvResult;
      }
      return movieResult ?? tvResult ?? null;
    })();

    const posterUrl = best?.poster_path ? `${IMG_BASE}${best.poster_path}` : null;
    return NextResponse.json({ posterUrl });
  } catch {
    return NextResponse.json({ posterUrl: null });
  }
}
