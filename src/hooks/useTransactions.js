import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import db from '../db/db';
import { awardXP, incrementChallengeProgress } from '../services/gamification';

export const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investments', label: 'Investments' },
  { value: 'side-business', label: 'Side Business' },
  { value: 'other-income', label: 'Other Income' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent / Mortgage EMI', group: 'Housing' },
  { value: 'maintenance', label: 'Maintenance', group: 'Housing' },
  { value: 'personal-loan', label: 'Personal Loan', group: 'Loans & EMIs' },
  { value: 'car-loan', label: 'Car Loan', group: 'Loans & EMIs' },
  { value: 'education-loan', label: 'Education Loan', group: 'Loans & EMIs' },
  { value: 'credit-card-emi', label: 'Credit Card EMI', group: 'Loans & EMIs' },
  { value: 'food', label: 'Food & Dining', group: 'Living' },
  { value: 'fuel', label: 'Fuel', group: 'Transport' },
  { value: 'public-transport', label: 'Public Transport', group: 'Transport' },
  { value: 'cab', label: 'Cab / Ride Share', group: 'Transport' },
  { value: 'electricity', label: 'Electricity', group: 'Utilities' },
  { value: 'internet-phone', label: 'Internet / Phone', group: 'Utilities' },
  { value: 'water-gas', label: 'Water / Gas', group: 'Utilities' },
  { value: 'streaming', label: 'Streaming', group: 'Subscriptions' },
  { value: 'software', label: 'Software', group: 'Subscriptions' },
  { value: 'memberships', label: 'Memberships', group: 'Subscriptions' },
  { value: 'shopping', label: 'Shopping', group: 'Other' },
  { value: 'health', label: 'Health & Medical', group: 'Other' },
  { value: 'entertainment', label: 'Entertainment', group: 'Other' },
  { value: 'education', label: 'Education', group: 'Other' },
  { value: 'insurance', label: 'Insurance', group: 'Other' },
  { value: 'travel', label: 'Travel', group: 'Other' },
  { value: 'miscellaneous', label: 'Miscellaneous', group: 'Other' },
];

export function useTransactions() {
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray(),
    []
  ) || [];

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const recurringTransactions = useLiveQuery(
    () => db.recurringTransactions.toArray(),
    []
  ) || [];

  const addTransaction = useCallback(async ({ type, category, subcategory, amount, description, date, frequency }) => {
    const txDate = date || new Date().toISOString().split('T')[0];
    await db.transactions.add({
      type,
      category,
      subcategory: subcategory || '',
      amount: Number(amount),
      description: description || '',
      date: txDate,
      createdAt: new Date().toISOString(),
    });
    
    if (frequency && frequency !== 'none') {
      await db.recurringTransactions.add({
        type,
        category,
        amount: Number(amount),
        description: description || '',
        frequency,
        nextDate: txDate, // In a real app, calculate next occurrence
      });
    }

    await awardXP('transaction_add');
    await incrementChallengeProgress('transaction_add');
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    await db.transactions.delete(id);
  }, []);

  const updateTransaction = useCallback(async (id, data) => {
    await db.transactions.update(id, data);
  }, []);

  // Category breakdown for charts
  const expensesByCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    const total = expenseTransactions
      .filter(t => t.category === cat.value)
      .reduce((sum, t) => sum + t.amount, 0);
    if (total > 0) {
      acc.push({ name: cat.label, value: total, category: cat.value });
    }
    return acc;
  }, []);

  const incomeByCategory = INCOME_CATEGORIES.reduce((acc, cat) => {
    const total = incomeTransactions
      .filter(t => t.category === cat.value)
      .reduce((sum, t) => sum + t.amount, 0);
    if (total > 0) {
      acc.push({ name: cat.label, value: total, category: cat.value });
    }
    return acc;
  }, []);

  return {
    transactions,
    incomeTransactions,
    expenseTransactions,
    totalIncome,
    totalExpenses,
    netBalance,
    expensesByCategory,
    incomeByCategory,
    addTransaction,
    deleteTransaction,
    updateTransaction,
  };
}
