import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useCallback } from 'react';
import db from '../db/db';
import { awardXP, incrementChallengeProgress } from '../services/gamification';

export function useHabits() {
  const habits = useLiveQuery(() => db.habits.orderBy('order').toArray(), []) || [];

  const addHabit = useCallback(async (title) => {
    const maxOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order || 0)) : 0;
    await db.habits.add({
      title,
      isChecked: false,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    });
  }, [habits]);

  const toggleHabit = useCallback(async (id, currentState) => {
    await db.habits.update(id, { isChecked: !currentState });
    if (!currentState) {
      // Completing a habit → award XP
      await awardXP('habit_complete');
      await incrementChallengeProgress('habit_complete');
    }
  }, []);

  const deleteHabit = useCallback(async (id) => {
    await db.habits.delete(id);
  }, []);

  const resetAll = useCallback(async () => {
    const ids = habits.map(h => h.id);
    await Promise.all(ids.map(id => db.habits.update(id, { isChecked: false })));
  }, [habits]);

  return { habits, addHabit, toggleHabit, deleteHabit, resetAll };
}
