import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import {
  chatWithGemini,
  buildLifeContext,
  getCachedContext,
  getBudgetConfig,
  saveBudgetConfig,
  getApiKey,
  setApiKey,
  hasApiKey,
  QUICK_PROMPTS,
  flushAllData,
} from '../services/gemini';
import {
  runProactiveChecks,
  markAllNotificationsRead,
} from '../services/aiProactive';

// ── useAI — Main AI Hook ─────────────────────────────────────────────
export function useAI() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isContextRefreshing, setIsContextRefreshing] = useState(false);
  const [contextAge, setContextAge] = useState(null);
  const hasRunProactive = useRef(false);

  // Load context age on mount
  useEffect(() => {
    const cached = getCachedContext();
    if (cached?.builtAt) {
      setContextAge(cached.builtAt);
    }
  }, []);

  // Run proactive checks once on mount (and after context refresh)
  useEffect(() => {
    if (!hasRunProactive.current && hasApiKey()) {
      hasRunProactive.current = true;
      // Delay to not block initial render
      setTimeout(() => {
        runProactiveChecks().catch(console.error);
      }, 3000);
    }
  }, []);

  // Send a message to the AI
  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim()) return;
    if (!hasApiKey()) {
      setError('Please configure your Gemini API key in AI Settings.');
      return;
    }

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMsg = { role: 'user', text: userText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Build conversation history from existing messages
      const history = messages.map(m => ({
        role: m.role,
        text: m.text,
      }));

      const result = await chatWithGemini(userText, history);

      const aiMsg = {
        role: 'model',
        text: result.text,
        timestamp: Date.now(),
        tokensUsed: result.tokensUsed,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message);
      // Remove the user message if it failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  // Refresh the AI context from current data + re-run proactive checks
  const refreshContext = useCallback(async () => {
    setIsContextRefreshing(true);
    try {
      await buildLifeContext();
      const cached = getCachedContext();
      setContextAge(cached?.builtAt || new Date().toISOString());

      // Re-run proactive checks with fresh context
      runProactiveChecks().catch(console.error);

      return true;
    } catch (err) {
      setError('Failed to refresh context: ' + err.message);
      return false;
    } finally {
      setIsContextRefreshing(false);
    }
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Inject a notification message into the chat
  const injectNotification = useCallback((text, metadata = {}) => {
    const aiMsg = {
      role: 'model',
      text,
      timestamp: Date.now(),
      isNotification: true,
      quizId: metadata?.quizId || null,
      type: metadata?.type || null,
    };
    setMessages(prev => [...prev, aiMsg]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    isContextRefreshing,
    contextAge,
    sendMessage,
    refreshContext,
    clearConversation,
    injectNotification,
    quickPrompts: QUICK_PROMPTS,
  };
}

// ── useAINotifications — Notification Badge & Feed ────────────────────
export function useAINotifications() {
  const notifications = useLiveQuery(
    () => db.aiNotifications.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const unreadNotifications = useMemo(
    () => notifications.filter(n => !n.isRead),
    [notifications]
  );
  const unreadCount = unreadNotifications.length;

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
  }, []);

  return {
    notifications,
    unreadCount,
    unreadNotifications,
    markAllRead,
  };
}

// ── useAIBadges — AI-generated dynamic badges ─────────────────────────
export function useAIBadges() {
  const aiBadges = useLiveQuery(
    () => db.aiBadges.orderBy('createdAt').toArray(),
    []
  ) || [];

  const unlockedCount = aiBadges.filter(b => b.isUnlocked).length;
  const totalCount = aiBadges.length;

  return { aiBadges, unlockedCount, totalCount };
}

// ── useAISettings — Settings & Budget Hook ────────────────────────────
export function useAISettings() {
  const [apiKey, setKey] = useState(getApiKey());
  const [budget, setBudget] = useState(getBudgetConfig());
  const [showSettings, setShowSettings] = useState(false);

  const updateApiKey = useCallback((key) => {
    setApiKey(key);
    setKey(key);
  }, []);

  const updateBudgetLimit = useCallback((newLimit) => {
    const config = getBudgetConfig();
    config.monthlyLimit = Number(newLimit);
    saveBudgetConfig(config);
    setBudget(config);
  }, []);

  const resetBudgetUsage = useCallback(() => {
    const config = getBudgetConfig();
    config.tokensUsed = 0;
    config.callsThisMonth = 0;
    config.estimatedCostINR = 0;
    config.currentMonth = new Date().toISOString().slice(0, 7);
    saveBudgetConfig(config);
    setBudget(config);
  }, []);

  const refreshBudget = useCallback(() => {
    setBudget(getBudgetConfig());
  }, []);

  return {
    apiKey,
    budget,
    showSettings,
    setShowSettings,
    updateApiKey,
    updateBudgetLimit,
    resetBudgetUsage,
    refreshBudget,
    hasKey: !!apiKey,
  };
}

// ── useDataFlush — Flush all data ─────────────────────────────────────
export function useDataFlush() {
  const [isFlushing, setIsFlushing] = useState(false);

  const flush = useCallback(async () => {
    setIsFlushing(true);
    try {
      await flushAllData();
      return true;
    } catch (err) {
      console.error('Failed to flush data:', err);
      return false;
    } finally {
      setIsFlushing(false);
    }
  }, []);

  return { flush, isFlushing };
}
