// Last.fm API client — read-only, no OAuth needed

const BASE = "https://ws.audioscrobbler.com/2.0/";

// Last.fm's default placeholder image hash
const PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

export interface LastfmImage {
  "#text": string;
  size: string;
}

export function getBestImage(images: LastfmImage[]): string {
  const order = ["extralarge", "mega", "large", "medium", "small"];
  for (const size of order) {
    const img = images.find((i) => i.size === size);
    if (img?.["#text"] && !img["#text"].includes(PLACEHOLDER_HASH)) {
      return img["#text"];
    }
  }
  return "";
}

export async function lastfmFetch(
  params: Record<string, string | number>
): Promise<unknown> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error("Missing LASTFM_API_KEY");

  const searchParams = new URLSearchParams({
    api_key: apiKey,
    format: "json",
  });
  for (const [k, v] of Object.entries(params)) {
    searchParams.set(k, String(v));
  }

  const url = `${BASE}?${searchParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Last.fm HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  }
  return data;
}

// ─── Typed response helpers ────────────────────────────────────────────────

export interface LfmArtistMatch {
  name: string;
  listeners: string;
  mbid: string;
  url: string;
  image: LastfmImage[];
}

export interface LfmTrack {
  name: string;
  playcount?: string;
  listeners?: string;
  mbid: string;
  url: string;
  artist: { name: string; mbid?: string; url: string };
  image: LastfmImage[];
  "@attr"?: { rank?: string };
}

export interface LfmSimilarArtist {
  name: string;
  mbid: string;
  match: string;
  url: string;
  image: LastfmImage[];
}

export interface LfmTag {
  count: number;
  name: string;
  url: string;
}

export async function searchArtists(query: string, limit = 8): Promise<LfmArtistMatch[]> {
  const data = (await lastfmFetch({
    method: "artist.search",
    artist: query,
    limit,
  })) as { results: { artistmatches: { artist: LfmArtistMatch[] } } };

  return data.results?.artistmatches?.artist ?? [];
}

export async function getArtistTopTracks(artistName: string, limit = 6): Promise<LfmTrack[]> {
  const data = (await lastfmFetch({
    method: "artist.getTopTracks",
    artist: artistName,
    limit,
    autocorrect: 1,
  })) as { toptracks: { track: LfmTrack[] } };

  return data.toptracks?.track ?? [];
}

export async function getSimilarArtists(artistName: string, limit = 6): Promise<LfmSimilarArtist[]> {
  const data = (await lastfmFetch({
    method: "artist.getSimilar",
    artist: artistName,
    limit,
    autocorrect: 1,
  })) as { similarartists: { artist: LfmSimilarArtist[] } };

  return data.similarartists?.artist ?? [];
}

export async function getArtistTopTags(artistName: string, limit = 5): Promise<LfmTag[]> {
  const data = (await lastfmFetch({
    method: "artist.getTopTags",
    artist: artistName,
    autocorrect: 1,
  })) as { toptags: { tag: LfmTag[] } };

  return (data.toptags?.tag ?? []).slice(0, limit);
}

export async function getTagTopTracks(tag: string, limit = 10): Promise<LfmTrack[]> {
  const data = (await lastfmFetch({
    method: "tag.getTopTracks",
    tag,
    limit,
  })) as { tracks: { track: LfmTrack[] } };

  return data.tracks?.track ?? [];
}
