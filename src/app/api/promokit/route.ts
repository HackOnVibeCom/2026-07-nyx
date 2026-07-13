import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { pitch, assetType, audience } = await req.json();

    if (!pitch || !assetType || !audience) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const systemPrompt = `You are an elite growth marketer and copywriter. Given a core pitch, asset type, and target audience, generate a comprehensive promotional kit.
Return ONLY valid JSON exactly matching this structure, with no markdown fences or preamble:
{
  "appStore": "A compelling 3-4 paragraph App Store / Google Play description.",
  "productHunt": "A sharp, engaging Product Hunt launch comment from the maker.",
  "twitterThread": ["Tweet 1 string", "Tweet 2 string", "Tweet 3 string"],
  "redditPost": "A community-focused, non-spammy Reddit post tailored to a relevant subreddit.",
  "pressEmail": "A short, punchy cold email to a tech journalist pitching the launch.",
  "shortCaption": "A punchy 1-2 sentence caption for TikTok/Instagram Reels."
}`;

    let res;
    let retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        res = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "poolside/laguna-m.1:free",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Asset Type: ${assetType}\nAudience: ${audience}\n\nCore Pitch to adapt:\n${pitch}` }
            ],
            temperature: 0.7,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://heckle.app",
              "X-Title": "Heckle",
            },
            timeout: 30000,
          }
        );
        break;
      } catch (e: any) {
        if (e.response?.status === 429 && i < retries - 1) {
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i)));
          continue;
        }
        throw e;
      }
    }

    if (!res) throw new Error("Max retries exceeded");

    const data = res.data;
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error(`Invalid response from OpenRouter API`);
    }

    let clean = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    clean = clean.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error: any) {
    console.error("Promo Kit generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
