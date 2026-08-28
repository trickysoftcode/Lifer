import db from '../db/db';

// ── XP ────────────────────────────────────────────────────────────────
export const XP_ACTIONS = {
  habit_complete: { label: 'Completed a habit', amount: 10 },
  task_complete: { label: 'Completed a task', amount: 8 },
  pomodoro_complete: { label: 'Finished a focus session', amount: 15 },
  transaction_add: { label: 'Logged a transaction', amount: 3 },
  plan_subtask: { label: 'Completed a plan subtask', amount: 5 },
  goal_complete: { label: 'Completed a goal', amount: 50 },
  media_complete: { label: 'Finished a media item', amount: 5 },
  daily_login: { label: 'Daily login bonus', amount: 5 },
  challenge_complete: { label: 'Completed a weekly challenge', amount: 25 },
  news_quiz_correct: { label: 'Answered a news quiz question correctly', amount: 10 },
};

export async function awardXP(action, amount) {
  const xpAmount = amount ?? XP_ACTIONS[action]?.amount ?? 0;
  if (xpAmount <= 0) return;
  await db.xpLedger.add({
    action,
    amount: xpAmount,
    createdAt: new Date().toISOString(),
  });
  // Side effects
  await checkAndUpdateStreak();
  await checkAndUnlockBadges();
}

export function calculateLevel(totalXP) {
  let level = 1;
  let xpNeeded = 100;
  let consumed = 0;
  while (totalXP - consumed >= xpNeeded) {
    consumed += xpNeeded;
    level++;
    xpNeeded = level * 100;
  }
  return {
    level,
    xpIntoLevel: totalXP - consumed,
    xpForNextLevel: xpNeeded,
    totalXP,
  };
}

