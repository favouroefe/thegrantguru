# GrantGuru 🎓

**GrantGuru is a web app that helps students in Ireland find every grant, bursary and scholarship they might qualify for — in about 3 minutes.**

Students answer a short, friendly one-question-at-a-time scan (where you're from, what you study, your home & money situation, talents, and optional personal circumstances). A deterministic matching engine then compares those answers against a curated database of Irish student funds and shows what they may qualify for, how much it could be worth per year, and how to apply.

> Estimates only. Always check official eligibility on the provider's website.

---

## ✨ Features

- **Guided scan (6 parts)** — one question per screen, big tap-friendly option cards, tooltips ("Why we ask"), progress bar with part names, autosave, "Save & finish later", and a review screen with Edit links.
  - Part 1 · About you — gender + residency path (Irish / UK / EU / refugee / international / asylum / prefer not to say)
  - Part 2 · Your studies — college & course autocomplete, year, full/part-time, first time in college
  - Part 3 · Home & money — county, distance to college, household income bands, age, part-time work
  - Part 4 · Achievements — sports, academics, STEM, arts, Irish language, volunteering, entrepreneurship
  - Part 5 · Your situation *(optional, session-only)* — caring, lone parent, disability, care-experienced, Traveller/Roma, first-in-family, welfare, FE route. **Never saved to the database.**
  - Part 6 · Anything else — free text
- **Matching engine** (`src/lib/matching.ts`) — instant, explainable, no AI cost. Handles SUSI maintenance rates (30km+ distance → higher rate), SUSI vs. BTEA exclusivity ("You can't get both — we've counted the bigger one"), 1916 Bursary first-year rules, income bands, college-specific funds, gender (only ever *adds* women-in-STEM funds), and labels every match **Likely / Possible / Check eligibility** with a plain-English "Why you match" line.
- **Results page** — animated "You may qualify for up to €X per year" total, "Closing soon" strip (deadlines within 7 days), tabs (Grants / Scholarships / Other support / All), filter chips, sort by deadline or amount, and compact cards with Help me apply + Official site links.
- **Help me apply** — a step-by-step guide built from each fund's own `how_to_apply_steps`, with a tickable document checklist ("Ready to apply: X/Y"), deadline + add to calendar, and the official apply link. **No AI-written applications.**
- **Fund detail pages** — full amount wording, eligibility notes, documents needed, verification badge ("Being verified" where data isn't confirmed).
- **"What if?" slider** — recalculate matches instantly on the client as income band, distance and personal toggles change. Grants slide in/out with a highlight; the € total animates.
- **Ask GrantGuru chat** — a scripted prototype chat card on the home page (no AI calls, no backend): keyword-matched answers, typing animation, suggested-question chips, and action buttons like "Start my scan" / "Open calendar".
- **Calendar** — month and list views of every fund deadline, colour-coded by closeness, plus "Add all deadlines" to Google Calendar, Notion Calendar, or Apple/Outlook (.ics with a 7-day reminder). Per-grant add-to-calendar too.
- **Extras** — weekly newsletter view, notifications dropdown + settings, dashboard, profile, share-results modal, and a landing page with social proof.

---

## 🛠 What it was built with

| Layer | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) v1 (full-stack React 19, file-based routing via TanStack Router, server functions) |
| Build tool | Vite 7 + Nitro (deploys to edge/serverless) |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens), shadcn/ui components built on Radix UI primitives, Lucide icons |
| Data fetching | TanStack Query (query options + `useSuspenseQuery` pattern) |
| Backend / database | Lovable Cloud — Postgres database with row-level security, email/password auth, auto-generated type-safe client (`src/integrations/supabase/*`) |
| Forms & validation | React Hook Form + Zod |
| Calendar exports | Hand-rolled `.ics` builder + Google Calendar template URLs (`src/components/AddToCalendar.tsx`) |
| Charts | Recharts |
| Testing | Vitest + Testing Library + jsdom (`src/test/`) |
| Language | TypeScript (strict mode) |

### Design decisions worth knowing

