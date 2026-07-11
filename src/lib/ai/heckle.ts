import axios from "axios";
import { PERSONAS } from "../personas";

const TONALITY_PROMPTS = {
  Kind: "Be constructive, warm, and highly supportive. Give feedback gently.",
  Professional: "Be formal, objective, and strictly professional.",
  Brutal: "Be ruthless, cynical, and brutally honest. Do not hold back any criticism.",
  Twitter: "Act like an unhinged, edgy reply-guy on Twitter. Use internet slang, be dismissive, and be brief."
};

export async function getPersonaResponse(personaKey: keyof typeof PERSONAS, pitch: string, brutality: keyof typeof TONALITY_PROMPTS = "Professional") {
  const persona = PERSONAS[personaKey];
  const tonality = TONALITY_PROMPTS[brutality];

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
                content: `You are ${persona.name}. ${persona.systemPrompt}\n\nTONE INSTRUCTION: ${tonality}\n\nIMPORTANT: You must respond in valid JSON format exactly like this: {"response": "your in-character reaction", "wouldShare": "Yes" or "Maybe" or "No"}`,
              },
              {
                role: "user",
                content: `Here is a pitch I am launching:\n\n${pitch}`,
              },
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
            timeout: 20000,
          }
        );
        break; // Success
      } catch (e: any) {
        if (e.response?.status === 429 && i < retries - 1) {
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i))); // 2s, 4s delay
          continue;
        }
        throw e;
      }
    }

    if (!res) throw new Error("Max retries exceeded");

    const data = res.data;
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error(`Invalid response from OpenRouter API for persona ${personaKey}`);
    }
    
    let clean = data.choices[0].message.content.replace(/```json|```/g, "").trim();
    // basic sanitization for invalid JSON
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      parsed = { response: clean, wouldShare: "Maybe" };
    }
    
    return {
      response: parsed.response || clean,
      wouldShare: parsed.wouldShare || "Maybe"
    };
  } catch (error: any) {
    throw new Error(`OpenRouter API failed for persona ${personaKey}: ${error.message}`);
  }
}

export async function runGauntlet(pitch: string, selectedPersonas: (keyof typeof PERSONAS)[], brutality: keyof typeof TONALITY_PROMPTS) {
  const promises = selectedPersonas.map(async (key) => {
    const result = await getPersonaResponse(key, pitch, brutality);
    return { persona: key, response: result.response, wouldShare: result.wouldShare };
  });

  return Promise.all(promises);
}
