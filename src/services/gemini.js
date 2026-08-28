import db from '../db/db';

// ── API Key Management ────────────────────────────────────────────────
const API_KEY_STORAGE_KEY = 'lifer_gemini_api_key';
const DEFAULT_API_KEY = ''; // Set your Gemini API key via the UI settings

// Auto-initialize key on first load if not already stored
if (!localStorage.getItem(API_KEY_STORAGE_KEY)) {
  localStorage.setItem(API_KEY_STORAGE_KEY, DEFAULT_API_KEY);
}

export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function hasApiKey() {
  return !!getApiKey();
}

// ── Budget Management ─────────────────────────────────────────────────
const BUDGET_STORAGE_KEY = 'lifer_ai_budget';
const DEFAULT_MONTHLY_BUDGET = 500; // ₹500

export function getBudgetConfig() {
  const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return {
    monthlyLimit: DEFAULT_MONTHLY_BUDGET,
    currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    tokensUsed: 0,
    callsThisMonth: 0,
    estimatedCostINR: 0,
  };
}

export function saveBudgetConfig(config) {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(config));
}

export function trackAPIUsage(promptTokens, responseTokens) {
  const config = getBudgetConfig();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Reset if new month
  if (config.currentMonth !== currentMonth) {
    config.currentMonth = currentMonth;
    config.tokensUsed = 0;
    config.callsThisMonth = 0;
    config.estimatedCostINR = 0;
  }

  const totalTokens = (promptTokens || 0) + (responseTokens || 0);
  config.tokensUsed += totalTokens;
  config.callsThisMonth += 1;

  // Gemini 2.0 Flash pricing: ~₹0.006 per 1K tokens (approximate for INR)
  config.estimatedCostINR += (totalTokens / 1000) * 0.006;

  saveBudgetConfig(config);
  return config;
}

export function isBudgetExceeded() {
  const config = getBudgetConfig();
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (config.currentMonth !== currentMonth) return false;
  return config.estimatedCostINR >= config.monthlyLimit;
}

