import { NextResponse } from "next/server";

// Curated genre list with subgenres
// Last.fm's raw tags are too noisy for UX so we use a clean static list
const GENRES = [
  "Pop",
  "Hip-Hop",
  "R&B",
  "Rock",
  "Alternative",
  "Indie",
  "Electronic",
  "Jazz",
  "Classical",
  "Metal",
  "Country",
  "Folk",
  "Soul",
  "Reggae",
  "Latin",
  "Punk",
  "Blues",
  "Funk",
  "Ambient",
  "K-Pop",
];

const SUBGENRE_MAP: Record<string, string[]> = {
  Pop: ["Synth-Pop", "Dream Pop", "Electropop", "Indie Pop", "Dance Pop", "Art Pop", "Chamber Pop"],
  "Hip-Hop": ["Trap", "Drill", "Boom Bap", "Conscious Rap", "Cloud Rap", "Lo-Fi Hip-Hop", "G-Funk"],
  "R&B": ["Neo-Soul", "Contemporary R&B", "New Jack Swing", "Quiet Storm", "Alternative R&B"],
  Rock: ["Classic Rock", "Hard Rock", "Garage Rock", "Soft Rock", "Progressive Rock", "Glam Rock"],
  Alternative: ["Post-Rock", "Shoegaze", "Grunge", "Britpop", "Post-Punk Revival", "Math Rock"],
  Indie: ["Indie Folk", "Indie Pop", "Indie Rock", "Lo-Fi", "Bedroom Pop", "Chamber Folk"],
  Electronic: ["House", "Techno", "Drum & Bass", "Trance", "Dubstep", "Ambient Electronic", "IDM"],
  Jazz: ["Bebop", "Fusion", "Nu-Jazz", "Smooth Jazz", "Acid Jazz", "Free Jazz", "Swing"],
  Classical: ["Baroque", "Romantic", "Minimalist", "Contemporary Classical", "Opera", "Orchestral"],
  Metal: ["Heavy Metal", "Death Metal", "Black Metal", "Doom Metal", "Thrash Metal", "Post-Metal"],
  Country: ["Alt-Country", "Country Pop", "Bluegrass", "Americana", "Outlaw Country"],
  Folk: ["Singer-Songwriter", "Acoustic Folk", "Freak Folk", "Celtic Folk", "Folk Rock"],
  Soul: ["Motown", "Southern Soul", "Gospel", "Funk Soul", "Blues Soul"],
  Reggae: ["Dancehall", "Roots Reggae", "Dub", "Ska", "Rocksteady"],
  Latin: ["Reggaeton", "Salsa", "Bossa Nova", "Cumbia", "Bachata", "Flamenco"],
  Punk: ["Post-Punk", "Hardcore Punk", "Emo", "Pop Punk", "Ska Punk", "Noise Punk"],
  Blues: ["Delta Blues", "Chicago Blues", "Electric Blues", "Texas Blues"],
  Funk: ["G-Funk", "Funk Rock", "P-Funk", "Afrobeat", "Disco"],
  Ambient: ["Dark Ambient", "Drone", "New Age", "Atmospheric", "Chillout", "Space Music"],
  "K-Pop": ["Idol Pop", "K-R&B", "K-Indie", "K-Hip-Hop", "Ballad"],
};

export async function GET() {
  return NextResponse.json({ genres: GENRES, subgenreMap: SUBGENRE_MAP });
}
