import { useState } from 'react';
import { X, Plus, ShoppingBag } from 'lucide-react';
import { useRewards } from '../../hooks/useGamification';

export default function RewardShop({ onClose }) {
  const { rewards, availableXP, recentRedemptions, addReward, redeemReward, deleteReward } = useRewards();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [xpCost, setXpCost] = useState('');
  const [redeemingId, setRedeemingId] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim() || !xpCost) return;
    addReward({ title: title.trim(), emoji, xpCost: Number(xpCost) });
    setTitle('');
    setEmoji('🎁');
    setXpCost('');
    setShowAdd(false);
  };

  const handleRedeem = async (id) => {
    setRedeemingId(id);
    const ok = await redeemReward(id);
    setTimeout(() => setRedeemingId(null), 500);
  };

  const EMOJI_PICKS = ['🎁', '☕', '🍕', '🎮', '🍿', '🛒', '🎵', '📦', '🍰', '🏖️', '🎬', '💆'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <div className="modal-header">
          <h3 className="modal-title">🏪 Reward Shop</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {/* Balance */}
          <div className="reward-balance">
            <span className="reward-balance-label">Available XP</span>
            <span className="reward-balance-value">{availableXP.toLocaleString()}</span>
          </div>

          {/* Reward Grid */}
          {rewards.length > 0 && (
            <div className="reward-grid">
              {rewards.map(r => (
                <div className="reward-card" key={r.id}>
                  <div className="reward-emoji">{r.emoji}</div>
                  <div className="reward-title">{r.title}</div>
                  <div className="reward-cost">{r.xpCost} XP</div>
                  <button
                    className="redeem-btn"
                    disabled={availableXP < r.xpCost || redeemingId === r.id}
                    onClick={() => handleRedeem(r.id)}
                  >
                    {redeemingId === r.id ? '✓ Redeemed!' : 'Redeem'}
                  </button>
                  <button
                    style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}
                    onClick={() => deleteReward(r.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Reward Form */}
          {showAdd ? (
            <form onSubmit={handleAdd} style={{ marginBottom: 'var(--space-lg)' }}>
              <div className="reward-add-form">
                <div className="form-group" style={{ minWidth: 60, flex: 'none' }}>
                  <label className="form-label">Icon</label>
                  <select className="input" value={emoji} onChange={e => setEmoji(e.target.value)}>
                    {EMOJI_PICKS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reward</label>
                  <input className="input" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Order pizza" autoFocus />
                </div>
                <div className="form-group" style={{ minWidth: 80, flex: 'none' }}>
                  <label className="form-label">XP Cost</label>
                  <input className="input" type="number" value={xpCost} onChange={e => setXpCost(e.target.value)}
                    placeholder="50" min="1" />
                </div>
                <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-end' }}>Add</button>
              </div>
            </form>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(true)} style={{ marginBottom: 'var(--space-lg)' }}>
              <Plus size={14} /> Add Reward
            </button>
          )}

          {/* Recent Redemptions */}
          {recentRedemptions.length > 0 && (
            <>
              <div className="form-label" style={{ marginBottom: 'var(--space-sm)' }}>Recent Redemptions</div>
              {recentRedemptions.map(r => (
                <div className="reward-history-item" key={r.id}>
                  <span>{r.reward?.emoji || '🎁'}</span>
                  <span>{r.reward?.title || 'Reward'}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {new Date(r.redeemedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="cost">-{r.reward?.xpCost || 0} XP</span>
                </div>
              ))}
            </>
          )}

          {rewards.length === 0 && !showAdd && (
            <div className="empty-state">
              <span style={{ fontSize: '2rem' }}>🏪</span>
              <p className="text-sm text-muted">Define your own rewards! Earn XP by completing tasks, then treat yourself.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                <Plus size={14} /> Create First Reward
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
