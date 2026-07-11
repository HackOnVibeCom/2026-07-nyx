# 📱 Heckle: Mobile App Launch Simulator

> **Simulate your entire mobile app launch before it goes live.**

Heckle is an AI-powered launch rehearsal platform that simulates realistic public reactions to your mobile app before you publish it. Instead of discovering fatal flaws after launching on Product Hunt, TikTok, or the App Store, Heckle lets you pressure-test your messaging against a panel of AI stakeholders and receive structured, actionable feedback.

Whether you're writing an App Store description, a launch tweet, a TikTok caption, or an investor elevator pitch, Heckle gives you the private criticism you'd rather receive before thousands of people see it.

---

## ✨ Why Heckle?

Founders spend weeks building mobile apps.

Many spend less than an hour writing the launch copy that determines whether anyone cares.

A weak launch makes a great app look forgettable.
A vague hook gets scrolled past.
A confusing App Store description kills conversion.
A generic value proposition gets compared to existing apps.

Most founders only discover these problems **after** they launch. Heckle changes that. Instead of publishing first and learning later, you can rehearse your launch assets against AI personas designed to think like real mobile app consumers and stakeholders.

---

# 🚀 Features

## 🎭 AI Persona Gauntlet

Your launch asset is reviewed by up to 6 independent AI personas, each evaluating it through a completely different lens.

- **Early Adopter**
  - Seen thousands of apps
  - Skeptical of wrappers and clones
  - Looks for missing differentiation
- **Mobile Tech Journalist**
  - Inboxes at 100%
  - Wants a compelling "why now" and a real story
- **Social Media Scroller**
  - Scrolling with zero patience
  - Judges your first sentence (hook) instantly
- **App Investor**
  - Performs rapid startup triage
  - Looks for market size, traction, and defensibility
- **App Store Browser**
  - Highly suspicious of subscription traps
  - Looks for clear screenshots and immediate utility
- **First-Time User**
  - Impatient downloader
  - Demands immediate value and clear expectations

Every reviewer responds independently. No shared prompt. No canned responses.

---

## 📊 Launch Impact Scorecard

After every review, Heckle performs a second AI pass that synthesizes the feedback and analyzes your launch as a whole.

The report evaluates **Launch Impact**:
- **Download Intent**: How likely are users to install?
- **Shareability**: Will early users talk about this?
- **Media Potential**: Is there a story here for journalists?
- **Store Conversion**: Will this copy convert views to downloads?

alongside:
- **Consensus**: Patterns across the critics
- **Rewrite Suggestions**: Concrete ways to fix the asset
- **Promotion Coverage Map**: Recommendations for what other assets you should build to support this launch

---

## 🎯 Context-Aware Testing

Heckle adapts to what you are testing and who you are targeting:
- **Asset Types**: App Store Description, Product Hunt Launch, TikTok/Reels Caption, Press Release, Tweet Thread, Landing Page Headline, etc.
- **Audiences**: Gen Z, Professionals, Students, Gamers, Creators, Parents, etc.

---

# 🖼 Product Flow

```
Paste Launch Asset
      │
      ▼
Select Asset Type & Audience
      │
      ▼
Run the Gauntlet
      │
      ▼
AI Stakeholder Reactions
      │
      ▼
Consensus Analysis
      │
      ▼
Launch Impact Metrics
      │
      ▼
Promotion Coverage Map
```

---

# 💻 Tech Stack

### Frontend
- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS

### AI
- OpenRouter
- `tencent/hy3:free` (Reasoning-enabled LLM)

### Design
- Custom Editorial Design System
- `cuelume` for live Web Audio micro-interactions
- Sequential persona reveal animations

---

# ⚙️ How It Works

1. **Input**: Paste your app's launch copy, select the asset type (e.g., App Store Description), and pick your target audience.
2. **Gauntlet**: Heckle sends the copy to multiple AI reviewers simultaneously. Each has a unique personality and evaluation rubric.
3. **Analysis**: Once reviewers finish, an objective AI pitch coach extracts consensus, scores impact metrics, and builds a promotion map.
4. **Dashboard**: The results are presented in a sleek, magazine-inspired interface that feels like your app just survived a public launch.

---

# 🎨 Design Philosophy

Heckle deliberately avoids generic "AI app" aesthetics.

Instead of purple gradients, glassmorphism, neon visuals, and standard chatbot UIs, it embraces an **editorial design language** inspired by magazines, newspapers, and critique.

Core principles:
- Generous whitespace and typography-first layouts
- Restrained motion (e.g., subtle CSS tilts)
- Warm paper palette with minimal shadows
- Micro-interactions powered by live Web Audio (no sound files)

---

# 🌍 Potential Use Cases

- App Store & Google Play descriptions
- TikTok / Instagram Reels captions
- Product Hunt launch posts
- X / Twitter announcement threads
- Cold emails to mobile tech journalists
- Investor elevator pitches
- Demo Day presentations

---

# 💰 Business Potential & Pricing

Heckle targets a massive, underserved market: indie hackers, early-stage founders, product managers writing internal pitches, and students entering startup competitions. Anyone who has spent 20 minutes crafting a Product Hunt launch only to get 3 upvotes is our target customer.

### Pricing Model
- **Free Tier**: 3 reviews/month, 4 AI personas. (Perfect for students and casual hackers).
- **Pro Tier ($9/month)**: Unlimited reviews, all 6 mobile personas, persistent pitch history, and shareable report links for team collaboration.

---

# 🤝 Contributing

Contributions are welcome! If you'd like to improve Heckle, feel free to:
- Open an issue or submit a PR
- Suggest new mobile stakeholder personas
- Improve prompt engineering
- Optimize AI orchestration

---

# 🏗 Local Development

Clone the repository:
```bash
git clone https://github.com/Xconmax245/Heckle.git
```

Install dependencies:
```bash
npm install
```

Create an environment file:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Run the development server:
```bash
npm run dev
```

Open `http://localhost:3000` to run the gauntlet.

---

<div align="center">

### 🎤 Better to get roasted in private than ignored in public.

**Built with ❤️ for HackOnVibe 2026**

</div>
