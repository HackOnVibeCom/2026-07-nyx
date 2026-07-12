const axios = require('axios');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/OPENROUTER_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

async function test() {
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

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemma-4-31b-it:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Asset Type: App Store Description\nAudience: Student\n\nCore Pitch to adapt:\nA minimal app that helps students study.` }
        ],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );
    console.log("Raw Response Content:");
    console.log(res.data.choices[0].message.content);
  } catch (e) {
    console.error("Error:", e.message);
    if (e.response) {
      console.error(e.response.data);
    }
  }
}

test();
