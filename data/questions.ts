export interface Question {
  id: number;
  question: string;
  answers: Answer[];
}

export interface Answer {
  text: string;
  traits: Record<string, number>;
}

export const questions: Question[] = [
  {
    id: 1,
    question: "Pick a vibe.",
    answers: [
      { text: "Emotional", traits: { emotional: 3, introspective: 1 } },
      { text: "Chaotic", traits: { chaotic: 3, adventurous: 1 } },
      { text: "Thoughtful", traits: { analytical: 3, introspective: 1 } },
      { text: "Fun", traits: { chaotic: 1, adventurous: 2, nostalgic: 1 } },
    ],
  },
  {
    id: 2,
    question: "You can only rewatch one forever.",
    answers: [
      { text: "Interstellar", traits: { introspective: 2, analytical: 2 } },
      { text: "Superbad", traits: { chaotic: 2, nostalgic: 2 } },
      { text: "Eternal Sunshine", traits: { emotional: 3, nostalgic: 1 } },
      { text: "Kill Bill", traits: { chaotic: 2, adventurous: 2 } },
    ],
  },
  {
    id: 3,
    question: "What kind of music hits different?",
    answers: [
      { text: "Introspective", traits: { introspective: 3, emotional: 1 } },
      { text: "Hype", traits: { chaotic: 2, adventurous: 2 } },
      { text: "Nostalgic", traits: { nostalgic: 3, emotional: 1 } },
      { text: "Experimental", traits: { analytical: 2, adventurous: 2 } },
    ],
  },
  {
    id: 4,
    question: "What matters most in a story?",
    answers: [
      { text: "Story", traits: { introspective: 2, analytical: 1 } },
      { text: "Aesthetic", traits: { adventurous: 2, chaotic: 1 } },
      { text: "Relatability", traits: { emotional: 2, nostalgic: 1 } },
      { text: "Originality", traits: { analytical: 2, chaotic: 1 } },
    ],
  },
  {
    id: 5,
    question: "Pick your preferred ending.",
    answers: [
      { text: "Happy", traits: { nostalgic: 2, emotional: 1 } },
      { text: "Tragic", traits: { emotional: 3, introspective: 1 } },
      { text: "Ambiguous", traits: { analytical: 2, introspective: 2 } },
      { text: "Mind-blowing", traits: { chaotic: 2, adventurous: 2 } },
    ],
  },
  {
    id: 6,
    question: "Pick a setting you'd live in.",
    answers: [
      { text: "City at Night", traits: { chaotic: 1, adventurous: 1, introspective: 1 } },
      { text: "Deep Nature", traits: { introspective: 2, nostalgic: 1 } },
      { text: "Outer Space", traits: { analytical: 2, adventurous: 2 } },
      { text: "Somewhere Unknown", traits: { adventurous: 3, chaotic: 1 } },
    ],
  },
  {
    id: 7,
    question: "Pick a character you root for.",
    answers: [
      { text: "The Underdog", traits: { emotional: 2, nostalgic: 1 } },
      { text: "The Anti-Hero", traits: { chaotic: 2, analytical: 1 } },
      { text: "The Dreamer", traits: { introspective: 2, emotional: 1 } },
      { text: "The Genius", traits: { analytical: 3, adventurous: 1 } },
    ],
  },
  {
    id: 8,
    question: "Choose a mood.",
    answers: [
      { text: "Calm", traits: { introspective: 2, nostalgic: 1 } },
      { text: "Intense", traits: { emotional: 2, chaotic: 1 } },
      { text: "Melancholic", traits: { emotional: 2, introspective: 2 } },
      { text: "Energetic", traits: { chaotic: 2, adventurous: 2 } },
    ],
  },
];