- **Matching is deterministic, not AI.** `src/lib/matching.ts` runs in the browser over the `public.funds` table and is fully covered by `src/test/matching.test.ts`. This keeps results instant and explainable.
- **Part 5 answers live in `sessionStorage` only** (via `src/lib/options.ts` helpers). They influence matching while you're in the app but are never persisted.
- **The chat is a scripted prototype** (`src/lib/chat-script.ts`, `src/components/ChatCard.tsx`) with hardcoded answers and fallbacks — no AI or network calls, so demos never break.
- **Funds are data, not code.** Every grant/scholarship is a row in the `funds` table with structured tags (`open_to_tags`, `requires_tags`, `requires_any_tags`), amounts, deadline, apply steps and documents. Adding a fund requires no code change.

---

## 🚀 Getting started

### Option A — run it in Lovable (recommended)

This project was built with [Lovable](https://lovable.dev), and its backend (database, auth, managed client) is provisioned by **Lovable Cloud**. That's the fastest way to run it:

1. Import or open the project at lovable.dev.
2. Enable Lovable Cloud (backend) if not already connected — the database schema and seeded funds come with the project.
3. Click Preview. Everything (env vars, client SDK) is wired automatically.

### Option B — run locally

You need Node.js 20+ (install via [nvm](https://github.com/nvm-sh/nvm#installing-and-uploads)) and npm.

```sh
git clone <this-repository-url>
cd grantguru
npm install
npm run dev
```

The app expects these environment variables (in Lovable they are generated for you — see `.env.example` style naming):

```
VITE_SUPABASE_URL=<your project URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable (anon) key>
```

Server-side code additionally reads `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` at runtime, plus `LOVABLE_API_KEY` only if you re-enable AI features (the shipped chat is fully scripted and doesn't need it).

Then open http://localhost:5173.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run test` | Run the Vitest test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## 🗂 Project structure

```
src/
├── components/            # UI: GrantCard, ChatCard, WhatIf, AddToCalendar, HelpMeApply, AppShell…
│   └── scan/              # Inputs for the one-question-per-screen scan
├── hooks/                 # use-matches (profile + funds + situation → matches)
├── integrations/          # Auto-generated typed database client (don't edit)
├── lib/
│   ├── matching.ts        # ★ Deterministic eligibility engine
│   ├── options.ts         # Scan answer types, college/course lists, session storage
│   ├── chat-script.ts     # Scripted chat answers
│   └── data.ts            # TanStack Query options for profile / funds / user grants
├── routes/
│   ├── index.tsx          # Landing page
│   ├── auth.tsx           # Sign in / sign up
│   └── _authenticated/    # home, onboarding (the scan), results, grant/$id,
│                          # dashboard, calendar, weekly, profile, settings
└── test/                  # Vitest suites (matching, chat script, routing)
```

## 🧮 How matching works

Each fund row declares **who it's open to** (`open_to_tags`: Irish, UK, EU, refugee, international, asylum) and **what it requires** (`requires_tags` / `requires_any_tags`: income bands, distance, first-year, carer, lone parent, disability, sport, STEM, …). The engine in `src/lib/matching.ts`:

1. Filters funds to your residency path from Part 1.
2. Evaluates every required tag against your answers (yes / no / **unsure** when you answered "Not sure" or skipped).
3. Resolves special rules — one SUSI maintenance option matching your income (higher rate if 30km+), 1916 Bursary only for first-year first-timers, BTEA vs SUSI counted once at the higher value.
4. Labels each match **Likely** (all criteria met), **Possible** (variable amounts or uncertain answers), or **Check eligibility** (you preferred not to say).
5. Totals only the counted amounts — "Amount varies" funds are shown but never added to the headline figure.

## 🔐 Privacy notes

- Optional "Your situation" answers (Part 5) are stored in **session storage only** and cleared when you close the tab.
- Accounts use email/password sign-in; your saved answers and tracked grants are tied to your account with row-level security.
- No AI-written applications — "Help me apply" is a human-readable step-by-step guide built from the provider's own steps.

## ⚠️ Data disclaimer

Fund amounts, criteria and deadlines in the seeded data are for demonstration. Rows marked **"Being verified"** (`verified = false`) still need checking against the provider's official source. Always confirm eligibility on the official website before applying.

---

## Built with Lovable

This project was created and is maintained with [Lovable](https://lovable.dev). Open it in the editor to keep building, connect GitHub for two-way sync, or download the codebase to host it anywhere that runs Vite/Nitro.
