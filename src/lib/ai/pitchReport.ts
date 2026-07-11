import axios from "axios";

export async function generatePitchReport(pitch: string, personaResponses: { persona: string; response: string; wouldShare: string }[]) {
  try {
    let res;
    let retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        res = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "nvidia/nemotron-4-340b-instruct:free",
            messages: [
              {
                role: "system",
                content:
                  "You are a sharp pitch coach. Analyze the user's pitch and the reactions it received from different personas. Extract the overall consensus, score the pitch, analyze the hook, and predict launch performance. Respond ONLY with valid JSON, no markdown fences, no preamble.",
              },
              {
                role: "user",
                content: `Pitch:\n${pitch}\n\nReactions it got:\n${JSON.stringify(
                  personaResponses
                )}\n\nReturn JSON exactly matching this format: {"launchConfidence": {"score": number 0-100, "reasons": ["string", "string", "string"]}, "consensus": {"synthesis": "string (e.g. 3/4 personas independently questioned your differentiation.)", "metrics": {"clarity": {"status": "positive" | "warning", "message": "string"}, "differentiation": {"status": "positive" | "warning", "message": "string"}, "hookStrength": {"status": "positive" | "warning", "message": "string"}, "credibility": {"status": "positive" | "warning", "message": "string"}}}, "scores": {"clarity": number 0-100, "differentiation": number 0-100, "credibility": number 0-100, "hookStrength": number 0-100}, "notes": {"clarity": "string", "differentiation": "string", "credibility": "string", "hookStrength": "string"}, "hookTest": {"stopScrolling": "Yes" | "No", "reason": "string"}, "sentenceAnalysis": {"type": "Strongest" | "Weakest", "quote": "string exact quote from pitch", "reason": "string"}, "rewrite": {"improvedOpening": "string", "biggestChange": "string short description", "fullRewrite": "string full rewritten pitch"}}`,
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
    const clean = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (error: any) {
    throw new Error(`OpenRouter API failed for pitch report: ${error.message}`);
  }
}
