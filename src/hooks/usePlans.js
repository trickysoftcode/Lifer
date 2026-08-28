import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import db from '../db/db';

export function usePlans() {
  const plans = useLiveQuery(
    () => db.plans.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const goals = plans.filter(p => p.type === 'goal');
  const events = plans.filter(p => p.type === 'event');
  const travels = plans.filter(p => p.type === 'travel');

  // Goal sub-categories
  const shortGoals = goals.filter(g => g.category === 'short');
  const wishlist = goals.filter(g => g.category === 'wishlist');
  const longTermGoals = goals.filter(g => g.category === 'long-term');

  const addPlan = useCallback(async ({ title, type, category, description, targetDate, status, priority, budget, destination, venue }) => {
    const id = await db.plans.add({
      title,
      type,
      category: category || null,
      description: description || '',
      targetDate: targetDate || null,
      status: status || 'planned',
      priority: priority || 'medium',
      budget: budget || null,
      destination: destination || null,
      venue: venue || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return id;
  }, []);

  const updatePlan = useCallback(async (id, data) => {
    await db.plans.update(id, { ...data, updatedAt: new Date().toISOString() });
  }, []);

  const deletePlan = useCallback(async (id) => {
    await db.transaction('rw', db.plans, db.planItems, async () => {
      await db.planItems.where('planId').equals(id).delete();
      await db.plans.delete(id);
    });
  }, []);

  return { plans, goals, events, travels, shortGoals, wishlist, longTermGoals, addPlan, updatePlan, deletePlan };
}

export function usePlanItems(planId) {
  const numericId = Number(planId);
  const items = useLiveQuery(
    () => planId ? db.planItems.where('planId').equals(numericId).sortBy('order') : [],
    [numericId]
  ) || [];

  const itinerary = items.filter(i => i.itemType === 'itinerary');
  const budgetItems = items.filter(i => i.itemType === 'budget');
  const packingItems = items.filter(i => i.itemType === 'packing');
  const eventTasks = items.filter(i => i.itemType === 'event-task');
  const goalSubtasks = items.filter(i => i.itemType === 'subtask');
  const notes = items.filter(i => i.itemType === 'note');

  const addItem = useCallback(async ({ itemType, title, content, amount, date }) => {
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order || 0)) : 0;
    return await db.planItems.add({
      planId: numericId,
      itemType,
      title: title || '',
      content: content || '',
      amount: amount || null,
      date: date || null,
      isCompleted: false,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    });
  }, [numericId, items]);

  const updateItem = useCallback(async (id, data) => {
    await db.planItems.update(id, data);
  }, []);

  const toggleItem = useCallback(async (id, current) => {
    await db.planItems.update(id, { isCompleted: !current });
  }, []);

  const deleteItem = useCallback(async (id) => {
    await db.planItems.delete(id);
  }, []);

  const totalBudget = budgetItems.reduce((sum, i) => sum + (i.amount || 0), 0);

  return {
    items, itinerary, budgetItems, packingItems, eventTasks, goalSubtasks, notes,
    totalBudget, addItem, updateItem, toggleItem, deleteItem,
  };
}
