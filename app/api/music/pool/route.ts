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
    } catch {
      // continue
    }
  }

  // Dedupe similar (exclude original artists)
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
    } catch {
      // continue
    }
  }

  // ── 3. Genre/tag-based tracks for variety ─────────────────────────────
  // Normalize genres to Last.fm-friendly tag format
  const tagMap: Record<string, string> = {
    "Hip-Hop": "hip-hop",
    "R&B": "rnb",
    "Rock": "rock",
    "Pop": "pop",
    "Alternative": "alternative",
    "Indie": "indie",
    "Electronic": "electronic",
    "Jazz": "jazz",
    "Classical": "classical",
    "Metal": "metal",
    "Country": "country",
    "Folk": "folk",
    "Soul": "soul",
    "Reggae": "reggae",
    "Latin": "latin",
    "Punk": "punk",
    "Blues": "blues",
    "Funk": "funk",
    "Ambient": "ambient",
    "K-Pop": "k-pop",
  };

  for (const genre of genres.slice(0, 2)) {
    const tag = tagMap[genre] ?? genre.toLowerCase().replace(/\s+/g, "-");
    try {
      const tracks = await getTagTopTracks(tag, 10);
      const songs = tracks
        .map((t) => trackToSong(t))
        .filter((s): s is Song => s !== null);
      collected.push(...songs);
    } catch {
      // continue
    }
  }

  // ── 4. Dedupe, shuffle, cap at 32 ─────────────────────────────────────
  const unique = dedupe(collected);
  const pool = shuffle(unique).slice(0, 32);

  // If we don't have 16 (minimum for bracket), try a broader fallback
  if (pool.length < 16 && artistNames.length > 0) {
    try {
      const fallbackTracks = await getArtistTopTracks(artistNames[0], 20);
      const extra = fallbackTracks
        .map((t) => trackToSong(t, artistNames[0]))
        .filter((s): s is Song => s !== null);
      const combined = dedupe([...pool, ...extra]);
      return NextResponse.json({
        songs: shuffle(combined).slice(0, 32),
        enrichedArtists,
      });
    } catch {
      // return whatever we have
    }
  }

  return NextResponse.json({ songs: pool, enrichedArtists });
}
