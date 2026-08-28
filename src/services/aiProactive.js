import db from '../db/db';
import { chatWithGemini, buildLifeContext, hasApiKey, isBudgetExceeded } from './gemini';
import { BADGE_DEFS } from './gamification';

// ── Notification Types ────────────────────────────────────────────────
export const NOTIF_TYPES = {
  WEEKLY_CHALLENGES: 'weekly_challenges',
  BADGE_UNLOCKED: 'badge_unlocked',
  NEW_AI_BADGES: 'new_ai_badges',
  REWARD_SUGGESTION: 'reward_suggestion',
  HABIT_SUGGESTION: 'habit_suggestion',
  TASK_SUGGESTION: 'task_suggestion',
  INSIGHT: 'insight',
};

// ── Store a notification ──────────────────────────────────────────────
export async function addNotification(type, message, metadata = {}) {
  return await db.aiNotifications.add({
    type,
    message,
    metadata,
    isRead: 0,
    createdAt: new Date().toISOString(),
  });
}

// ── Get unread notifications ──────────────────────────────────────────
export async function getUnreadNotifications() {
  const all = await db.aiNotifications.toArray();
  return all.filter(n => !n.isRead).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

// ── Mark notifications as read ────────────────────────────────────────
export async function markNotificationsRead(ids) {
  for (const id of ids) {
    await db.aiNotifications.update(id, { isRead: 1 });
  }
}

export async function markAllNotificationsRead() {
  const all = await db.aiNotifications.toArray();
  const unread = all.filter(n => !n.isRead);
  for (const n of unread) {
    await db.aiNotifications.update(n.id, { isRead: 1 });
  }
}

// ── Dynamic Badge Generation ──────────────────────────────────────────
// When user has unlocked >= threshold static badges, AI generates new ones

const AI_BADGE_THRESHOLD = 10; // After 10 static badges unlocked
const AI_BADGES_PER_BATCH = 10;

export async function checkAndGenerateAIBadges() {
  if (!hasApiKey() || isBudgetExceeded()) return [];

  const unlockedStatic = await db.badges.toArray();
  const existingAiBadges = await db.aiBadges.toArray();

  // Only generate if threshold met and no AI badges exist yet
  // Also generate a new batch if all current AI badges are unlocked
  const unlockedAiCount = existingAiBadges.filter(b => b.isUnlocked).length;
  const shouldGenerate =
    unlockedStatic.length >= AI_BADGE_THRESHOLD &&
    (existingAiBadges.length === 0 || unlockedAiCount === existingAiBadges.length);

  if (!shouldGenerate) return [];

  try {
    // Build context for badge generation
    await buildLifeContext();

    const prompt = `Based on Gautam's life data, generate exactly ${AI_BADGES_PER_BATCH} NEW achievement badges/trophies that are personalized to his goals, habits, and progress patterns.

Each badge should be challenging but achievable and directly related to his actual data (task counts, habit streaks, financial goals, reading goals, project milestones, etc.).

Return ONLY a valid JSON array with NO extra text, no markdown code fences. Each object must have:
- "key": unique snake_case identifier (e.g. "marathon_reader")
- "emoji": single emoji
- "name": short badge name (2-4 words)
- "desc": achievement description (what needs to be done)
- "checkType": one of "xp", "tasks", "habits", "pomodoro", "media", "finance", "streak", "plans", "projects"
- "checkValue": numeric threshold to unlock

Already existing badge keys to avoid: ${[...unlockedStatic.map(b => b.badgeKey), ...existingAiBadges.map(b => b.badgeKey)].join(', ')}`;

    const result = await chatWithGemini(prompt);

    // Parse the JSON response
    let badges;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let text = result.text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        badges = JSON.parse(jsonMatch[0]);
      } else {
        badges = JSON.parse(text);
      }
    } catch (parseErr) {
      console.error('Failed to parse AI badges:', parseErr);
      return [];
    }

    if (!Array.isArray(badges) || badges.length === 0) return [];

    // Store the new badges
    const stored = [];
    for (const badge of badges.slice(0, AI_BADGES_PER_BATCH)) {
      if (!badge.key || !badge.name) continue;
      const id = await db.aiBadges.add({
        badgeKey: badge.key,
        emoji: badge.emoji || '🎖️',
        name: badge.name,
        desc: badge.desc || '',
        checkType: badge.checkType || 'xp',
        checkValue: badge.checkValue || 100,
        isUnlocked: false,
        unlockedAt: null,
        createdAt: new Date().toISOString(),
      });
      stored.push({ id, ...badge });
    }

    // Notify user about new badges
    if (stored.length > 0) {
      const badgeList = stored.map(b => `${b.emoji} **${b.name}** — ${b.desc}`).join('\n');
      await addNotification(
        NOTIF_TYPES.NEW_AI_BADGES,
        `🏆 **${stored.length} New Trophies Unlocked!**\n\nBased on your progress, I've created ${stored.length} new personalized achievements for you:\n\n${badgeList}\n\nKeep pushing — these are tailored to your journey! 💪`,
        { badgeKeys: stored.map(b => b.key) }
      );
    }

    return stored;
  } catch (err) {
    console.error('Failed to generate AI badges:', err);
    return [];
  }
}

