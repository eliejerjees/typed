import { NextRequest, NextResponse } from "next/server";
import { searchArtists, getBestImage } from "@/lib/lastfmClient";
import type { Artist } from "@/lib/types";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ artists: [] });
  }

  try {
    const results = await searchArtists(q, 8);

    const artists: Artist[] = results
      .filter((a) => a.name) // skip empty results
      .map((a) => ({
        name: a.name,
        mbid: a.mbid || undefined,
        tags: [],
        imageUrl: getBestImage(a.image) || undefined,
        listeners: a.listeners ? parseInt(a.listeners, 10) : undefined,
      }));

    return NextResponse.json({ artists });
  } catch (err) {
    console.error("[music/search]", err);
    return NextResponse.json({ artists: [] }, { status: 500 });
  }
}