// ── STREAKS ───────────────────────────────────────────────────────────
function getToday() {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(dateStr1, dateStr2) {
  return Math.floor((new Date(dateStr2) - new Date(dateStr1)) / (1000 * 60 * 60 * 24));
}

export async function checkAndUpdateStreak() {
  const today = getToday();
  let streak = await db.streaks.where('type').equals('daily').first();

  if (!streak) {
    await db.streaks.add({
      type: 'daily',
      currentCount: 1,
      bestCount: 1,
      lastActiveDate: today,
      freezeTokens: 0,
    });
    return;
  }

  if (streak.lastActiveDate === today) return;

  const gap = daysBetween(streak.lastActiveDate, today);

  if (gap === 1) {
    const newCount = streak.currentCount + 1;
    const earnedFreeze = newCount % 7 === 0 ? 1 : 0;
    await db.streaks.update(streak.id, {
      currentCount: newCount,
      bestCount: Math.max(newCount, streak.bestCount),
      lastActiveDate: today,
      freezeTokens: Math.min((streak.freezeTokens || 0) + earnedFreeze, 3),
    });
  } else if (gap - 1 <= (streak.freezeTokens || 0)) {
    const newCount = streak.currentCount + 1;
    await db.streaks.update(streak.id, {
      currentCount: newCount,
      bestCount: Math.max(newCount, streak.bestCount),
      lastActiveDate: today,
      freezeTokens: (streak.freezeTokens || 0) - (gap - 1),
    });
  } else {
    await db.streaks.update(streak.id, {
      currentCount: 1,
      lastActiveDate: today,
      freezeTokens: 0,
    });
  }
}

// ── BADGES ────────────────────────────────────────────────────────────
export const BADGE_DEFS = [
  { key: 'first_steps',      emoji: '🌱', name: 'First Steps',      desc: 'Complete your first habit', category: 'Habits' },
  { key: 'task_starter',     emoji: '✅', name: 'Task Starter',     desc: 'Complete your first task', category: 'Tasks' },
  { key: 'week_warrior',     emoji: '🔥', name: 'Week Warrior',     desc: '7-day streak', category: 'Streaks' },
  { key: 'zen_master',       emoji: '🧘', name: 'Zen Master',       desc: 'Earn 200 XP from habits alone', category: 'Habits' },
  { key: 'focus_champion',   emoji: '⏱️', name: 'Focus Champion',   desc: 'Complete 10 Pomodoro sessions', category: 'Focus' },
  { key: 'money_conscious',  emoji: '💰', name: 'Money Conscious',  desc: 'Log 30 transactions', category: 'Finance' },
  { key: 'bookworm',         emoji: '📚', name: 'Bookworm',         desc: 'Complete 5 books', category: 'Media' },
  { key: 'wanderlust',       emoji: '🗺️', name: 'Wanderlust',      desc: 'Create 3 travel plans', category: 'Planning' },
  { key: 'goal_crusher',     emoji: '🎯', name: 'Goal Crusher',     desc: 'Complete 10 goals', category: 'Planning' },
  { key: 'diamond_streak',   emoji: '💎', name: 'Diamond Streak',   desc: '30-day streak', category: 'Streaks' },
  { key: 'century',          emoji: '💯', name: 'Century',           desc: '100-day streak', category: 'Streaks' },
  { key: 'level_5',          emoji: '⭐', name: 'Rising Star',      desc: 'Reach level 5', category: 'Milestones' },
  { key: 'level_10',         emoji: '🌟', name: 'Supernova',        desc: 'Reach level 10', category: 'Milestones' },
  { key: 'task_machine',     emoji: '⚡', name: 'Task Machine',     desc: 'Complete 50 daily tasks', category: 'Tasks' },
  { key: 'planner',          emoji: '📋', name: 'Master Planner',   desc: 'Create 5 life plans', category: 'Planning' },
  { key: 'xp_500',           emoji: '✨', name: '500 Club',         desc: 'Earn 500 XP', category: 'XP' },
  { key: 'xp_2000',          emoji: '💫', name: 'XP Legend',        desc: 'Earn 2,000 XP', category: 'XP' },
  { key: 'focus_30',         emoji: '🧠', name: 'Deep Work',        desc: 'Complete 30 Pomodoro sessions', category: 'Focus' },
  { key: 'completionist',    emoji: '🏅', name: 'Completionist',    desc: 'Complete all habits 7 days in a row', category: 'Habits' },
  { key: 'news_scholar',     emoji: '📰', name: 'News Scholar',     desc: 'Answer 15 news quiz questions correctly', category: 'Milestones' },
  { key: 'current_affairs_buff', emoji: '🧠', name: 'Current Affairs Buff', desc: 'Answer 50 news quiz questions correctly', category: 'Milestones' },
];

export async function updateBadge(id, updates) {
  await db.badges.update(id, updates);
}

export async function deleteBadge(id) {
  await db.badges.delete(id);
}

export async function checkAndUnlockBadges() {
  const unlocked = new Set((await db.badges.toArray()).map(b => b.badgeKey));
  const newlyUnlocked = [];

  const totalXP = (await db.xpLedger.toArray()).reduce((s, e) => s + e.amount, 0);
  const streak = await db.streaks.where('type').equals('daily').first();
  const streakCount = streak?.currentCount || 0;
  const pomodoroCount = await db.pomodoroSessions.count();
  const txCount = await db.transactions.count();
  const completedBooks = (await db.media.where('status').equals('completed').toArray()).filter(m => m.mediaType === 'book').length;
  const travelPlans = (await db.plans.where('type').equals('travel').toArray()).length;
  const completedGoals = (await db.plans.where('status').equals('completed').toArray()).filter(p => p.type === 'goal').length;
  const completedTaskCount = (await db.dailyTasks.toArray()).filter(t => t.isCompleted).length;
  const totalPlans = await db.plans.count();
  const habitXP = (await db.xpLedger.where('action').equals('habit_complete').toArray()).reduce((s, e) => s + e.amount, 0);
  const level = calculateLevel(totalXP).level;
  // Count total correct individual questions across all quizzes
  const allQuizzes = await db.newsQuizzes.toArray();
  const newsQuizCorrectCount = allQuizzes.reduce((sum, q) => sum + (q.correctCount || 0), 0);

  const checks = {
    first_steps: habitXP >= 10,
    task_starter: completedTaskCount >= 1,
    week_warrior: streakCount >= 7,
    zen_master: habitXP >= 200,
    focus_champion: pomodoroCount >= 10,
    money_conscious: txCount >= 30,
    bookworm: completedBooks >= 5,
    wanderlust: travelPlans >= 3,
    goal_crusher: completedGoals >= 10,
    diamond_streak: streakCount >= 30,
    century: streakCount >= 100,
    level_5: level >= 5,
    level_10: level >= 10,
    task_machine: completedTaskCount >= 50,
    planner: totalPlans >= 5,
    xp_500: totalXP >= 500,
    xp_2000: totalXP >= 2000,
    focus_30: pomodoroCount >= 30,
    completionist: false, // complex multi-day logic — future
    news_scholar: newsQuizCorrectCount >= 15,
    current_affairs_buff: newsQuizCorrectCount >= 50,
  };

  for (const [key, met] of Object.entries(checks)) {
    if (met && !unlocked.has(key)) {
      newlyUnlocked.push(key);
      await db.badges.add({ badgeKey: key, unlockedAt: new Date().toISOString() });
    }
  }

  return newlyUnlocked;
}

// ── WEEKLY CHALLENGES ─────────────────────────────────────────────────
const CHALLENGE_TEMPLATES = [
  { title: 'Complete 5 Pomodoro sessions', target: 5, action: 'pomodoro_complete' },
  { title: 'Complete 15 daily tasks', target: 15, action: 'task_complete' },
  { title: 'Track expenses every day', target: 7, action: 'transaction_add' },
  { title: 'Complete all habits 5 days', target: 5, action: 'habit_all_complete' },
  { title: 'Add 3 new goals', target: 3, action: 'goal_add' },
  { title: 'Earn 100 XP this week', target: 100, action: 'xp_total' },
  { title: 'Complete 10 habits', target: 10, action: 'habit_complete' },
  { title: 'Log 5 transactions', target: 5, action: 'transaction_add' },
  { title: 'Finish a book or movie', target: 1, action: 'media_complete' },
  { title: 'Complete 8 Pomodoro sessions', target: 8, action: 'pomodoro_complete' },
];

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

export async function ensureWeeklyChallenges() {
  const weekStart = getWeekStart();
  const existing = await db.weeklyChallenges.where('weekStart').equals(weekStart).toArray();
  if (existing.length >= 3) return existing;

  // Pick 3 random challenges
  const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, 3);

  const created = [];
  for (const pick of picks) {
    const id = await db.weeklyChallenges.add({
      ...pick,
      weekStart,
      progress: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });
    created.push({ id, ...pick, weekStart, progress: 0, isCompleted: false });
  }
  return created;
}

