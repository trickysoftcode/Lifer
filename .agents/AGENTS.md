# Lifer — Project Rules & Context

## Project Overview
Lifer is a premium personal life dashboard built as a single-page application. It tracks tasks, habits, goals, projects, finances, media consumption, streaks, gamification (XP, badges, rewards), and includes an AI copilot powered by Gemini.

## Tech Stack
- **Framework**: React 18 + Vite
- **Database**: Dexie (IndexedDB wrapper) — all data is client-side
- **Styling**: Vanilla CSS with CSS custom properties (design tokens in `src/index.css`)
- **AI**: Gemini 3.6 Flash via REST API (see `src/services/gemini.js`)
- **State**: React hooks + Dexie live queries (`useLiveQuery`)
- **No backend** — everything runs in the browser

## Architecture
```
src/
├── components/          # UI components grouped by feature
│   ├── AI/              # AICopilot, AISettings
│   ├── Finance/         # FinanceTracker
│   ├── Focus/           # PomodoroTimer, ImageCarousel
│   ├── Gamification/    # GamificationBar, TrophyCase, RewardShop, WeeklyChallenges
│   ├── Habits/          # DailyHabits, QuickNotes
│   ├── Header/          # Header
│   ├── Media/           # MediaTracker
│   ├── Plans/           # LifePlans, Wishlist
│   ├── Projects/        # ProjectDashboard
│   └── Tasks/           # DailyTasks
├── db/
│   └── db.js            # Dexie database schema (currently v5)
├── hooks/               # Custom React hooks (useGamification, useAI, useProjects, etc.)
├── pages/
│   └── HomePage.jsx     # Main layout — assembles all sections
├── services/
│   ├── gamification.js  # Badge definitions, XP calculations, challenge generation
│   ├── gemini.js        # Gemini API client, context builder, budget tracking
│   └── aiProactive.js   # Proactive AI engine (notifications, dynamic badges)
└── index.css            # Global design system (tokens, utilities)
```

## Design Principles
1. **Premium dark theme** — Glassmorphism, gradients, subtle micro-animations
2. **Rich aesthetics** — Never plain; always polished with hover effects, transitions
3. **Mobile-responsive** — Grid layouts adapt; touch-friendly controls
4. **Data-driven** — All components read from Dexie via hooks; no hardcoded data
5. **Modular** — Each feature is a self-contained component + hook + CSS module

## Key Conventions
- Database schema changes require a new `db.version(N)` in `src/db/db.js`
- Custom hooks go in `src/hooks/` and use `useLiveQuery` for reactive Dexie queries
- Services go in `src/services/` for non-UI logic
- CSS files are co-located with components (e.g., `Focus.css` next to `PomodoroTimer.jsx`)
- All design tokens (colors, spacing, fonts) are in `src/index.css` as CSS custom properties
- Currency is always INR (₹)
- The app belongs to "Gautam" — personalized references are OK

## Testing
- Run `npm run dev` to start the Vite dev server
- Test visually in the browser at `http://localhost:5173/`
- No test framework currently configured — verify via browser + console
- Take screenshots to verify visual changes

## AI Integration
- Gemini API key is stored in localStorage (auto-initialized from a default)
- Monthly budget cap of ₹500 tracked in localStorage
- AI context is built from all Dexie tables via `buildLifeContext()`
- Proactive checks run on app load and context refresh
