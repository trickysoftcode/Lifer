import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import db from '../db/db';
import { awardXP, incrementChallengeProgress } from '../services/gamification';

export function useDailyTasks() {
  const activeTasks = useLiveQuery(
    () => db.dailyTasks.where('isDeleted').equals(0).toArray(),
    []
  ) || [];

  // Separate active and completed
  const pendingTasks = activeTasks.filter(t => !t.isCompleted);
  const completedTasks = activeTasks.filter(t => t.isCompleted);

  const addTask = useCallback(async (title) => {
    await db.dailyTasks.add({
      title,
      isCompleted: false,
      completedAt: null,
      isDeleted: 0,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const completeTask = useCallback(async (id) => {
    await db.dailyTasks.update(id, {
      isCompleted: true,
      completedAt: new Date().toISOString(),
    });
    // Award XP
    await awardXP('task_complete');
    await incrementChallengeProgress('task_complete');
  }, []);

  const uncompleteTask = useCallback(async (id) => {
    await db.dailyTasks.update(id, {
      isCompleted: false,
      completedAt: null,
    });
  }, []);

  const deleteTask = useCallback(async (id) => {
    await db.dailyTasks.update(id, { isDeleted: 1 });
  }, []);

  const permanentDelete = useCallback(async (id) => {
    await db.dailyTasks.delete(id);
  }, []);

  return { pendingTasks, completedTasks, addTask, completeTask, uncompleteTask, deleteTask, permanentDelete };
}
