import { NextRequest, NextResponse } from "next/server";
import {
  getArtistTopTracks,
  getSimilarArtists,
  getArtistTopTags,
  getTagTopTracks,
  getBestImage,
  type LfmTrack,
} from "@/lib/lastfmClient";
import type { Song, Artist } from "@/lib/types";

// ── iTunes artwork lookup (free, no auth) ────────────────────────────────────
async function itunesQuery(q: string): Promise<string> {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=3`,
    { cache: "no-store" }
  );
  const data = await res.json();
  const url: string | undefined = data.results?.[0]?.artworkUrl100;
  return url ? url.replace("100x100bb", "600x600bb") : "";
}

// Normalise artist name: strip special chars that confuse iTunes (e.g. A$AP → ASAP)
function normaliseArtist(name: string): string {
  return name.replace(/[$&]/g, "").replace(/\s+/g, " ").trim();
}

async function fetchItunesArtwork(artist: string, title: string): Promise<string> {
  try {
    // 1. Exact: artist + title
    let url = await itunesQuery(`${artist} ${title}`);
    if (url) return url;

    // 2. Normalised artist + title (handles A$AP Rocky → ASAP Rocky etc.)
    const norm = normaliseArtist(artist);
    if (norm !== artist) {
      url = await itunesQuery(`${norm} ${title}`);
      if (url) return url;
    }

    // 3. Title alone – picks any version of the song
    url = await itunesQuery(title);
    if (url) return url;

    return "";
  } catch {
    return "";
  }
}

function trackToSong(track: LfmTrack, artistName?: string): Song | null {
  const title = track.name?.trim();
  const artist = artistName ?? track.artist?.name?.trim();
  if (!title || !artist) return null;

  const albumCover = getBestImage(track.image ?? []);
  const id = track.mbid || `${encodeURIComponent(artist)}::${encodeURIComponent(title)}`;

  return { id, title, artist, artistId: artist, albumCover };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dedupe(songs: Song[]): Song[] {
  const seen = new Set<string>();
  return songs.filter((s) => {
    const key = `${s.title.toLowerCase()}::${s.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    artistNames = [],
    genres = [],
  }: { artistNames: string[]; genres: string[] } = body;

  const collected: Song[] = [];
  const enrichedArtists: Artist[] = [];

  // ── 1. Top tracks + tags for each anchor artist ────────────────────────
  for (const name of artistNames.slice(0, 5)) {
    try {
      const [tracks, tags] = await Promise.all([
        getArtistTopTracks(name, 7),
        getArtistTopTags(name, 5),
      ]);

      const songs = tracks
        .map((t) => trackToSong(t, name))
        .filter((s): s is Song => s !== null);
      collected.push(...songs);

      enrichedArtists.push({
        name,
        tags: tags.map((t) => t.name),
        imageUrl: undefined,
        listeners: undefined,
      });
    } catch {
      enrichedArtists.push({ name, tags: [], imageUrl: undefined });
    }
  }

  // ── 2. Similar artists → their top tracks ─────────────────────────────
  const similarNames: string[] = [];
  for (const name of artistNames.slice(0, 3)) {
    try {
      const similar = await getSimilarArtists(name, 5);
      similarNames.push(...similar.map((s) => s.name));
    } catch { /* continue */ }
  }

  const originalSet = new Set(artistNames.map((n) => n.toLowerCase()));
  const uniqueSimilar = [
    ...new Set(similarNames.filter((n) => !originalSet.has(n.toLowerCase()))),
  ].slice(0, 10);

  for (const name of uniqueSimilar) {
    try {
      const tracks = await getArtistTopTracks(name, 3);
      const songs = tracks
        .map((t) => trackToSong(t, name))
        .filter((s): s is Song => s !== null);
      collected.push(...songs);
    } catch { /* continue */ }
  }

  // ── 3. Genre/tag-based tracks for variety ─────────────────────────────
  const tagMap: Record<string, string> = {
    "Hip-Hop": "hip-hop", "R&B": "rnb", "Rock": "rock", "Pop": "pop",
    "Alternative": "alternative", "Indie": "indie", "Electronic": "electronic",
    "Jazz": "jazz", "Classical": "classical", "Metal": "metal",
    "Country": "country", "Folk": "folk", "Soul": "soul", "Reggae": "reggae",
    "Latin": "latin", "Punk": "punk", "Blues": "blues", "Funk": "funk",
    "Ambient": "ambient", "K-Pop": "k-pop",
  };

  for (const genre of genres.slice(0, 2)) {
    const tag = tagMap[genre] ?? genre.toLowerCase().replace(/\s+/g, "-");
    try {
      const tracks = await getTagTopTracks(tag, 10);
      const songs = tracks
        .map((t) => trackToSong(t))
        .filter((s): s is Song => s !== null);
      collected.push(...songs);
    } catch { /* continue */ }
  }

  // ── 4. Dedupe + shuffle ────────────────────────────────────────────────
  const unique = dedupe(collected);
  let pool = shuffle(unique).slice(0, 32);

  // Fallback if too few
  if (pool.length < 16 && artistNames.length > 0) {
    try {
      const fallbackTracks = await getArtistTopTracks(artistNames[0], 20);
      const extra = fallbackTracks
        .map((t) => trackToSong(t, artistNames[0]))
        .filter((s): s is Song => s !== null);
      pool = shuffle(dedupe([...pool, ...extra])).slice(0, 32);
    } catch { /* continue */ }
  }

  // ── 5. Enrich missing album covers via iTunes ──────────────────────────
  const enriched = await Promise.all(
    pool.map(async (song) => {
      if (song.albumCover) return song;
      const art = await fetchItunesArtwork(song.artist, song.title);
      return art ? { ...song, albumCover: art } : song;
    })
  );

  return NextResponse.json({ songs: enriched, enrichedArtists });
}
