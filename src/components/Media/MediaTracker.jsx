import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Plus, X, Star, Trophy } from 'lucide-react';
import { useMedia, MEDIA_TYPES, MEDIA_STATUS } from '../../hooks/useMedia';
import './Media.css';

export default function MediaTracker() {
  const navigate = useNavigate();
  const { getByType, addMedia, updateMedia, deleteMedia, stats } = useMedia();
  const [activeType, setActiveType] = useState('book');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [formStatus, setFormStatus] = useState('');

  const currentType = MEDIA_TYPES.find(t => t.value === activeType);
  const statuses = MEDIA_STATUS[activeType] || [];
  const activeStatuses = ['reading', 'watching', 'listening', 'playing'];
  const queueStatuses = ['to-read', 'to-watch', 'to-listen', 'to-play'];

  // Group items by status
  const activeItems = getByType(activeType).filter(m => activeStatuses.includes(m.status));
  const queueItems = getByType(activeType).filter(m => queueStatuses.includes(m.status));
  const droppedItems = getByType(activeType).filter(m => m.status === 'dropped');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const defaultStatus = statuses[0]?.value || 'to-read';
    addMedia({
      title: title.trim(),
      mediaType: activeType,
      status: formStatus || defaultStatus,
      author: author.trim(),
    });
    setTitle('');
    setAuthor('');
    setFormStatus('');
    setShowForm(false);
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const renderStatusGroup = (label, items, dotClass) => {
    if (items.length === 0) return null;
    return (
      <div className="media-status-group">
        <div className="media-status-header">
          <span className={`media-status-dot ${dotClass}`} />
          {label} ({items.length})
        </div>
        <div className="media-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {items.map(item => (
            <div className="media-card" key={item.id} style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
                <span className="media-card-emoji" style={{ fontSize: '1.5rem' }}>{currentType?.emoji}</span>
                <div className="media-card-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="media-card-title" style={{ fontSize: 'var(--text-sm)', fontWeight: 700, whiteSpace: 'normal', lineHeight: 1.3, marginBottom: 2 }}>
                    {item.title}
                  </div>
                  {item.author && <div className="media-card-author" style={{ fontSize: 'var(--text-xs)', opacity: 0.8 }}>{item.author}</div>}
                  {item.rating && <div className="media-card-rating" style={{ color: 'var(--accent-warning)', fontSize: '10px' }}>{renderStars(item.rating)}</div>}
                </div>
                <button onClick={() => deleteMedia(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                  <X size={14} />
                </button>
              </div>
              <select
                className="media-card-status-select"
                value={item.status}
                onChange={e => updateMedia(item.id, { status: e.target.value })}
                style={{ marginTop: 'var(--space-sm)', width: '100%', fontSize: 'var(--text-xs)', padding: '2px 4px' }}
              >
                {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="media-section glass-card" id="media-tracker">
      <div className="media-header">
        <div className="media-title">
          <Clapperboard size={22} className="icon" />
          Infotainment Tracker
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/media/completed')}>
            <Trophy size={14} /> View Spoils
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="media-stats">
        {MEDIA_TYPES.map(type => (
          <button
            key={type.value}
            className={`media-stat-chip ${activeType === type.value ? 'active' : ''}`}
            onClick={() => setActiveType(type.value)}
          >
            <span className="emoji">{type.emoji}</span>
            {type.label}
          </button>
        ))}
      </div>

      {showForm && (
        <form className="media-add-form" onSubmit={handleAdd} style={{ marginBottom: 'var(--space-lg)' }}>
          <input className="input" type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder={`${currentType?.label.slice(0, -1)} title...`} autoFocus />
          <input className="input" type="text" value={author} onChange={e => setAuthor(e.target.value)}
            placeholder="Creator/Author" style={{ maxWidth: 160 }} />
          <select className="input" value={formStatus} onChange={e => setFormStatus(e.target.value)} style={{ maxWidth: 140 }}>
            <option value="">Status...</option>
            {statuses.filter(s => s.value !== 'completed').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button className="btn btn-primary" type="submit"><Plus size={14} /> Add</button>
        </form>
      )}

      {renderStatusGroup(`Currently ${activeStatuses.find(s => statuses.some(st => st.value === s)) ? statuses.find(st => activeStatuses.includes(st.value))?.label : 'Active'}`, activeItems, 'active')}
      {renderStatusGroup('Up Next', queueItems, 'queued')}
      {renderStatusGroup('Dropped', droppedItems, 'dropped')}

      {getByType(activeType).filter(m => m.status !== 'completed').length === 0 && !showForm && (
        <div className="empty-state">
          <span style={{ fontSize: '2rem' }}>{currentType?.emoji}</span>
          <span className="text-sm text-muted">Nothing in progress.</span>
        </div>
      )}
    </div>
  );
}
