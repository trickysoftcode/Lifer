import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StickyNote, Check, Save, History } from 'lucide-react';
import db from '../../db/db';
import './Habits.css';

export default function QuickNotes() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const saveTimeout = useRef(null);

  // Load latest state of current note on mount
  useEffect(() => {
    db.quickNotes.toArray().then(notes => {
      if (notes.length > 0 && notes[0].content) {
        try {
          // Migration: if stored as JSON array (old format), join with newlines
          const parsed = JSON.parse(notes[0].content);
          if (Array.isArray(parsed)) {
            setContent(parsed.filter(Boolean).join('\n'));
          } else {
            setContent(notes[0].content);
          }
        } catch {
          // Already plain text
          setContent(notes[0].content);
        }
      }
    });
  }, []);

  const persistCurrent = async (text) => {
    const notes = await db.quickNotes.toArray();
    if (notes.length > 0) {
      await db.quickNotes.update(notes[0].id, { content: text, updatedAt: new Date().toISOString() });
    } else {
      await db.quickNotes.add({ content: text, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => persistCurrent(val), 800);
  };

  const handleSaveToHistory = async () => {
    if (!content.trim()) return;
    
    await db.savedNotes.add({
      content: content.trim(),
      createdAt: new Date().toISOString()
    });
    
    setContent('');
    persistCurrent('');
    
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="quick-notes glass-card" id="quick-notes" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="quick-notes-header">
        <div className="quick-notes-title">
          <StickyNote size={20} className="icon" />
          Quick Notes
        </div>
        <span className={`quick-notes-saved ${showSaved ? 'visible' : ''}`}>
          <Check size={14} /> Saved
        </span>
      </div>
      
      <textarea
        className="quick-notes-textarea"
        value={content}
        onChange={handleChange}
        placeholder="Jot down anything — lists, tables, ideas... ✏️"
        spellCheck={false}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'auto', paddingTop: 'var(--space-sm)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/notes')} data-tooltip="View Saved Notes">
          <History size={16} />
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleSaveToHistory}>
          <Save size={14} /> Save
        </button>
      </div>
    </div>
  );
}
