import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, StickyNote, Trash2, Copy, Pencil, Check, X, Save } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import Header from '../components/Header/Header';

export default function SavedNotesPage() {
  const navigate = useNavigate();
  const savedNotes = useLiveQuery(() => db.savedNotes.orderBy('createdAt').reverse().toArray(), []) || [];
  const [editingId, setEditingId] = useState(null);
  const [editItems, setEditItems] = useState([]);

  // Group notes by date
  const grouped = savedNotes.reduce((acc, note) => {
    const dateStr = new Date(note.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(note);
    return acc;
  }, {});

  const startEdit = (note) => {
    let lines;
    try { lines = JSON.parse(note.content); } catch { lines = [note.content]; }
    setEditingId(note.id);
    setEditItems([...lines]);
  };

  const saveEdit = async () => {
    const filtered = editItems.filter(l => l.trim());
    if (filtered.length === 0) return;
    await db.savedNotes.update(editingId, { content: JSON.stringify(filtered) });
    setEditingId(null);
    setEditItems([]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditItems([]);
  };

  const handleEditChange = (index, val) => {
    const newItems = [...editItems];
    newItems[index] = val;
    setEditItems(newItems);
  };

  const handleEditKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newItems = [...editItems];
      newItems.splice(index + 1, 0, '');
      setEditItems(newItems);
      setTimeout(() => {
        const el = document.getElementById(`edit-note-${index + 1}`);
        if (el) el.focus();
      }, 0);
    } else if (e.key === 'Backspace' && editItems[index] === '' && editItems.length > 1) {
      e.preventDefault();
      const newItems = [...editItems];
      newItems.splice(index, 1);
      setEditItems(newItems);
      setTimeout(() => {
        const el = document.getElementById(`edit-note-${index - 1}`);
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      }, 0);
    }
  };

  return (
    <>
      <Header />
      <main className="home-page" style={{ padding: 'var(--space-xl) var(--space-lg)' }}>
        <div className="glass-card" style={{ padding: 'var(--space-xl)', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')}>
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', margin: 0, fontSize: 'var(--text-2xl)' }}>
              <StickyNote className="icon" size={28} />
              Saved Notes
            </h1>
          </div>

          {savedNotes.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-2xl)' }}>
              <span style={{ fontSize: '3rem' }}>📝</span>
              <p style={{ color: 'var(--text-muted)' }}>No saved notes yet. Use Quick Notes on the home page to jot something down and hit Save!</p>
            </div>
          ) : (
            Object.entries(grouped).map(([dateLabel, notes]) => (
              <div key={dateLabel} style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-xs)' }}>
                  📅 {dateLabel}
                </div>
                {notes.map(note => {
                  let lines = [];
                  try { lines = JSON.parse(note.content); } catch { lines = [note.content]; }
                  const isEditing = editingId === note.id;
                  const time = new Date(note.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={note.id} className="glass-card-static" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{time}</span>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                          {isEditing ? (
                            <>
                              <button className="btn btn-success btn-sm" onClick={saveEdit}><Save size={12} /> Save</button>
                              <button className="btn btn-ghost btn-sm" onClick={cancelEdit}><X size={12} /></button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} onClick={() => startEdit(note)} data-tooltip="Edit"><Pencil size={14} /></button>
                              <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} onClick={() => navigator.clipboard.writeText(lines.join('\n'))} data-tooltip="Copy"><Copy size={14} /></button>
                              <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28, color: 'var(--accent-danger)' }} onClick={() => db.savedNotes.delete(note.id)} data-tooltip="Delete"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {editItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: 'var(--text-sm)', width: 20, textAlign: 'right', userSelect: 'none' }}>{i + 1}.</span>
                              <input
                                id={`edit-note-${i}`}
                                className="input"
                                value={item}
                                onChange={e => handleEditChange(i, e.target.value)}
                                onKeyDown={e => handleEditKeyDown(e, i)}
                                style={{ flex: 1, padding: '4px 8px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-accent)', borderRadius: 0, fontSize: 'var(--text-sm)' }}
                                autoComplete="off"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ol style={{ paddingLeft: 'var(--space-xl)', fontSize: 'var(--text-sm)', lineHeight: 1.8 }}>
                          {lines.map((l, i) => (
                            <li key={i} style={{ color: 'var(--text-primary)' }}>{l}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