// ── Context Builder ───────────────────────────────────────────────────
export async function buildLifeContext() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Gather all data from Dexie
  const [
    habits,
    dailyTasks,
    projects,
    transactions,
    plans,
    planItems,
    media,
    xpLedger,
    streaks,
    badges,
    weeklyChallenges,
    pomodoroSessions,
    wishlistItems,
    savedNotes,
    rewards,
    redemptions,
    newsQuizzes,
  ] = await Promise.all([
    db.habits.toArray(),
    db.dailyTasks.toArray(),
    db.projects.toArray(),
    db.transactions.toArray(),
    db.plans.toArray(),
    db.planItems.toArray(),
    db.media.toArray(),
    db.xpLedger.toArray(),
    db.streaks.toArray(),
    db.badges.toArray(),
    db.weeklyChallenges.toArray(),
    db.pomodoroSessions.toArray(),
    db.wishlistItems.toArray(),
    db.savedNotes.toArray(),
    db.rewards.toArray(),
    db.redemptions.toArray(),
    db.newsQuizzes.toArray(),
  ]);

  // Calculate derived stats
  const totalXP = xpLedger.reduce((s, e) => s + e.amount, 0);
  const streak = streaks.find(s => s.type === 'daily');
  const activeTasks = dailyTasks.filter(t => !t.isDeleted);
  const pendingTasks = activeTasks.filter(t => !t.isCompleted);
  const completedTasks = activeTasks.filter(t => t.isCompleted);
  const answeredQuizzes = newsQuizzes.filter(q => q.isFullyAnswered);
  const totalCorrectQuestions = newsQuizzes.reduce((sum, q) => sum + (q.correctCount || 0), 0);
  const totalQuizQuestions = newsQuizzes.reduce((sum, q) => sum + (q.totalQuestions || 0), 0);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');

  const activeGoals = plans.filter(p => p.type === 'goal' && p.status !== 'completed');
  const completedGoals = plans.filter(p => p.type === 'goal' && p.status === 'completed');
  const upcomingEvents = plans.filter(p => p.type === 'event' && p.status !== 'completed');
  const travelPlans = plans.filter(p => p.type === 'travel');

  const booksReading = media.filter(m => m.mediaType === 'book' && m.status === 'reading');
  const booksCompleted = media.filter(m => m.mediaType === 'book' && m.status === 'completed');
  const showsWatching = media.filter(m => m.mediaType === 'show' && m.status === 'watching');
  const gamesPlaying = media.filter(m => m.mediaType === 'game' && m.status === 'playing');

  const todaySessions = pomodoroSessions.filter(s => s.completedAt >= today && s.type === 'work');

  // Build context string
  const context = `
## Life Dashboard Context for Gautam (as of ${now.toLocaleString('en-IN')})

### 🔥 Streaks & Gamification
- Current streak: ${streak?.currentCount || 0} days | Best: ${streak?.bestCount || 0} days
- Freeze tokens: ${streak?.freezeTokens || 0}
- Total XP: ${totalXP} | Badges unlocked: ${badges.length}/19
${badges.length > 0 ? `- Unlocked badges: ${badges.map(b => b.badgeKey).join(', ')}` : ''}
${weeklyChallenges.length > 0 ? `- Weekly challenges: ${weeklyChallenges.map(c => `${c.title} (${c.progress}/${c.target}${c.isCompleted ? ' ✅' : ''})`).join('; ')}` : ''}

### ✅ Daily Tasks (Today)
- Pending: ${pendingTasks.length} | Completed: ${completedTasks.length}
${pendingTasks.length > 0 ? `- Pending tasks: ${pendingTasks.map(t => t.title).join(', ')}` : '- No pending tasks'}
${completedTasks.length > 0 ? `- Completed tasks: ${completedTasks.map(t => t.title).join(', ')}` : ''}

### 🧘 Daily Habits
- Total habits: ${habits.length}
${habits.length > 0 ? `- Habits: ${habits.map(h => `${h.title} (${h.isChecked ? '✅' : '⬜'})`).join(', ')}` : '- No habits set'}
- Checked: ${habits.filter(h => h.isChecked).length}/${habits.length}

### ⏱️ Focus Sessions (Today)
- Completed pomodoro sessions today: ${todaySessions.length}
- Total all-time sessions: ${pomodoroSessions.filter(s => s.type === 'work').length}

### 🚀 Projects
- Active: ${activeProjects.length} | Completed: ${completedProjects.length}
${activeProjects.map(p => `  - ${p.icon || '📁'} ${p.title}: ${p.description || 'No description'}`).join('\n')}

### 💰 Finance
- Total income: ₹${totalIncome.toLocaleString('en-IN')}
- Total expenses: ₹${totalExpenses.toLocaleString('en-IN')}
- Net balance: ₹${(totalIncome - totalExpenses).toLocaleString('en-IN')}
${transactions.length > 0 ? `- Recent transactions: ${transactions.slice(0, 5).map(t => `${t.type === 'income' ? '+' : '-'}₹${t.amount} (${t.category}${t.description ? ': ' + t.description : ''})`).join('; ')}` : ''}

### 🎯 Goals & Plans
- Active goals: ${activeGoals.length} | Completed: ${completedGoals.length}
${activeGoals.map(g => {
  const subtasks = planItems.filter(i => i.planId === g.id && i.itemType === 'subtask');
  const completed = subtasks.filter(i => i.isCompleted).length;
  return `  - ${g.title} [${g.priority}] ${g.category || ''} ${subtasks.length > 0 ? `(${completed}/${subtasks.length} subtasks)` : ''}`;
}).join('\n')}
- Upcoming events: ${upcomingEvents.length}
${upcomingEvents.map(e => `  - ${e.title}${e.targetDate ? ` (${e.targetDate})` : ''}`).join('\n')}
- Travel plans: ${travelPlans.length}
${travelPlans.map(t => `  - ${t.title} → ${t.destination || 'TBD'}${t.targetDate ? ` (${t.targetDate})` : ''}`).join('\n')}

### 📚 Media & Entertainment
- Currently reading: ${booksReading.map(b => b.title).join(', ') || 'Nothing'}
- Books completed: ${booksCompleted.length}
- Shows watching: ${showsWatching.map(s => s.title).join(', ') || 'None'}
- Games playing: ${gamesPlaying.map(g => g.title).join(', ') || 'None'}
- Total media items: ${media.length}

### 🎁 Wishlist
${wishlistItems.length > 0 ? wishlistItems.map(w => `  - ${w.title || w.name} (${w.status})`).join('\n') : '- Empty wishlist'}

### 🏆 Reward Shop
- Available XP to spend: ${totalXP - redemptions.reduce((s, r) => {
  const rw = rewards.find(x => x.id === r.rewardId);
  return s + (rw?.xpCost || 0);
}, 0)}
${rewards.length > 0 ? `- Available rewards: ${rewards.map(r => `${r.emoji || '🎁'} ${r.title} (${r.xpCost} XP)`).join(', ')}` : ''}

### 📝 Saved Notes
- Total saved notes: ${savedNotes.length}

### 📰 News Knowledge & Quizzes
- Total quizzes: ${newsQuizzes.length} (5 questions each) | Completed: ${answeredQuizzes.length} | Questions correct: ${totalCorrectQuestions}/${totalQuizQuestions}
${answeredQuizzes.length > 0 ? `- Recent quizzes: ${answeredQuizzes.slice(-3).map(q => `"${q.articleTitle}" (${q.correctCount}/${q.totalQuestions} correct)`).join(', ')}` : '- No quizzes completed yet'}
`.trim();

  // Cache the context
  await saveContextToStorage(context);

  return context;
}

