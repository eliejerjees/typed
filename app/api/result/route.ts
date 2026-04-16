import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { AppData, TypedResult } from "@/lib/types";
import { buildResultPrompt, RESULT_SYSTEM_PROMPT } from "@/lib/resultPrompt";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
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
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from OpenAI");

    const result = JSON.parse(raw) as TypedResult;

    // Validate required fields
    if (!result.coreType || !result.subType || !result.traits || !result.summary) {
      throw new Error("Incomplete result structure from LLM");
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error("[result]", err);

    // Fallback result so the app doesn't break
    const fallback: TypedResult = {
      coreType: "The Explorer",
      subType: "Restless Taste Seeker",
      traits: ["wide-ranging curiosity", "follows instinct over prestige", "hard to pin down"],
      summary:
        "You move through music and movies like someone who refuses to settle. Whatever catches your attention gets your full attention — until the next thing does.",
      musicBreakdown:
        "Your music taste doesn't follow a clear line, which is exactly the point. You pick based on mood, not genre loyalty.",
      movieBreakdown:
        "Your movie choices show someone who'll give anything a shot once, but has clear gut reactions about what earns a second viewing.",
      contradictions:
        "You'll claim a preference but your actual choices often say something slightly different — which makes the result more interesting, not less.",
    };

    return NextResponse.json({ result: fallback });
  }
}
