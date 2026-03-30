import { Answer } from "@/data/questions";
import { types, TypeResult } from "@/data/types";

export function getTopTraits(answers: Answer[], count = 3): string[] {
  const scores: Record<string, number> = {};
  for (const answer of answers) {
    for (const [trait, value] of Object.entries(answer.traits)) {
      scores[trait] = (scores[trait] || 0) + value;
    }
  }
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([trait]) => trait);
}

export function determineType(answers: Answer[]): TypeResult {
  const topTraits = getTopTraits(answers, 3);

  let bestMatch = types[0];
  let bestScore = 0;

  for (const type of types) {
    let score = 0;
    for (let i = 0; i < topTraits.length; i++) {
      const idx = type.traits.indexOf(topTraits[i]);
      if (idx !== -1) {
        score += (3 - i) * (3 - idx);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type;
    }
  }

  return bestMatch;
}
