import { Answer } from "@/data/questions";
import { types, TypeResult } from "@/data/types";

export type TraitScores = Record<string, number>;

export function calculateTraits(answers: Answer[]): TraitScores {
  const scores: TraitScores = {};

  for (const answer of answers) {
    for (const [trait, value] of Object.entries(answer.traits)) {
      scores[trait] = (scores[trait] || 0) + value;
    }
  }

  return scores;
}

export function getTopTraits(scores: TraitScores, count: number = 3): string[] {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([trait]) => trait);
}

export function determineType(answers: Answer[]): TypeResult {
  const scores = calculateTraits(answers);
  const topTraits = getTopTraits(scores, 3);

  let bestMatch = types[0];
  let bestScore = 0;

  for (const type of types) {
    let matchScore = 0;
    for (let i = 0; i < topTraits.length; i++) {
      const traitIndex = type.traits.indexOf(topTraits[i]);
      if (traitIndex !== -1) {
        // Weight earlier matches more heavily
        matchScore += (3 - i) * (3 - traitIndex);
      }
    }
    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestMatch = type;
    }
  }

  return bestMatch;
}
