import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAISettings, useDataFlush } from '../../hooks/useAI';

export default function AISettings({ onClose }) {
  const {
    apiKey,
    budget,
    updateApiKey,
    updateBudgetLimit,
    resetBudgetUsage,
  } = useAISettings();

  const { flush, isFlushing } = useDataFlush();
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);
  const [budgetInput, setBudgetInput] = useState(budget.monthlyLimit || 500);
  const [showFlushConfirm, setShowFlushConfirm] = useState(false);
  const [flushDone, setFlushDone] = useState(false);

  const handleSaveKey = () => {
    updateApiKey(keyInput);
  };

  const handleSaveBudget = () => {
    updateBudgetLimit(budgetInput);
  };

  const handleFlush = async () => {
    const success = await flush();
    if (success) {
      setFlushDone(true);
      setShowFlushConfirm(false);
      // Auto-reload after a beat so all Dexie live queries refresh
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">⚙️ AI Settings</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* API Key Section */}
          <div className="ai-settings-section">
            <div className="ai-settings-section-title">🔑 Gemini API Key</div>
            <div className="ai-key-input-wrap">
              <input
                type={showKey ? 'text' : 'password'}
                className="input"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Enter your Gemini API key..."
                id="ai-api-key-input"
              />
              <button
                className="ai-key-toggle"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={handleSaveKey}>
                Save Key
              </button>
              {apiKey && (
                <span className="badge badge-green" style={{ alignSelf: 'center' }}>
                  ✓ Key configured
                </span>
              )}
            </div>
          </div>

          {/* Budget Section */}
          <div className="ai-settings-section">
            <div className="ai-settings-section-title">💰 Monthly Budget</div>

            <div className="ai-budget-stat">
              <span className="ai-budget-stat-label">Monthly limit</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>₹</span>
                <input
                  type="number"
                  className="input"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  style={{ width: '100px', textAlign: 'right' }}
                  id="ai-budget-input"
                />
                <button className="btn btn-secondary btn-sm" onClick={handleSaveBudget}>
                  Set
                </button>
              </div>
            </div>

            <div className="ai-budget-stat">
              <span className="ai-budget-stat-label">Current month</span>
              <span className="ai-budget-stat-value">{budget.currentMonth || '—'}</span>
            </div>

            <div className="ai-budget-stat">
              <span className="ai-budget-stat-label">Estimated cost</span>
              <span className="ai-budget-stat-value">₹{(budget.estimatedCostINR || 0).toFixed(4)}</span>
            </div>

            <div className="ai-budget-stat">
              <span className="ai-budget-stat-label">API calls</span>
              <span className="ai-budget-stat-value">{budget.callsThisMonth || 0}</span>
            </div>

            <div className="ai-budget-stat">
              <span className="ai-budget-stat-label">Tokens used</span>
              <span className="ai-budget-stat-value">{(budget.tokensUsed || 0).toLocaleString()}</span>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={resetBudgetUsage}
              style={{ marginTop: '8px' }}
            >
              Reset usage counter
            </button>
          </div>

          {/* Flush Data Section */}
          <div className="ai-flush-section">
            <div className="ai-flush-title">
              <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Danger Zone
            </div>
            <div className="ai-flush-desc">
              Flush all data to start fresh. This will permanently delete all tasks, habits, projects,
              transactions, goals, media, XP, streaks, badges, and everything else. This cannot be undone.
            </div>

            {flushDone ? (
              <div className="badge badge-green" style={{ padding: '8px 16px', fontSize: '13px' }}>
                ✅ All data flushed! Reloading...
              </div>
            ) : showFlushConfirm ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--accent-danger)' }}>
                  Are you sure? This is irreversible!
                </span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleFlush}
                  disabled={isFlushing}
                >
                  {isFlushing ? 'Flushing...' : 'Yes, Delete Everything'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowFlushConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn btn-danger"
                onClick={() => setShowFlushConfirm(true)}
                id="flush-data-btn"
              >
                🗑️ Flush All Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
