import { useState } from 'react';
import { ShoppingBag, Plus, X, Link as LinkIcon, Check, PiggyBank, Sparkles, TrendingUp } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/db';
import '../Plans/Plans.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function Wishlist() {
  const { items, addItem, updateItem, deleteItem } = useWishlist();
  const [showModal, setShowModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(null); // item id
  const [fundAmount, setFundAmount] = useState('');
  const [fundSource, setFundSource] = useState('manual');
  
  // Form state
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [link, setLink] = useState('');

  // XP data for gamification funding
  const totalXP = useLiveQuery(async () => {
    const ledger = await db.xpLedger.toArray();
    return ledger.reduce((s, e) => s + e.amount, 0);
  }, []) || 0;
  const spentXP = useLiveQuery(async () => {
    const redemptions = await db.redemptions.toArray();
    const rewardIds = redemptions.map(r => r.rewardId);
    const rewards = await db.rewards.bulkGet(rewardIds);
    return rewards.reduce((s, r) => s + (r?.xpCost || 0), 0);
  }, []) || 0;
  const availableXP = totalXP - spentXP;

  const pendingItems = items.filter(i => i.status !== 'purchased');
  const purchasedItems = items.filter(i => i.status === 'purchased');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addItem({
      title: title.trim(),
      budget: budget ? Number(budget) : null,
      saved: 0,
      estimatedDate: estimatedDate || null,
      link: link.trim() || null
    });
    setShowModal(false);
    setTitle('');
    setBudget('');
    setEstimatedDate('');
    setLink('');
  };

  const handleFund = async () => {
    if (!fundAmount || Number(fundAmount) <= 0) return;
    const item = items.find(i => i.id === showFundModal);
    if (!item) return;

    const addAmt = Number(fundAmount);

    if (fundSource === 'xp' && availableXP < addAmt) {
      alert('Not enough XP! You need ' + addAmt + ' XP but only have ' + availableXP);
      return;
    }

    // If funding from XP, create a redemption-like entry
    if (fundSource === 'xp') {
      // Deduct XP by creating a negative ledger entry
      await db.xpLedger.add({
        action: 'wishlist_fund',
        amount: -addAmt,
        createdAt: new Date().toISOString(),
      });
    }

    await updateItem(item.id, { saved: (item.saved || 0) + addAmt });
    setShowFundModal(null);
    setFundAmount('');
    setFundSource('manual');
  };

  const getProgressPct = (item) => {
    if (!item.budget || item.budget === 0) return 100;
    return Math.min(Math.round(((item.saved || 0) / item.budget) * 100), 100);
  };

  return (
    <div className="plans-section glass-card" id="wishlist" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="plans-header">
        <div className="plans-title">
          <ShoppingBag size={22} className="icon" />
          Wishlist
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {pendingItems.length === 0 && purchasedItems.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
            <span style={{ fontSize: '2rem' }}>🛒</span>
            <span className="text-sm text-muted">No wishlist items</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {pendingItems.map(item => {
              const pct = getProgressPct(item);
              const remaining = item.budget ? Math.max(item.budget - (item.saved || 0), 0) : 0;
              return (
                <div key={item.id} className="glass-card-static" style={{ padding: 'var(--space-md)', position: 'relative' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)', paddingRight: 30 }}>{item.title}</div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                    {item.budget != null && <span className="badge badge-cyan">₹{item.budget.toLocaleString('en-IN')}</span>}
                    {item.estimatedDate && <span>📅 {new Date(item.estimatedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>}
                  </div>

                  {/* Savings Progress */}
                  {item.budget != null && (
                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                        <span style={{ color: 'var(--accent-success)' }}>
                          <PiggyBank size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Saved: {formatCurrency(item.saved || 0)}
                        </span>
                        <span style={{ color: remaining > 0 ? 'var(--text-muted)' : 'var(--accent-success)' }}>
                          {remaining > 0 ? `${formatCurrency(remaining)} to go` : '🎉 Ready!'}
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: pct >= 100 ? 'var(--accent-success)' : 'var(--gradient-accent)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    {item.link && (
                      <a href={item.link.startsWith('http') ? item.link : `https://${item.link}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}>
                        <LinkIcon size={12} style={{ marginRight: 4 }} /> Link
                      </a>
                    )}
                    <button className="btn btn-secondary btn-sm" style={{ padding: '2px 6px' }} onClick={() => { setShowFundModal(item.id); setFundAmount(''); setFundSource('manual'); }}>
                      <TrendingUp size={12} style={{ marginRight: 4 }} /> Fund
                    </button>
                    {pct >= 100 && (
                      <button className="btn btn-success btn-sm" style={{ padding: '2px 6px' }} onClick={() => updateItem(item.id, { status: 'purchased' })}>
                        <Check size={12} style={{ marginRight: 4 }} /> Got it
                      </button>
                    )}
                  </div>

                  <button onClick={() => deleteItem(item.id)} style={{ position: 'absolute', top: 'var(--space-sm)', right: 'var(--space-sm)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              );
            })}

            {purchasedItems.length > 0 && (
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase' }}>Purchased ✅</div>
                {purchasedItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--border-subtle)', opacity: 0.6 }}>
                    <span style={{ fontSize: 'var(--text-sm)', textDecoration: 'line-through' }}>{item.title}</span>
                    <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fund Modal */}
      {showFundModal && (
        <div className="modal-backdrop" onClick={() => setShowFundModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: 'var(--text-lg)' }}>
                <PiggyBank size={20} style={{ marginRight: 8, color: 'var(--accent-success)' }} />
                Add Funds
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowFundModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Source</label>
                <div className="tab-bar">
                  <button type="button" className={`tab-item ${fundSource === 'manual' ? 'active' : ''}`} onClick={() => setFundSource('manual')}>
                    💰 Manual
                  </button>
                  <button type="button" className={`tab-item ${fundSource === 'xp' ? 'active' : ''}`} onClick={() => setFundSource('xp')}>
                    <Sparkles size={14} style={{ marginRight: 4 }} /> From XP
                  </button>
                </div>
              </div>

              {fundSource === 'xp' && (
                <div style={{ padding: 'var(--space-sm)', background: 'rgba(124,58,237,0.1)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--accent-primary)' }}>
                  ⭐ Available XP: <strong>{availableXP}</strong> — Convert XP to ₹ at 1:1 ratio
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Amount {fundSource === 'xp' ? '(XP → ₹)' : '(₹)'}</label>
                <input className="input" type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="0" min="1" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowFundModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFund}>
                <TrendingUp size={16} /> Add Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🛒 New Wishlist Item</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input className="input" type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus required placeholder="e.g. Mechanical Keyboard" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Budget (₹)</label>
                    <input className="input" type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0" min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Date</label>
                    <input className="input" type="month" value={estimatedDate} onChange={e => setEstimatedDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Product Link</label>
                  <input className="input" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={16} /> Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
