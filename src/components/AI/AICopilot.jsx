import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Settings, Trash2, RefreshCw, AlertCircle, Bell, HelpCircle } from 'lucide-react';
import { useAI, useAISettings, useAINotifications } from '../../hooks/useAI';
import { useNewsQuiz } from '../../hooks/useNewsQuiz';
import NewsQuizCard from './NewsQuizCard';
import AISettings from './AISettings';
import ErrorBoundary from '../ErrorBoundary';
import './AICopilot.css';

// Simple markdown-ish renderer for AI responses
function renderMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^### (.*$)/gm, '<strong style="font-size:14px;display:block;margin:8px 0 4px">$1</strong>')
    .replace(/^## (.*$)/gm, '<strong style="font-size:15px;display:block;margin:10px 0 4px">$1</strong>')
    .replace(/^- (.*$)/gm, '• $1')
    .replace(/^\d+\. (.*$)/gm, (_, text, offset, str) => `${str.substring(0, offset).split('\n').length}. ${text}`)
    .replace(/\n/g, '<br/>');
}

function formatContextAge(isoString) {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    isLoading,
    error,
    isContextRefreshing,
    contextAge,
    sendMessage,
    refreshContext,
    clearConversation,
    injectNotification,
    quickPrompts,
  } = useAI();

  const { budget, hasKey, showSettings, setShowSettings, refreshBudget } = useAISettings();
  const { unreadCount, unreadNotifications, markAllRead } = useAINotifications();
  const { unansweredQuizzes, unansweredCount } = useNewsQuiz();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const injectedIdsRef = useRef(new Set());

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && hasKey) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasKey]);

  // Refresh budget display after each message
  useEffect(() => {
    refreshBudget();
  }, [messages, refreshBudget]);

  // Inject unread notifications into chat when panel opens
  useEffect(() => {
    if (!isOpen || unreadNotifications.length === 0) return;
    
    try {
      let hasNew = false;
      for (const notif of unreadNotifications) {
        if (!injectedIdsRef.current.has(notif.id)) {
          injectedIdsRef.current.add(notif.id);
          injectNotification(
            String(notif.message || ''),
            { ...(notif.metadata || {}), type: notif.type }
          );
          hasNew = true;
        }
      }
      if (hasNew) {
        markAllRead().catch(console.error);
      }
    } catch (err) {
      console.error('Error injecting notifications:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, unreadNotifications.length]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt);
  };

  const togglePanel = () => setIsOpen(prev => !prev);

  // Budget percentage
  const budgetUsed = budget.estimatedCostINR || 0;
  const budgetLimit = budget.monthlyLimit || 500;
  const budgetPct = Math.min((budgetUsed / budgetLimit) * 100, 100);
  const budgetClass = budgetPct > 80 ? 'danger' : budgetPct > 50 ? 'warning' : '';

  // Context staleness (stale if > 30 mins)
  const isContextStale = !contextAge || (Date.now() - new Date(contextAge).getTime() > 30 * 60 * 1000);

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`ai-fab ${isOpen ? 'open' : ''}`}
        onClick={togglePanel}
        id="ai-fab"
        data-tooltip={isOpen ? 'Close AI' : 'Ask Lifer AI'}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="ai-fab-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* AI Panel */}
      {isOpen && (
        <div className="ai-panel" id="ai-panel">
          {/* Header */}
          <div className="ai-panel-header">
            <div className="ai-panel-title-group">
              <div className="ai-panel-icon">✨</div>
              <div>
                <div className="ai-panel-title">Lifer AI</div>
                <div className="ai-panel-subtitle">Your life copilot</div>
              </div>
            </div>
            <div className="ai-panel-actions">
              <button
                onClick={() => clearConversation()}
                data-tooltip="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                data-tooltip="Settings"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>

          {/* Context Banner */}
          {hasKey && (
            <div className={`ai-context-banner ${isContextStale ? 'stale' : ''}`}>
              <div className="ai-context-age">
                <span className="ai-context-dot" />
                Context: {formatContextAge(contextAge)}
              </div>
              <button
                className={`ai-refresh-btn ${isContextRefreshing ? 'refreshing' : ''}`}
                onClick={refreshContext}
                disabled={isContextRefreshing}
              >
                <RefreshCw size={11} />
                {isContextRefreshing ? 'Syncing...' : 'Refresh'}
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="ai-messages">
            {!hasKey ? (
              <div className="ai-nokey">
                <div className="ai-nokey-icon">🔑</div>
                <div className="ai-welcome-title">API Key Required</div>
                <div className="ai-nokey-text">
                  Configure your Gemini API key to start using Lifer AI.
                </div>
                <button
                  className="btn btn-primary ai-nokey-btn"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings size={14} /> Open Settings
                </button>
              </div>
            ) : messages.length === 0 && !isLoading ? (
              <>
                <div className="ai-welcome">
                  <div className="ai-welcome-icon">🧠</div>
                  <div className="ai-welcome-title">Hey Gautam!</div>
                  <div className="ai-welcome-text">
                    I know everything about your tasks, goals, habits, finances, and progress.
                    Ask me anything, answer active news quizzes to earn XP, or tap a quick insight below.
                  </div>
                </div>

                {unansweredCount > 0 && (
                  <div className="ai-pending-quizzes-banner">
                    <div className="ai-pending-quizzes-title">
                      <span>📰</span>
                      <span><strong>{unansweredCount}</strong> News Quiz{unansweredCount > 1 ? 'zes' : ''} Ready (up to +{unansweredCount * 50} XP)</span>
                    </div>
                    <div className="ai-pending-quizzes-list">
                      {unansweredQuizzes.slice(0, 3).map(q => (
                        <button
                          key={q.id}
                          className="ai-pending-quiz-btn"
                          onClick={() => injectNotification(
                            `📰 **News Quiz: ${q.articleTitle}**\n\n5 deep questions — earn up to **+50 XP**!`,
                            { quizId: q.id, type: 'news_quiz' }
                          )}
                        >
                          <span className="quiz-btn-title">{q.articleTitle}</span>
                          <span className="quiz-btn-bounty">+50 XP</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ai-quick-prompts">
                  {quickPrompts.slice(0, 6).map(qp => (
                    <button
                      key={qp.id}
                      className="ai-quick-prompt"
                      onClick={() => handleQuickPrompt(qp.prompt)}
                    >
                      <span>{qp.emoji}</span>
                      <span>{qp.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {unansweredCount > 0 && (
                  <div className="ai-pending-quizzes-bar">
                    <span>📰 <strong>{unansweredCount}</strong> quiz{unansweredCount > 1 ? 'zes' : ''} ready</span>
                    <button
                      className="ai-take-quiz-pill"
                      onClick={() => {
                        const nextQuiz = unansweredQuizzes[0];
                        if (nextQuiz) {
                          injectNotification(
                            `📰 **News Quiz: ${nextQuiz.articleTitle}**\n\n5 deep questions — earn up to **+50 XP**!`,
                            { quizId: nextQuiz.id, type: 'news_quiz' }
                          );
                        }
                      }}
                    >
                      Take Quiz (+50 XP)
                    </button>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`ai-msg ${msg.role} ${msg.isNotification ? 'notification' : ''} ${msg.quizId ? 'quiz-msg' : ''}`}>
                    <div className="ai-msg-avatar">
                      {msg.quizId ? '📰' : msg.isNotification ? '🔔' : msg.role === 'model' ? '✨' : '👤'}
                    </div>
                    <div className="ai-msg-content-wrapper">
                      {msg.quizId ? (
                        <ErrorBoundary>
                          <NewsQuizCard
                            quizId={msg.quizId}
                            onAnswered={(result) => {
                              if (result && !result.alreadyAnswered) {
                                if (result.isCorrect) {
                                  refreshBudget();
                                }
                              }
                            }}
                          />
                        </ErrorBoundary>
                      ) : (
                        <div
                          className={`ai-msg-bubble ${msg.isNotification ? 'notif-bubble' : ''}`}
                          dangerouslySetInnerHTML={{
                            __html: msg.role === 'model'
                              ? renderMarkdown(msg.text)
                              : (msg.text || '').replace(/\n/g, '<br/>'),
                          }}
                        />
                      )}
                      {msg.tokensUsed && (
                        <div className="ai-msg-tokens">{msg.tokensUsed} tokens</div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="ai-msg model">
                    <div className="ai-msg-avatar">✨</div>
                    <div className="ai-typing">
                      <div className="ai-typing-dots">
                        <span className="ai-typing-dot" />
                        <span className="ai-typing-dot" />
                        <span className="ai-typing-dot" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />

                {/* Quick prompts after conversation started */}
                {messages.length > 0 && !isLoading && (
                  <div className="ai-quick-prompts" style={{ paddingTop: '8px' }}>
                    {quickPrompts.slice(0, 4).map(qp => (
                      <button
                        key={qp.id}
                        className="ai-quick-prompt"
                        onClick={() => handleQuickPrompt(qp.prompt)}
                      >
                        <span>{qp.emoji}</span>
                        <span>{qp.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="ai-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Input */}
          {hasKey && (
            <div className="ai-input-area">
              <textarea
                ref={inputRef}
                className="ai-input"
                placeholder="Ask about your life data..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                id="ai-input"
              />
              <button
                className="ai-send-btn"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                id="ai-send"
              >
                <Send size={18} />
              </button>
            </div>
          )}

          {/* Budget Bar */}
          {hasKey && (
            <div className="ai-budget-bar">
              <span>₹{budgetUsed.toFixed(2)} / ₹{budgetLimit}</span>
              <div className="ai-budget-meter">
                <div className="ai-budget-track">
                  <div
                    className={`ai-budget-fill ${budgetClass}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <span>{budget.callsThisMonth || 0} calls</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <AISettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
