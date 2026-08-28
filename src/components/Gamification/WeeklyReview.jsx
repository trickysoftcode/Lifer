import { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWeeklyReview } from '../../hooks/useGamification';

function DeltaIndicator({ current, previous }) {
  const diff = current - previous;
  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0);
  const cls = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

  return (
    <div className={`review-card-delta ${cls}`}>
      <Icon size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} />
      {diff > 0 ? '+' : ''}{diff} ({pct >= 0 ? '+' : ''}{pct}% vs last week)
    </div>
  );
}

function FocusScoreRing({ score }) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="review-focus-score">
      <div className="review-focus-ring">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle className="ring-bg" cx="60" cy="60" r={r} />
          <circle className="ring-fill" cx="60" cy="60" r={r}
            stroke={color}
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="review-focus-number" style={{ color }}>{score}</span>
      </div>
      <span className="review-focus-label">Today's Focus Score</span>
    </div>
  );
}

export default function WeeklyReview({ onClose }) {
  const { data, loading, refresh } = useWeeklyReview();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
        <div className="modal-header">
          <h3 className="modal-title">📊 Weekly Review</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {loading || !data ? (
            <div className="empty-state"><p>Loading...</p></div>
          ) : (
            <>
              {/* Focus Score */}
              <FocusScoreRing score={data.focusScore} />

              {/* Streak Info */}
              <div className="review-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-lg)' }}>
                <div className="review-card">
                  <div className="review-card-label">Current Streak</div>
                  <div className="review-card-value" style={{ color: 'var(--accent-danger)' }}>🔥 {data.streak}</div>
                </div>
                <div className="review-card">
                  <div className="review-card-label">Best Streak</div>
                  <div className="review-card-value" style={{ color: 'var(--accent-warning)' }}>{data.bestStreak}</div>
                </div>
                <div className="review-card">
                  <div className="review-card-label">Total XP</div>
                  <div className="review-card-value" style={{ color: 'var(--accent-primary)' }}>{data.totalXP.toLocaleString()}</div>
                </div>
              </div>

              <div className="review-divider">This Week vs Last Week</div>

              {/* Comparison Grid */}
              <div className="review-grid">
                <div className="review-card">
                  <div className="review-card-label">XP Earned</div>
                  <div className="review-card-value">{data.thisWeek.xp}</div>
                  <DeltaIndicator current={data.thisWeek.xp} previous={data.lastWeek.xp} />
                </div>
                <div className="review-card">
                  <div className="review-card-label">Tasks Completed</div>
                  <div className="review-card-value">{data.thisWeek.tasks}</div>
                  <DeltaIndicator current={data.thisWeek.tasks} previous={data.lastWeek.tasks} />
                </div>
                <div className="review-card">
                  <div className="review-card-label">Focus Sessions</div>
                  <div className="review-card-value">{data.thisWeek.pomodoro}</div>
                  <DeltaIndicator current={data.thisWeek.pomodoro} previous={data.lastWeek.pomodoro} />
                </div>
                <div className="review-card">
                  <div className="review-card-label">Transactions</div>
                  <div className="review-card-value">{data.thisWeek.transactions}</div>
                  <DeltaIndicator current={data.thisWeek.transactions} previous={data.lastWeek.transactions} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
