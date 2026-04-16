import { NextRequest, NextResponse } from "next/server";
import type { Artist } from "@/lib/types";

interface DeezerArtist {
  id: number;
  name: string;
  picture_medium: string;
  picture_xl: string;
  nb_fan: number;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json({ artists: [] });

  try {
    const res = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=10`,
      { cache: "no-store" }
    );
    const data = await res.json();

    const artists: Artist[] = (data.data ?? [])
      .filter((a: DeezerArtist) => a.name)
      .map((a: DeezerArtist): Artist => ({
        name: a.name,
        tags: [],
        imageUrl: a.picture_xl || a.picture_medium || undefined,
        listeners: a.nb_fan || undefined,
      }));

    return NextResponse.json({ artists });
  } catch (err) {
    console.error("[music/search]", err);
    return NextResponse.json({ artists: [] }, { status: 500 });
  }
}
