/** Shared TMDB API fetch helper used by all /api/tmdb/* routes. */
export async function tmdbFetch(
  path: string,
  cache: RequestCache = "no-store"
): Promise<unknown> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("Missing TMDB_API_KEY");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(
    `https://api.themoviedb.org/3${path}${sep}api_key=${apiKey}`,
    { cache }
  );
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}
