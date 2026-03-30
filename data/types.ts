export interface TypeResult {
  name: string;
  slug: string;
  description: string;
  traits: string[];
  mbti: string;
  gradient: string;
  accentColor: string;
  movies: string[];
  artists: string[];
  shows: string[];
}

export const types: TypeResult[] = [
  {
    name: "Reflective Romantic",
    slug: "reflective-romantic",
    description:
      "You feel everything deeply and you're not sorry about it. Your playlists are emotional landscapes and your favorite movies leave you staring at the ceiling at 2am. You find beauty in the bittersweet.",
    traits: ["emotional", "introspective", "nostalgic"],
    mbti: "INFP",
    gradient: "from-rose-500 via-pink-600 to-purple-700",
    accentColor: "#f472b6",
    movies: ["Call Me by Your Name", "Her", "Lost in Translation"],
    artists: ["Phoebe Bridgers", "Frank Ocean", "Bon Iver"],
    shows: ["Normal People", "Fleabag"],
  },
  {
    name: "Chaotic Tastemaker",
    slug: "chaotic-tastemaker",
    description:
      "Your taste is unpredictable and that's the point. You jump between genres, aesthetics, and moods like it's cardio. People either don't get your recommendations or become obsessed with them.",
    traits: ["chaotic", "adventurous", "analytical"],
    mbti: "ENTP",
    gradient: "from-orange-500 via-red-500 to-pink-600",
    accentColor: "#fb923c",
    movies: ["Everything Everywhere All at Once", "Fight Club", "Parasite"],
    artists: ["100 gecs", "Tyler, the Creator", "Charli XCX"],
    shows: ["Atlanta", "The Bear"],
  },
  {
    name: "Curated Thinker",
    slug: "curated-thinker",
    description:
      "You don't just watch things — you analyze them. Every recommendation comes with a thesis. You appreciate craft, structure, and the kind of art that rewards attention.",
    traits: ["analytical", "introspective", "adventurous"],
    mbti: "INTJ",
    gradient: "from-cyan-500 via-blue-600 to-indigo-700",
    accentColor: "#22d3ee",
    movies: ["Arrival", "The Grand Budapest Hotel", "Mulholland Drive"],
    artists: ["Radiohead", "Tame Impala", "Björk"],
    shows: ["Severance", "Dark"],
  },
  {
    name: "Main Character Dreamer",
    slug: "main-character-dreamer",
    description:
      "You see yourself in every protagonist and that's your superpower. Life feels cinematic to you. You gravitate toward stories about becoming, longing, and beautiful chaos.",
    traits: ["emotional", "adventurous", "chaotic"],
    mbti: "ENFP",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    accentColor: "#a78bfa",
    movies: ["Lady Bird", "The Secret Life of Walter Mitty", "Moonlight"],
    artists: ["Lorde", "Lana Del Rey", "SZA"],
    shows: ["Euphoria", "Sex Education"],
  },
  {
    name: "Nostalgic Idealist",
    slug: "nostalgic-idealist",
    description:
      "You're emotionally tethered to the things that shaped you. Rewatching comfort shows is self-care. You believe the best art makes you feel like you're coming home.",
    traits: ["nostalgic", "emotional", "introspective"],
    mbti: "ISFJ",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    accentColor: "#fbbf24",
    movies: ["The Perks of Being a Wallflower", "Juno", "Stand by Me"],
    artists: ["Taylor Swift", "The 1975", "Fleetwood Mac"],
    shows: ["Gilmore Girls", "Stranger Things"],
  },
  {
    name: "Eclectic Explorer",
    slug: "eclectic-explorer",
    description:
      "You're always chasing the next thing that'll blow your mind. Foreign films, obscure albums, weird documentaries — if it's new, you're interested. Boredom is your villain.",
    traits: ["adventurous", "analytical", "chaotic"],
    mbti: "ESTP",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    accentColor: "#34d399",
    movies: ["Spirited Away", "City of God", "The Lobster"],
    artists: ["FKA Twigs", "Gorillaz", "Khruangbin"],
    shows: ["Black Mirror", "Beef"],
  },
  {
    name: "Deep Feelings Archivist",
    slug: "deep-feelings-archivist",
    description:
      "You collect emotional experiences like artifacts. Every song, scene, and line that moves you gets stored forever. Your inner world is rich, layered, and probably needs its own soundtrack.",
    traits: ["introspective", "emotional", "analytical"],
    mbti: "INFJ",
    gradient: "from-indigo-600 via-purple-700 to-slate-800",
    accentColor: "#818cf8",
    movies: ["Eternal Sunshine of the Spotless Mind", "Blade Runner 2049", "The Tree of Life"],
    artists: ["Sufjan Stevens", "Beach House", "Nick Drake"],
    shows: ["Mr. Robot", "The Leftovers"],
  },
  {
    name: "Pop Culture Maximalist",
    slug: "pop-culture-maximalist",
    description:
      "You're plugged into everything and loving it. Mainstream or underground if it's good, it's good. You're the friend everyone asks for recommendations, and you always deliver.",
    traits: ["chaotic", "nostalgic", "adventurous"],
    mbti: "ESFP",
    gradient: "from-yellow-400 via-lime-400 to-green-500",
    accentColor: "#a3e635",
    movies: ["Knives Out", "Spider-Verse", "The Social Network"],
    artists: ["Doja Cat", "Bad Bunny", "Daft Punk"],
    shows: ["Succession", "Abbott Elementary"],
  },
];