export async function incrementChallengeProgress(action) {
  const weekStart = getWeekStart();
  const challenges = await db.weeklyChallenges
    .where('weekStart').equals(weekStart)
    .filter(c => c.action === action && !c.isCompleted)
    .toArray();

  for (const ch of challenges) {
    const newProgress = (ch.progress || 0) + 1;
    const completed = newProgress >= ch.target;
    await db.weeklyChallenges.update(ch.id, {
      progress: newProgress,
      isCompleted: completed,
    });
    if (completed) {
      await db.xpLedger.add({
        action: 'challenge_complete',
        amount: XP_ACTIONS.challenge_complete.amount,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

// ── FOCUS SCORE ───────────────────────────────────────────────────────
export async function calculateFocusScore() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Habits
  const habits = await db.habits.toArray();
  const totalHabits = habits.length || 1;
  const checkedHabits = habits.filter(h => h.isChecked).length;
  const habitScore = (checkedHabits / totalHabits) * 40;

  // Tasks
  const allTasks = await db.dailyTasks.toArray();
  const todayTasks = allTasks.filter(t => t.createdAt >= todayISO.split('T')[0]);
  const totalTasks = todayTasks.length || 1;
  const completedTasks = todayTasks.filter(t => t.isCompleted).length;
  const taskScore = (completedTasks / totalTasks) * 30;

  // Pomodoro
  const sessions = await db.pomodoroSessions
    .where('completedAt').above(todayISO)
    .filter(s => s.type === 'work')
    .toArray();
  const pomodoroScore = Math.min(sessions.length * 10, 30);

  return Math.round(habitScore + taskScore + pomodoroScore);
}

// ── WEEKLY REVIEW ─────────────────────────────────────────────────────
export async function getWeeklyReviewData() {
  const now = new Date();
  const thisWeekStart = new Date(now);
  const day = thisWeekStart.getDay();
  thisWeekStart.setDate(thisWeekStart.getDate() - day + (day === 0 ? -6 : 1));
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const twStart = thisWeekStart.toISOString();
  const lwStart = lastWeekStart.toISOString();

  // XP this week vs last week
  const allXP = await db.xpLedger.toArray();
  const thisWeekXP = allXP.filter(e => e.createdAt >= twStart).reduce((s, e) => s + e.amount, 0);
  const lastWeekXP = allXP.filter(e => e.createdAt >= lwStart && e.createdAt < twStart).reduce((s, e) => s + e.amount, 0);

  // Tasks
  const allTasks = await db.dailyTasks.toArray();
  const twTasks = allTasks.filter(t => t.isCompleted && t.completedAt >= twStart).length;
  const lwTasks = allTasks.filter(t => t.isCompleted && t.completedAt >= lwStart && t.completedAt < twStart).length;

  // Pomodoro
  const allSessions = await db.pomodoroSessions.toArray();
  const twSessions = allSessions.filter(s => s.type === 'work' && s.completedAt >= twStart).length;
  const lwSessions = allSessions.filter(s => s.type === 'work' && s.completedAt >= lwStart && s.completedAt < twStart).length;

  // Transactions
  const allTx = await db.transactions.toArray();
  const twTx = allTx.filter(t => t.createdAt >= twStart).length;
  const lwTx = allTx.filter(t => t.createdAt >= lwStart && t.createdAt < twStart).length;

  // Focus score (today)
  const focusScore = await calculateFocusScore();

  // Streak
  const streak = await db.streaks.where('type').equals('daily').first();

  return {
    thisWeek: { xp: thisWeekXP, tasks: twTasks, pomodoro: twSessions, transactions: twTx },
    lastWeek: { xp: lastWeekXP, tasks: lwTasks, pomodoro: lwSessions, transactions: lwTx },
    focusScore,
    streak: streak?.currentCount || 0,
    bestStreak: streak?.bestCount || 0,
    freezeTokens: streak?.freezeTokens || 0,
    totalXP: allXP.reduce((s, e) => s + e.amount, 0),
  };
}
