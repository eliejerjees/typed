import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AppData, TypedResult } from "@/lib/types";
import { buildResultPrompt, RESULT_SYSTEM_PROMPT } from "@/lib/resultPrompt";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  let appData: AppData;
  try {
    const body = await req.json();
    appData = body.appData;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });
  const userPrompt = buildResultPrompt(appData);

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: RESULT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here is the user's complete Typed session data. Generate their result:\n\n${userPrompt}`,
        },
      ],
      temperature: 0.85,
      max_tokens: 1400,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from OpenAI");

    const result = JSON.parse(raw) as TypedResult;

    if (
      !result.coreType || !result.subType || !result.hook ||
      !result.receipts || !result.patterns || !result.contradiction ||
      !result.mostLike || !result.predictions || !result.recommendations
    ) {
      throw new Error("Incomplete result structure from LLM");
    }

    // backfill legacy fields for compatibility
    result.contradictions = result.contradictions ?? result.contradiction;
    result.summary        = result.summary        ?? result.hook;

    return NextResponse.json({ result });
  } catch (err) {
    console.error("[result]", err);

    const fallback: TypedResult = {
      coreType: "The Explorer",
      subType: "Restless Signal Seeker",
      hook: "You don't have a fixed taste. You have a moving target — and it's always just ahead of you.",
      traits: [
        "avoids staying in one lane",
        "follows instinct over prestige",
        "cuts predictable outcomes",
        "picks momentum over meaning",
        "hard to pin down",
      ],
      receipts: [
        "Your bracket choices didn't follow genre loyalty — they followed feel.",
        "Your kept movies span enough territory that no single theme dominates.",
        "Your top artists don't share a genre so much as an energy.",
      ],
      patterns: [
        "You prefer discovering something new over rewatching something safe.",
        "You choose based on gut, then justify it later.",
        "You avoid anything that feels like homework.",
        "You don't have patience for slow burns that don't pay off.",
        "You prefer momentum over meaning.",
      ],
      contradiction: "You resist being defined, but you're more consistent than you think.",
      mostLike: {
        character: "Indiana Jones",
        explanation:
          "Not because you seek adventure for its own sake, but because you move by instinct and figure out the rules as you go. The plan is always slightly behind the action.",
      },
      predictions: {
        wouldLove: "Uncut Gems — it never lets you breathe, and neither do you",
        wouldntEnjoy: "Long prestige dramas where the point is the absence of a point",
        wouldNeverFinish: "Anything with a 3-hour runtime and no forward momentum",
      },
      recommendations: {
        movies: ["Good Time", "Prisoners", "Enemy"],
        artists: ["Frank Ocean", "Bon Iver"],
        show: "Mindhunter",
      },
      summary:
        "You move through music and movies like someone who refuses to settle. Whatever catches your attention gets your full attention — until the next thing does.",
      musicBreakdown:
        "Your music taste doesn't follow a genre — it follows a feeling. You pick based on what the moment needs.",
      movieBreakdown:
        "Your movie choices show someone with strong gut reactions. You know immediately if something is worth your time.",
      contradictions:
        "You resist being defined, but you're more consistent than you think.",
    };

    return NextResponse.json({ result: fallback });
  }
}
