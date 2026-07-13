import axios from "axios";

export async function generatePitchReport(pitch: string, personaResponses: { persona: string; response: string; wouldShare: string }[], assetType: string, audience: string) {
  try {
    let res;
    let retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        res = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "google/gemma-2-9b-it:free",
            messages: [
              {
                role: "system",
                content:
                  "You are a sharp mobile app launch coach. Analyze the user's launch asset and the reactions it received. Extract the overall consensus, score the asset, predict launch impact, point out any internal messaging contradictions, and provide a promotion coverage map. Respond ONLY with valid JSON, no markdown fences, no preamble.",
              },
              {
                role: "user",
                content: `Asset Type: ${assetType}\nTarget Audience: ${audience}\n\nAsset Content:\n${pitch}\n\nReactions it got:\n${JSON.stringify(
                  personaResponses
                )}\n\nReturn JSON exactly matching this format: {"launchImpact": {"downloadIntent": number 0-100, "shareability": number 0-100, "mediaPotential": number 0-100, "storeConversionConfidence": number 0-100}, "consensus": {"synthesis": "string", "metrics": {"clarity": {"status": "positive" | "warning", "message": "string"}, "differentiation": {"status": "positive" | "warning", "message": "string"}, "hookStrength": {"status": "positive" | "warning", "message": "string"}, "credibility": {"status": "positive" | "warning", "message": "string"}}}, "scores": {"clarity": number 0-100, "differentiation": number 0-100, "credibility": number 0-100, "hookStrength": number 0-100, "overall": number 0-100}, "notes": {"clarity": "string", "differentiation": "string", "credibility": "string", "hookStrength": "string"}, "hookTest": {"stopScrolling": "Yes" | "No", "reason": "string"}, "sentenceAnalysis": {"type": "Strongest" | "Weakest", "quote": "exact quote from text", "reason": "string"}, "contradictions": [{"claim1": "string", "claim2": "string", "confidence": number, "explanation": "string"}], "rewrite": {"improvedOpening": "string", "biggestChange": "string", "fullRewrite": "rewritten text specifically for this Asset Type"}, "promotionCoverageMap": [{"asset": "App Store Description", "status": "Strong" | "Weak" | "Missing" | "Optional", "reason": "string"}, {"asset": "Product Hunt Launch", "status": "Strong" | "Weak" | "Missing" | "Optional", "reason": "string"}, {"asset": "X/Twitter Launch Thread", "status": "Strong" | "Weak" | "Missing" | "Optional", "reason": "string"}, {"asset": "TikTok Caption", "status": "Strong" | "Weak" | "Missing" | "Optional", "reason": "string"}, {"asset": "Press Email", "status": "Strong" | "Weak" | "Missing" | "Optional", "reason": "string"}]}`,
              },
            ],
            temperature: 0.4,
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
      throw new Error(`Invalid response from OpenRouter API for pitch report`);
    }
    let clean = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    clean = clean.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    throw new Error(`OpenRouter API failed for pitch report: ${error.message}`);
  }
}
