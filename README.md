# 🧬 Lifer — Personal Life Dashboard

A premium, ADHD-friendly personal life management dashboard built as a single-page application. Track habits, tasks, goals, projects, finances, media, and more — all from one beautiful interface.

> **100% client-side.** Your data never leaves your browser. Everything is stored locally in IndexedDB.

---

## ✨ Features

### 📋 Productivity
- **Daily Tasks** — Create, complete, and manage daily to-dos with smart carry-over
- **Daily Habits** — Track recurring habits with streaks and freeze tokens
- **Pomodoro Timer** — Built-in focus timer with session tracking
- **Quick Notes** — Capture thoughts instantly with rich text editing

### 📊 Life Management
- **Project Dashboard** — Kanban-style project management with nested pages (powered by BlockNote)
- **Life Plans** — Long-term goal setting with categorised plans, milestones, and checklists
- **Wishlist** — Track items you want with priority and status
- **Finance Tracker** — Income/expense tracking with charts, recurring transactions, and category breakdowns (₹ INR)

### 🎬 Media & News
- **Media Tracker** — Track movies, TV shows, books, anime, and games with ratings and status
- **News Hub** — Curated RSS news feed covering politics, tech, and cinema
- **News Quiz** — AI-generated quizzes from current news articles

### 🏆 Gamification
- **XP System** — Earn experience points for completing tasks, habits, and goals
- **Badges & Trophies** — Unlock achievements for milestones and consistency
- **Weekly Challenges** — Fresh challenges generated each week
- **Reward Shop** — Redeem earned XP for custom rewards
- **Streaks** — Maintain daily streaks with freeze token protection

### 🤖 AI Copilot
- **Chat Interface** — Conversational AI assistant powered by Google Gemini
- **Life Context Awareness** — AI has full context of your habits, tasks, goals, and progress
- **Proactive Insights** — Automatic notifications with suggestions and nudges
- **Dynamic Badges** — AI-generated badges for unique achievements
- **Budget Tracking** — Built-in API usage tracking with monthly cost caps

### 🎨 Design
- **Premium Dark Theme** — Glassmorphism, gradients, and micro-animations
- **Fully Responsive** — Adapts seamlessly from desktop to mobile
- **Inspiration Carousel** — Rotating motivational image gallery

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + Vite 8 |
| **Database** | Dexie.js (IndexedDB wrapper) |
| **Routing** | React Router v7 |
| **Styling** | Vanilla CSS with custom properties (design tokens) |
| **Charts** | Recharts |
| **Rich Text** | BlockNote |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **AI** | Google Gemini API (REST) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/trickysoftcode/Lifer.git
cd Lifer

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173/**

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🤖 AI Setup (Optional)

The AI Copilot requires a Google Gemini API key:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Open Lifer in your browser
3. Navigate to the AI Copilot section → Settings (⚙️)
4. Paste your API key

> Your API key is stored in your browser's `localStorage` and never sent anywhere except directly to the Gemini API.

---

## 📁 Project Structure

```
src/
├── components/          # UI components grouped by feature
│   ├── AI/              # AICopilot, AISettings, NewsQuizCard
│   ├── Finance/         # FinanceTracker
│   ├── Focus/           # PomodoroTimer, ImageCarousel
│   ├── Gamification/    # GamificationBar, TrophyCase, RewardShop, WeeklyChallenges
│   ├── Habits/          # DailyHabits, QuickNotes
│   ├── Header/          # Header
│   ├── Media/           # MediaTracker
│   ├── News/            # NewsHub
│   ├── Plans/           # LifePlans, Wishlist
│   ├── Projects/        # ProjectDashboard
│   └── Tasks/           # DailyTasks
├── db/
│   └── db.js            # Dexie database schema (v7)
├── hooks/               # Custom React hooks (useGamification, useAI, useProjects, etc.)
├── pages/               # Route-level page components
│   ├── HomePage.jsx     # Main dashboard layout
│   ├── ProjectPage.jsx  # Individual project view
│   ├── PlanDetailPage.jsx
│   ├── CompletedMediaPage.jsx
│   └── SavedNotesPage.jsx
├── services/
│   ├── gamification.js  # Badge definitions, XP calculations, challenge generation
│   ├── gemini.js        # Gemini API client, context builder, budget tracking
│   ├── aiProactive.js   # Proactive AI engine (notifications, dynamic badges)
│   ├── newsService.js   # RSS news feed fetching and caching
│   └── newsQuizService.js # AI-powered news quiz generation
└── index.css            # Global design system (tokens, utilities)
```

---

## 🔐 Privacy & Data

- **Zero backend** — No servers, no accounts, no cloud sync
- **IndexedDB storage** — All data persists locally in your browser
- **API keys in localStorage** — Never committed to source code
- **Gemini API calls** — Only made when you interact with the AI Copilot (optional)

---

## 📄 License

This project is for personal use. All rights reserved.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/trickysoftcode">Gautam</a>
</p>