async function saveContextToStorage(context) {
  const key = 'lifer_ai_context';
  const data = {
    context,
    builtAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(data));
}

export function getCachedContext() {
  const stored = localStorage.getItem('lifer_ai_context');
  if (!stored) return null;
  return JSON.parse(stored);
}

// ── Chat with Gemini ──────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are "Lifer AI", a personal life copilot for Gautam. You have deep knowledge of his current life data including tasks, habits, goals, projects, finances, media, streaks, and gamification progress.

Your personality:
- Warm, encouraging, but honest
- Data-driven and specific — reference actual numbers, task names, goal names
- Proactive — suggest next steps, flag risks, celebrate wins
- Concise — keep responses focused and actionable
- Use emoji sparingly but effectively

Your capabilities:
- Analyze productivity patterns and suggest improvements
- Provide daily/weekly summaries and focus recommendations
- Help prioritize tasks and goals
- Offer financial insights and budgeting advice
- Track reading/media progress and suggest what to focus on
- Motivate through gamification awareness (streaks, XP, badges)
- Generate personalized action plans
- Answer questions about life progress and data

Important rules:
- Always base responses on the actual data provided in the context
- If data is sparse, acknowledge it and suggest adding more data
- Currency is always INR (₹)
- Be aware of Indian context (festivals, work culture, etc.)
- Keep responses under 300 words unless a detailed breakdown is requested`;

export async function chatWithGemini(userMessage, conversationHistory = []) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not configured');

  if (isBudgetExceeded()) {
    throw new Error('Monthly AI budget exceeded. Please wait until next month or increase the budget in settings.');
  }

  // Get cached context or build fresh
  let context = getCachedContext();
  if (!context) {
    const freshContext = await buildLifeContext();
    context = { context: freshContext, builtAt: new Date().toISOString() };
  }

  // Build conversation contents
  const contents = [];

  // System instruction with context
  const systemWithContext = `${SYSTEM_PROMPT}\n\n--- CURRENT LIFE DATA ---\n${context.context}\n--- END LIFE DATA ---\n\nContext last refreshed: ${context.builtAt}`;

  // Add conversation history
  for (const msg of conversationHistory) {
    contents.push({
      role: msg.role,
      parts: [{ text: msg.text }],
    });
  }

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const body = {
    system_instruction: {
      parts: [{ text: systemWithContext }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

  // Track token usage
  const usage = data.usageMetadata || {};
  trackAPIUsage(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);

  return {
    text,
    tokensUsed: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
  };
}

// ── Quick Insights (pre-built prompts) ────────────────────────────────
export const QUICK_PROMPTS = [
  { id: 'daily_summary', emoji: '📊', label: 'Daily Summary', prompt: 'Give me a quick summary of my day so far — what I\'ve done, what\'s pending, and what I should focus on next.' },
  { id: 'weekly_review', emoji: '📈', label: 'Weekly Review', prompt: 'Give me a weekly review. How did I perform? What patterns do you see? What should I improve next week?' },
  { id: 'focus_advice', emoji: '🎯', label: 'What to Focus On', prompt: 'Based on my current tasks, goals, and priorities, what should I focus on right now? Give me a top-3 priority list with reasoning.' },
  { id: 'finance_check', emoji: '💰', label: 'Finance Check', prompt: 'Analyze my current financial situation. How am I doing? Any concerns? Suggestions for improvement?' },
  { id: 'motivation', emoji: '🔥', label: 'Motivate Me', prompt: 'I need some motivation. Look at my progress, streaks, badges, and accomplishments and give me a personalized pep talk.' },
  { id: 'goal_progress', emoji: '🎯', label: 'Goal Progress', prompt: 'How am I doing on my goals? Which ones need attention? Any I should consider adjusting or dropping?' },
  { id: 'reading_recs', emoji: '📚', label: 'Reading Progress', prompt: 'How am I doing with my reading? What should I prioritize finishing? Any suggestions based on my reading patterns?' },
  { id: 'habit_analysis', emoji: '🧘', label: 'Habit Analysis', prompt: 'Analyze my habits. Which ones am I consistent with? Which need improvement? Any suggestions for new habits based on my goals?' },
];

// ── Data Flush ────────────────────────────────────────────────────────
export async function flushAllData() {
  await db.transaction('rw',
    db.quickNotes, db.habits, db.dailyTasks, db.carouselImages,
    db.pomodoroSessions, db.projects, db.projectPages, db.transactions,
    db.plans, db.planItems, db.media, db.xpLedger, db.streaks,
    db.badges, db.weeklyChallenges, db.rewards, db.redemptions,
    db.savedNotes, db.wishlistItems, db.recurringTransactions,
    db.aiNotifications, db.aiBadges, db.newsQuizzes,
    async () => {
      await db.quickNotes.clear();
      await db.habits.clear();
      await db.dailyTasks.clear();
      await db.carouselImages.clear();
      await db.pomodoroSessions.clear();
      await db.projects.clear();
      await db.projectPages.clear();
      await db.transactions.clear();
      await db.plans.clear();
      await db.planItems.clear();
      await db.media.clear();
      await db.xpLedger.clear();
      await db.streaks.clear();
      await db.badges.clear();
      await db.weeklyChallenges.clear();
      await db.rewards.clear();
      await db.redemptions.clear();
      await db.savedNotes.clear();
      await db.wishlistItems.clear();
      await db.recurringTransactions.clear();
      await db.aiNotifications.clear();
      await db.aiBadges.clear();
      await db.newsQuizzes.clear();
    }
  );

  // Clear AI context cache and proactive check state
  localStorage.removeItem('lifer_ai_context');
  localStorage.removeItem('lifer_last_reward_suggestion');
  localStorage.removeItem('lifer_last_behavior_suggestion');
  localStorage.removeItem('lifer_last_challenge_notif');
  localStorage.removeItem('lifer_notified_badges');
}
