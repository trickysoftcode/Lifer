import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Pencil, Trash2, Check, X, Star } from 'lucide-react';
import { useMedia, MEDIA_TYPES } from '../hooks/useMedia';
import Header from '../components/Header/Header';
import '../components/Media/Media.css';

export default function CompletedMediaPage() {
  const navigate = useNavigate();
  const { allMedia, updateMedia, deleteMedia } = useMedia();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');

  const completed = allMedia.filter(m => m.status === 'completed');
  const filtered = activeFilter === 'all'
    ? completed
    : completed.filter(m => m.mediaType === activeFilter);

  const renderStars = (rating) => {
    if (!rating) return null;
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title || '',
      author: item.author || '',
      rating: item.rating || 0,
      mediaType: item.mediaType || 'book',
      completedDate: (item.updatedAt || item.createdAt || '').split('T')[0],
    });
  };

  const handleSave = async () => {
    const updates = {
      title: editForm.title,
      author: editForm.author,
      rating: editForm.rating ? Number(editForm.rating) : null,
      mediaType: editForm.mediaType,
    };
    if (editForm.completedDate) {
      updates.updatedAt = new Date(editForm.completedDate).toISOString();
    }
    await updateMedia(editingId, updates);
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete "${title}" from your spoils?`)) {
      await deleteMedia(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Count per category
  const categoryCounts = MEDIA_TYPES.reduce((acc, type) => {
    acc[type.value] = completed.filter(m => m.mediaType === type.value).length;
    return acc;
  }, {});

  return (
    <>
      <Header />
      <main className="home-page" style={{ padding: 'var(--space-xl) var(--space-lg)' }}>
        <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', margin: 0, fontSize: 'var(--text-3xl)' }}>
              <Trophy className="icon" style={{ color: 'var(--accent-warning)' }} size={32} />
              The Spoils
            </h1>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: 'var(--text-lg)' }}>
            A glorious showcase of everything you have conquered. Dopamine incoming! ✨
          </p>

          {/* Category Filter Tabs */}
          {completed.length > 0 && (
            <div className="spoils-filter-bar" style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
              <button
                className={`media-stat-chip ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                🏆 All ({completed.length})
              </button>
              {MEDIA_TYPES.filter(t => categoryCounts[t.value] > 0).map(type => (
                <button
                  key={type.value}
                  className={`media-stat-chip ${activeFilter === type.value ? 'active' : ''}`}
                  onClick={() => setActiveFilter(type.value)}
                >
                  <span className="emoji">{type.emoji}</span>
                  {type.label} ({categoryCounts[type.value]})
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: '3rem' }}>👻</span>
              <p>{activeFilter === 'all' ? 'Nothing completed yet. Time to finish some quests!' : `No completed ${MEDIA_TYPES.find(t => t.value === activeFilter)?.label?.toLowerCase() || 'items'} yet.`}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
              {filtered.map(item => {
                const typeObj = MEDIA_TYPES.find(t => t.value === item.mediaType);
                const isEditing = editingId === item.id;

                return (
                  <div key={item.id} className="spoils-card glass-card-static" style={{ 
                    padding: 'var(--space-xl)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    textAlign: 'center',
                    background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
                    border: '1px solid var(--border-accent)',
                    boxShadow: 'var(--glow-soft)',
                    transition: 'transform var(--transition-fast)',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isEditing) e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {/* Action buttons (shown on hover) */}
                    {!isEditing && (
                      <div className="spoils-card-actions">
                        <button className="spoils-action-btn spoils-edit-btn" onClick={() => handleEditClick(item)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button className="spoils-action-btn spoils-delete-btn" onClick={() => handleDelete(item.id, item.title)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}

                    {isEditing ? (
                      /* Edit Mode */
                      <div className="spoils-edit-form" style={{ width: '100%' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>
                          {MEDIA_TYPES.find(t => t.value === editForm.mediaType)?.emoji}
                        </div>
                        <input
                          className="input spoils-edit-input"
                          value={editForm.title}
                          onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Title"
                          style={{ textAlign: 'center', fontWeight: 700, marginBottom: 'var(--space-sm)' }}
                        />
                        <input
                          className="input spoils-edit-input"
                          value={editForm.author}
                          onChange={e => setEditForm({ ...editForm, author: e.target.value })}
                          placeholder="Creator / Author"
                          style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}
                        />
                        <select
                          className="input spoils-edit-input"
                          value={editForm.mediaType}
                          onChange={e => setEditForm({ ...editForm, mediaType: e.target.value })}
                          style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}
                        >
                          {MEDIA_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: 'var(--space-sm)' }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, rating: editForm.rating === n ? 0 : n })}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem',
                                color: n <= (editForm.rating || 0) ? 'var(--accent-warning)' : 'var(--text-muted)',
                                transition: 'color var(--transition-fast)',
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <input
                          className="input spoils-edit-input"
                          type="date"
                          value={editForm.completedDate}
                          onChange={e => setEditForm({ ...editForm, completedDate: e.target.value })}
                          style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}
                        />
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                          <button className="btn btn-primary btn-sm" onClick={handleSave}>
                            <Check size={14} /> Save
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={handleCancelEdit}>
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                          {typeObj?.emoji}
                        </div>
                        {/* Category Tag */}
                        <span className="spoils-category-tag">
                          {typeObj?.label?.replace(/s$/, '') || 'Media'}
                        </span>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: 'var(--space-xs)', marginTop: 'var(--space-sm)', color: 'var(--text-primary)' }}>
                          {item.title}
                        </div>
                        {item.author && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-md)' }}>
                            {item.author}
                          </div>
                        )}
                        {item.rating && (
                          <div style={{ color: 'var(--accent-warning)', fontSize: '1.2rem', letterSpacing: 2 }}>
                            {renderStars(item.rating)}
                          </div>
                        )}
                        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          Completed on {new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric'})}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
