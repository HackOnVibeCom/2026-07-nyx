import axios from "axios";
import { PERSONAS } from "../personas";

export async function getPersonaResponse(personaKey: keyof typeof PERSONAS, pitch: string, assetType: string, audience: string) {
  const persona = PERSONAS[personaKey];

  try {
    let res;
    let retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        res = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "google/gemma-4-31b-it:free",
            messages: [
              {
                role: "system",
                content: `You are ${persona.name}. ${persona.systemPrompt}\n\nEVALUATION CONTEXT:\n- Asset Type: ${assetType}\n- Target Audience: ${audience}\n\nIMPORTANT: You must respond in valid JSON format exactly like this: {"response": "your in-character reaction", "wouldShare": "Yes" or "Maybe" or "No"}`,
              },
              {
                role: "user",
                content: `Here is the ${assetType} I am launching:\n\n${pitch}`,
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
    // Remove reasoning tags
    clean = clean.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
    
    let parsed;
    try {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    } catch (e) {
      parsed = { response: clean, wouldShare: "Maybe" };
    }
    
    return {
      response: parsed.response || clean,
      wouldShare: parsed.wouldShare || "Maybe"
    };
  } catch (error: any) {
    throw new Error(`OpenRouter API failed for persona ${personaKey}: ${error.message} - ${JSON.stringify(error.response?.data)}`);
  }
}

export async function runGauntlet(pitch: string, selectedPersonas: (keyof typeof PERSONAS)[], assetType: string, audience: string) {
  const promises = selectedPersonas.map(async (key) => {
    const result = await getPersonaResponse(key, pitch, assetType, audience);
    return { persona: key, response: result.response, wouldShare: result.wouldShare };
  });

  return Promise.all(promises);
}