// ── Check AI Badge Unlocks ────────────────────────────────────────────
export async function checkAIBadgeUnlocks() {
  const aiBadges = await db.aiBadges.filter(b => !b.isUnlocked).toArray();
  if (aiBadges.length === 0) return [];

  // Gather stats
  const xpLedger = await db.xpLedger.toArray();
  const totalXP = xpLedger.reduce((s, e) => s + e.amount, 0);
  const completedTasks = (await db.dailyTasks.toArray()).filter(t => t.isCompleted).length;
  const habitXP = xpLedger.filter(e => e.action === 'habit_complete').reduce((s, e) => s + e.amount, 0);
  const pomodoroCount = await db.pomodoroSessions.count();
  const completedMedia = (await db.media.where('status').equals('completed').toArray()).length;
  const txCount = await db.transactions.count();
  const streak = await db.streaks.where('type').equals('daily').first();
  const streakCount = streak?.currentCount || 0;
  const planCount = await db.plans.count();
  const projectCount = await db.projects.count();

  const statMap = {
    xp: totalXP,
    tasks: completedTasks,
    habits: Math.floor(habitXP / 10), // 10 XP per habit
    pomodoro: pomodoroCount,
    media: completedMedia,
    finance: txCount,
    streak: streakCount,
    plans: planCount,
    projects: projectCount,
  };

  const newlyUnlocked = [];
  for (const badge of aiBadges) {
    const current = statMap[badge.checkType] || 0;
    if (current >= badge.checkValue) {
      await db.aiBadges.update(badge.id, {
        isUnlocked: true,
        unlockedAt: new Date().toISOString(),
      });
      newlyUnlocked.push(badge);

      // Notify
      await addNotification(
        NOTIF_TYPES.BADGE_UNLOCKED,
        `🎉 **Trophy Unlocked!** ${badge.emoji} **${badge.name}**\n\n${badge.desc}\n\nYou've earned this through your dedication. Amazing work, Gautam! 🌟`,
        { badgeKey: badge.badgeKey }
      );
    }
  }

  return newlyUnlocked;
}

// ── AI Reward Recommendations ─────────────────────────────────────────
export async function generateRewardSuggestions() {
  if (!hasApiKey() || isBudgetExceeded()) return;

  // Check if we already suggested recently (last 7 days)
  const lastSuggestion = localStorage.getItem('lifer_last_reward_suggestion');
  if (lastSuggestion) {
    const daysSince = (Date.now() - new Date(lastSuggestion).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return;
  }

  try {
    await buildLifeContext();

    const prompt = `Based on Gautam's wishlist, interests, and current data, suggest 3-5 rewards he can add to his Reward Shop (things he can "buy" with earned XP as self-treats).

Make them specific to his interests, affordable in Indian context, and motivating. Consider his wishlist items, hobbies, and spending patterns.

Return ONLY a valid JSON array with NO extra text, no markdown code fences. Each object must have:
- "title": reward name
- "emoji": single emoji  
- "xpCost": number (between 50-500, based on how special the reward is)
- "reason": one-line reason why this reward suits him`;

    const result = await chatWithGemini(prompt);

    let suggestions;
    try {
      let text = result.text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      suggestions = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return;
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) return;

    const formatted = suggestions
      .map(s => `${s.emoji} **${s.title}** (${s.xpCost} XP) — ${s.reason}`)
      .join('\n');

    await addNotification(
      NOTIF_TYPES.REWARD_SUGGESTION,
      `🎁 **Reward Suggestions for You!**\n\nBased on your interests and wishlist, here are some rewards you might enjoy adding to your shop:\n\n${formatted}\n\nHead to the Reward Shop to add any of these! You can customize the XP cost.`,
      { suggestions }
    );

    localStorage.setItem('lifer_last_reward_suggestion', new Date().toISOString());
  } catch (err) {
    console.error('Failed to generate reward suggestions:', err);
  }
}

// ── Weekly Challenge Notification ─────────────────────────────────────
export async function notifyWeeklyChallenges() {
  const weekKey = 'lifer_last_challenge_notif';
  const lastNotif = localStorage.getItem(weekKey);

  // Get current week start
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0];

  // Only notify once per week
  if (lastNotif === weekStart) return;

  const challenges = await db.weeklyChallenges.where('weekStart').equals(weekStart).toArray();
  if (challenges.length === 0) return;

  const challengeList = challenges
    .map(c => `• **${c.title}** (${c.progress || 0}/${c.target}${c.isCompleted ? ' ✅' : ''})`)
    .join('\n');

  await addNotification(
    NOTIF_TYPES.WEEKLY_CHALLENGES,
    `⚔️ **New Weekly Challenges!**\n\nYour challenges for this week:\n\n${challengeList}\n\nComplete them all for bonus XP! 🔥`,
    { weekStart, challengeIds: challenges.map(c => c.id) }
  );

  localStorage.setItem(weekKey, weekStart);
}

