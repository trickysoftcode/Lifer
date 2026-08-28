import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useEffect, useCallback } from 'react';
import db from '../db/db';
import { calculateLevel, BADGE_DEFS, calculateFocusScore, ensureWeeklyChallenges } from '../services/gamification';

// ── useXP ─────────────────────────────────────────────────────────────
export function useXP() {
  const entries = useLiveQuery(() => db.xpLedger.toArray(), []) || [];
  const totalXP = entries.reduce((sum, e) => sum + e.amount, 0);
  const levelInfo = calculateLevel(totalXP);

  // Recent XP events (last 20)
  const recent = [...entries].sort((a, b) => b.id - a.id).slice(0, 20);

  return { totalXP, ...levelInfo, recent };
}

// ── useStreak ─────────────────────────────────────────────────────────
export function useStreak() {
  const streak = useLiveQuery(
    () => db.streaks.where('type').equals('daily').first(),
    []
  );

  return {
    currentStreak: streak?.currentCount || 0,
    bestStreak: streak?.bestCount || 0,
    freezeTokens: streak?.freezeTokens || 0,
    lastActiveDate: streak?.lastActiveDate || null,
  };
}

// ── useBadges ─────────────────────────────────────────────────────────
export function useBadges() {
  const unlocked = useLiveQuery(() => db.badges.toArray(), []) || [];
  const unlockedKeys = new Set(unlocked.map(b => b.badgeKey));

  const allBadges = BADGE_DEFS.map(def => ({
    ...def,
    isUnlocked: unlockedKeys.has(def.key),
    unlockedAt: unlocked.find(b => b.badgeKey === def.key)?.unlockedAt || null,
  }));

  const unlockedCount = unlocked.length;
  const totalCount = BADGE_DEFS.length;

  return { allBadges, unlockedCount, totalCount };
}

// ── useRewards ────────────────────────────────────────────────────────
export function useRewards() {
  const rewards = useLiveQuery(() => db.rewards.orderBy('createdAt').toArray(), []) || [];
  const redemptions = useLiveQuery(() => db.redemptions.orderBy('redeemedAt').reverse().toArray(), []) || [];
  const xpEntries = useLiveQuery(() => db.xpLedger.toArray(), []) || [];

  const totalXP = xpEntries.reduce((sum, e) => sum + e.amount, 0);
  const spentXP = redemptions.reduce((sum, r) => {
    const reward = rewards.find(rw => rw.id === r.rewardId);
    return sum + (reward?.xpCost || 0);
  }, 0);
  const availableXP = totalXP - spentXP;

  const addReward = useCallback(async ({ title, emoji, xpCost }) => {
    await db.rewards.add({
      title,
      emoji: emoji || '🎁',
      xpCost: Number(xpCost),
      createdAt: new Date().toISOString(),
    });
  }, []);

  const redeemReward = useCallback(async (rewardId) => {
    const reward = await db.rewards.get(rewardId);
    if (!reward || availableXP < reward.xpCost) return false;
    await db.redemptions.add({
      rewardId,
      redeemedAt: new Date().toISOString(),
    });
    return true;
  }, [availableXP]);

  const deleteReward = useCallback(async (id) => {
    await db.rewards.delete(id);
  }, []);

  // Enrich redemptions with reward data
  const recentRedemptions = redemptions.slice(0, 10).map(r => ({
    ...r,
    reward: rewards.find(rw => rw.id === r.rewardId),
  }));

  return { rewards, availableXP, spentXP, totalXP, recentRedemptions, addReward, redeemReward, deleteReward };
}

// ── useWeeklyChallenges ───────────────────────────────────────────────
export function useWeeklyChallenges() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    ensureWeeklyChallenges().then(() => setInitialized(true));
  }, []);

  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  })();

  const challenges = useLiveQuery(
    () => initialized ? db.weeklyChallenges.where('weekStart').equals(weekStart).toArray() : [],
    [initialized, weekStart]
  ) || [];

  const completedCount = challenges.filter(c => c.isCompleted).length;

  return { challenges, completedCount, totalCount: challenges.length };
}

// ── useFocusScore ─────────────────────────────────────────────────────
export function useFocusScore() {
  const [score, setScore] = useState(0);

  // Re-calculate when habits, tasks or sessions change
  const habits = useLiveQuery(() => db.habits.toArray(), []) || [];
  const tasks = useLiveQuery(() => db.dailyTasks.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.pomodoroSessions.toArray(), []) || [];

  useEffect(() => {
    calculateFocusScore().then(setScore);
  }, [habits, tasks, sessions]);

  return score;
}

// ── useWeeklyReview (lazy — call refresh() to load) ───────────────────
export function useWeeklyReview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { getWeeklyReviewData } = await import('../services/gamification');
    const result = await getWeeklyReviewData();
    setData(result);
    setLoading(false);
  }, []);

  return { data, loading, refresh };
}
