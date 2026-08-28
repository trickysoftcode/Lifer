import { X, Sparkles } from 'lucide-react';
import { useBadges } from '../../hooks/useGamification';
import { useAIBadges } from '../../hooks/useAI';

export default function TrophyCase({ onClose }) {
  const { allBadges, unlockedCount, totalCount } = useBadges();
  const { aiBadges, unlockedCount: aiUnlockedCount, totalCount: aiTotalCount } = useAIBadges();

  const combinedUnlocked = unlockedCount + aiUnlockedCount;
  const combinedTotal = totalCount + aiTotalCount;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <h3 className="modal-title">🏆 Trophy Case</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="trophy-stats">
            <div className="trophy-stat">
              <div className="trophy-stat-value">{combinedUnlocked}</div>
              <div className="trophy-stat-label">Unlocked</div>
            </div>
            <div className="trophy-stat">
              <div className="trophy-stat-value">{combinedTotal}</div>
              <div className="trophy-stat-label">Total</div>
            </div>
            <div className="trophy-stat">
              <div className="trophy-stat-value">{combinedTotal > 0 ? Math.round((combinedUnlocked / combinedTotal) * 100) : 0}%</div>
              <div className="trophy-stat-label">Progress</div>
            </div>
          </div>

          {/* Static Badges */}
          <div className="trophy-grid">
            {allBadges.map(badge => (
              <div
                key={badge.key}
                className={`trophy-card ${badge.isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <span className="trophy-emoji">{badge.emoji}</span>
                <span className="trophy-name">{badge.name}</span>
                <span className="trophy-desc">{badge.desc}</span>
                {badge.isUnlocked && badge.unlockedAt && (
                  <span className="trophy-date">
                    {new Date(badge.unlockedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* AI-Generated Badges */}
          {aiBadges.length > 0 && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '24px 0 12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
                <span style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  AI-Generated Achievements ({aiUnlockedCount}/{aiTotalCount})
                </span>
              </div>

              <div className="trophy-grid">
                {aiBadges.map(badge => (
                  <div
                    key={badge.badgeKey}
                    className={`trophy-card ${badge.isUnlocked ? 'unlocked' : 'locked'} ai-badge`}
                  >
                    <span className="trophy-emoji">{badge.emoji}</span>
                    <span className="trophy-name">{badge.name}</span>
                    <span className="trophy-desc">{badge.desc}</span>
                    {badge.isUnlocked && badge.unlockedAt && (
                      <span className="trophy-date">
                        {new Date(badge.unlockedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <span className="trophy-ai-tag">✨ AI</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
