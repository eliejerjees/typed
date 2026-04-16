import { NextResponse } from "next/server";

interface TMDBGenre {
  id: number;
  name: string;
}

export async function GET() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ genres: [] }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`,
      { cache: "force-cache" }
    );

    if (!response.ok) {
      throw new Error(`TMDB genres error: ${response.status}`);
    }

    const data = (await response.json()) as { genres: TMDBGenre[] };
    return NextResponse.json({ genres: data.genres });
  } catch (err) {
    console.error("[tmdb/genres]", err);
    // Static fallback
    return NextResponse.json({
      genres: [
        { id: 28, name: "Action" },
        { id: 12, name: "Adventure" },
        { id: 16, name: "Animation" },
        { id: 35, name: "Comedy" },
        { id: 80, name: "Crime" },
        { id: 99, name: "Documentary" },
        { id: 18, name: "Drama" },
        { id: 10751, name: "Family" },
        { id: 14, name: "Fantasy" },
        { id: 36, name: "History" },
        { id: 27, name: "Horror" },
        { id: 10402, name: "Music" },
        { id: 9648, name: "Mystery" },
        { id: 10749, name: "Romance" },
        { id: 878, name: "Science Fiction" },
        { id: 53, name: "Thriller" },
        { id: 10752, name: "War" },
        { id: 37, name: "Western" },
      ],
    });
  }
}