// ── Habit & Task Suggestions ──────────────────────────────────────────
export async function generateBehaviorSuggestions() {
  if (!hasApiKey() || isBudgetExceeded()) return;

  // Check cooldown (every 3 days)
  const lastRun = localStorage.getItem('lifer_last_behavior_suggestion');
  if (lastRun) {
    const daysSince = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) return;
  }

  // Need some data to analyze
  const taskCount = await db.dailyTasks.count();
  const habitCount = await db.habits.count();
  if (taskCount < 3 && habitCount < 2) return; // Not enough data

  try {
    await buildLifeContext();

    const prompt = `Analyze Gautam's behavioral patterns from his life data and suggest:
1. 1-2 new habits that would complement his existing ones and help with his goals
2. 2-3 tasks he should consider adding based on his goals and current progress

Be very specific — reference his actual goals, projects, and patterns. Keep suggestions actionable and practical for an Indian professional.

Return ONLY a valid JSON object with NO extra text, no markdown code fences:
{
  "habits": [{"title": "habit name", "reason": "why this habit"}],
  "tasks": [{"title": "task name", "reason": "why this task"}],
  "insight": "one paragraph behavioral insight about patterns you noticed"
}`;

    const result = await chatWithGemini(prompt);

    let suggestions;
    try {
      let text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      suggestions = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return;
    }

    if (!suggestions) return;

    let message = `💡 **Personalized Suggestions**\n\n`;

    if (suggestions.insight) {
      message += `📊 *${suggestions.insight}*\n\n`;
    }

    if (suggestions.habits?.length > 0) {
      message += `**🧘 Suggested Habits:**\n`;
      message += suggestions.habits.map(h => `• **${h.title}** — ${h.reason}`).join('\n');
      message += '\n\n';
    }

    if (suggestions.tasks?.length > 0) {
      message += `**✅ Suggested Tasks:**\n`;
      message += suggestions.tasks.map(t => `• **${t.title}** — ${t.reason}`).join('\n');
    }

    await addNotification(
      NOTIF_TYPES.TASK_SUGGESTION,
      message,
      { suggestions }
    );

    localStorage.setItem('lifer_last_behavior_suggestion', new Date().toISOString());
  } catch (err) {
    console.error('Failed to generate behavior suggestions:', err);
  }
}

// ── Master Check — Run All Proactive Checks ──────────────────────────
// Call this on app load / context refresh
export async function runProactiveChecks() {
  try {
    // 1. Notify about weekly challenges
    await notifyWeeklyChallenges();

    // 2. Check if AI badges need to be generated
    await checkAndGenerateAIBadges();

    // 3. Check if any AI badges have been unlocked
    await checkAIBadgeUnlocks();

    // 4. Generate reward suggestions periodically
    await generateRewardSuggestions();

    // 5. Generate habit/task suggestions based on behavior
    await generateBehaviorSuggestions();

    // 6. Check static badge unlocks for notifications
    await notifyNewBadgeUnlocks();
  } catch (err) {
    console.error('Proactive checks failed:', err);
  }
}

// ── Notify about newly unlocked static badges ─────────────────────────
async function notifyNewBadgeUnlocks() {
  const allBadges = await db.badges.toArray();
  const notifiedKeys = JSON.parse(localStorage.getItem('lifer_notified_badges') || '[]');
  const newBadges = allBadges.filter(b => !notifiedKeys.includes(b.badgeKey));

  for (const badge of newBadges) {
    const def = BADGE_DEFS.find(d => d.key === badge.badgeKey);
    if (def) {
      await addNotification(
        NOTIF_TYPES.BADGE_UNLOCKED,
        `🎉 **Trophy Unlocked!** ${def.emoji} **${def.name}**\n\n${def.desc}\n\nKeep going, Gautam! 🌟`,
        { badgeKey: badge.badgeKey }
      );
    }
  }

  const allKeys = allBadges.map(b => b.badgeKey);
  localStorage.setItem('lifer_notified_badges', JSON.stringify(allKeys));
}
