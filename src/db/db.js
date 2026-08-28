import Dexie from 'dexie';

const db = new Dexie('LiferDB');

db.version(1).stores({
  quickNotes: '++id, updatedAt',
  habits: '++id, order, createdAt',
  dailyTasks: '++id, isCompleted, completedAt, isDeleted, createdAt',
  carouselImages: '++id, order',
  pomodoroSessions: '++id, startedAt, type, completedAt',
  projects: '++id, status, createdAt, updatedAt',
  projectPages: '++id, projectId, parentId, order, createdAt, updatedAt',
  transactions: '++id, type, category, date, createdAt',
  plans: '++id, type, status, priority, targetDate, createdAt',
});

db.version(2).stores({
  quickNotes: '++id, updatedAt',
  habits: '++id, order, createdAt',
  dailyTasks: '++id, isCompleted, completedAt, isDeleted, createdAt',
  carouselImages: '++id, order',
  pomodoroSessions: '++id, startedAt, type, completedAt',
  projects: '++id, status, createdAt, updatedAt',
  projectPages: '++id, projectId, parentId, order, createdAt, updatedAt',
  transactions: '++id, type, category, date, createdAt',
  plans: '++id, type, category, status, priority, targetDate, createdAt',
  planItems: '++id, planId, itemType, order, isCompleted, createdAt',
  media: '++id, mediaType, status, rating, createdAt, updatedAt',
});

db.version(3).stores({
  quickNotes: '++id, updatedAt',
  habits: '++id, order, createdAt',
  dailyTasks: '++id, isCompleted, completedAt, isDeleted, createdAt',
  carouselImages: '++id, order',
  pomodoroSessions: '++id, startedAt, type, completedAt',
  projects: '++id, status, createdAt, updatedAt',
  projectPages: '++id, projectId, parentId, order, createdAt, updatedAt',
  transactions: '++id, type, category, date, createdAt',
  plans: '++id, type, category, status, priority, targetDate, createdAt',
  planItems: '++id, planId, itemType, order, isCompleted, createdAt',
  media: '++id, mediaType, status, rating, createdAt, updatedAt',
  // Gamification
  xpLedger: '++id, action, amount, createdAt',
  streaks: '++id, type, lastActiveDate',
  badges: '++id, badgeKey, unlockedAt',
  weeklyChallenges: '++id, weekStart, isCompleted, createdAt',
  rewards: '++id, title, xpCost, createdAt',
  redemptions: '++id, rewardId, redeemedAt',
});

db.version(4).stores({
  quickNotes: '++id, updatedAt',
  habits: '++id, order, createdAt',
  dailyTasks: '++id, isCompleted, completedAt, isDeleted, createdAt',
  carouselImages: '++id, order',
  pomodoroSessions: '++id, startedAt, type, completedAt',
  projects: '++id, status, createdAt, updatedAt',
  projectPages: '++id, projectId, parentId, order, createdAt, updatedAt',
  transactions: '++id, type, category, date, createdAt',
  plans: '++id, type, category, status, priority, targetDate, createdAt',
  planItems: '++id, planId, itemType, order, isCompleted, createdAt',
  media: '++id, mediaType, status, rating, createdAt, updatedAt',
  // Gamification
  xpLedger: '++id, action, amount, createdAt',
  streaks: '++id, type, lastActiveDate',
  badges: '++id, badgeKey, unlockedAt',
  weeklyChallenges: '++id, weekStart, isCompleted, createdAt',
  rewards: '++id, title, xpCost, createdAt',
  redemptions: '++id, rewardId, redeemedAt',
  // Phase 4 additions
  savedNotes: '++id, createdAt',
  wishlistItems: '++id, status, createdAt',
  recurringTransactions: '++id, type, category, frequency, nextDate',
});

