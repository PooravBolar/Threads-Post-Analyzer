# Threads Post Analyzer

**AI-powered content analysis tool with real users** — built for and distributed to my own 40k+ follower Threads audience.

🔗 **Live:** [threads-content-analyzer.vercel.app](https://threads-content-analyzer.vercel.app)

## What it does

Scores any Threads post across **8 dimensions** — engagement potential, readability, sentiment, hook strength, CTA quality, visual structure, authenticity, and a composite viral score — then generates AI-enhanced rewrites personalized to the user's own style.

The personalization is the interesting part: a **RAG-style reference engine** where each user builds a private knowledge base from their own viral posts and PDFs. Enhancement prompts retrieve from this base, so rewrites match *that creator's* proven voice instead of generic AI output.

## Architecture

```
React 18 + Vite (frontend)
        │
        ├── analysisEngine.js   → heuristic scoring across 8 dimensions
        ├── geminiService.js    → Gemini API: AI analysis + RAG-grounded rewrites
        └── firebaseService.js  → data layer
                │
                Firebase
                ├── Auth        → email/password, per-user isolation
                ├── Firestore   → document-model data: users, reference DB, analysis history
                └── Storage     → user-uploaded PDFs
```

Design decisions worth noting:

- **Document data modeling (NoSQL):** per-user collections for reference material and analysis history, secured with rule-based access control (`userId`-scoped Firestore rules) and composite indexes for history queries.
- **Client-only architecture:** runs entirely on Firebase free tier — no server to maintain, security enforced at the rules layer rather than an API gateway.
- **Two-tier analysis:** instant local heuristic scoring for free users; Gemini-powered deep analysis + enhancement for premium users.

## Why I built it

I grew a 40k+ follower Threads audience and kept getting asked *why* certain posts worked. Instead of answering one DM at a time, I encoded the analysis into a tool and shipped it to the same audience — which meant real users, real feedback, and real iteration pressure from day one.

## Stack

React 18, Vite, Firebase (Auth / Firestore / Storage), Google Gemini API, CSS variables (dark, Threads-inspired UI)

## Run locally

```bash
npm install
# create .env with Firebase + Gemini keys (see .env.example)
npm run dev
```