db.version(5).stores({
  quickNotes: '++id, updatedAt',
  habits: '++id, order, createdAt',
  dailyTasks: '++id, isCompleted, completedAt, isDeleted, createdAt',
  carouselImages: '++id, order',
  pomodoroSessions: '++id, startedAt, type, completedAt',
  projects: '++id, status, createdAt, updatedAt',
  projectPages: '++id, projectId, parentId, order, createdAt, updatedAt',
  transactions: '++id, type, category, date, createdAt',
  plans: '++id, type, category, status, priority, targetDate, createdAt',
  planItems: '++id, planId, itemType, order, isCompleted, createdAt',
  media: '++id, mediaType, status, rating, createdAt, updatedAt',
  // Gamification
  xpLedger: '++id, action, amount, createdAt',
  streaks: '++id, type, lastActiveDate',
  badges: '++id, badgeKey, unlockedAt',
  weeklyChallenges: '++id, weekStart, isCompleted, createdAt',
  rewards: '++id, title, xpCost, createdAt',
  redemptions: '++id, rewardId, redeemedAt',
  // Phase 4 additions
  savedNotes: '++id, createdAt',
  wishlistItems: '++id, status, createdAt',
  recurringTransactions: '++id, type, category, frequency, nextDate',
  // Phase 5 — AI Proactive
  aiNotifications: '++id, type, isRead, createdAt',
  aiBadges: '++id, badgeKey, unlockedAt, createdAt',
});

db.version(6).stores({
  quickNotes: '++id, updatedAt',
  habits: '++id, order, createdAt',
  dailyTasks: '++id, isCompleted, completedAt, isDeleted, createdAt',
  carouselImages: '++id, order',
  pomodoroSessions: '++id, startedAt, type, completedAt',
  projects: '++id, status, createdAt, updatedAt',
  projectPages: '++id, projectId, parentId, order, createdAt, updatedAt',
  transactions: '++id, type, category, date, createdAt',
  plans: '++id, type, category, status, priority, targetDate, createdAt',
  planItems: '++id, planId, itemType, order, isCompleted, createdAt',
  media: '++id, mediaType, status, rating, createdAt, updatedAt',
  // Gamification
  xpLedger: '++id, action, amount, createdAt',
  streaks: '++id, type, lastActiveDate',
  badges: '++id, badgeKey, unlockedAt, category',
  weeklyChallenges: '++id, weekStart, isCompleted, createdAt',
  rewards: '++id, title, xpCost, createdAt',
  redemptions: '++id, rewardId, redeemedAt',
  // Phase 4 additions
  savedNotes: '++id, createdAt',
  wishlistItems: '++id, status, createdAt',
  recurringTransactions: '++id, type, category, frequency, nextDate',
  // Phase 5 — AI Proactive
  aiNotifications: '++id, type, isRead, createdAt',
  aiBadges: '++id, badgeKey, unlockedAt, category, createdAt',
});

db.version(7).stores({
  quickNotes: '++id, updatedAt',
  habits: '++id, order, createdAt',
  dailyTasks: '++id, isCompleted, completedAt, isDeleted, createdAt',
  carouselImages: '++id, order',
  pomodoroSessions: '++id, startedAt, type, completedAt',
  projects: '++id, status, createdAt, updatedAt',
  projectPages: '++id, projectId, parentId, order, createdAt, updatedAt',
  transactions: '++id, type, category, date, createdAt',
  plans: '++id, type, category, status, priority, targetDate, createdAt',
  planItems: '++id, planId, itemType, order, isCompleted, createdAt',
  media: '++id, mediaType, status, rating, createdAt, updatedAt',
  // Gamification
  xpLedger: '++id, action, amount, createdAt',
  streaks: '++id, type, lastActiveDate',
  badges: '++id, badgeKey, unlockedAt, category',
  weeklyChallenges: '++id, weekStart, isCompleted, createdAt',
  rewards: '++id, title, xpCost, createdAt',
  redemptions: '++id, rewardId, redeemedAt',
  // Phase 4 additions
  savedNotes: '++id, createdAt',
  wishlistItems: '++id, status, createdAt',
  recurringTransactions: '++id, type, category, frequency, nextDate',
  // Phase 5 — AI Proactive
  aiNotifications: '++id, type, isRead, createdAt',
  aiBadges: '++id, badgeKey, unlockedAt, category, createdAt',
  // Phase 7 — News Quizzes
  newsQuizzes: '++id, articleTitle, articleUrl, category, isAnswered, isCorrect, createdAt',
});

// ── Data migration: fix old boolean isRead values ──────────────────────
// Old notifications stored isRead as `false` (boolean) which doesn't
// match Dexie's index query `.where('isRead').equals(0)`. Fix them on load.
db.on('ready', async () => {
  try {
    const all = await db.aiNotifications.toArray();
    for (const n of all) {
      if (n.isRead === false) {
        await db.aiNotifications.update(n.id, { isRead: 0 });
      } else if (n.isRead === true) {
        await db.aiNotifications.update(n.id, { isRead: 1 });
      }
    }
  } catch (e) {
    // Silently ignore migration errors
  }
});

export default db;
