import { useState } from 'react';
import { RotateCcw, Plus, X, Repeat, Check } from 'lucide-react';
import { useHabits } from '../../hooks/useHabits';
import './Habits.css';

export default function DailyHabits() {
  const { habits, addHabit, toggleHabit, deleteHabit, resetAll } = useHabits();
  const [newHabit, setNewHabit] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newHabit.trim()) {
      addHabit(newHabit.trim());
      setNewHabit('');
    }
  };

  const checkedCount = habits.filter(h => h.isChecked).length;

  return (
    <div className="daily-habits glass-card" id="daily-habits">
      <div className="daily-habits-header">
        <div className="daily-habits-title">
          <Repeat size={20} className="icon" />
          Daily Habits
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={resetAll}
          data-tooltip="Reset all checkboxes"
          id="reset-habits-btn"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div className="habits-list">
        {habits.length === 0 && (
          <div className="empty-state" style={{ padding: '24px' }}>
            <span style={{ fontSize: '1.5rem' }}>🌱</span>
            <span className="text-sm text-muted">Add your first daily habit</span>
          </div>
        )}
        {habits.map(habit => (
          <div className="habit-item" key={habit.id}>
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={habit.isChecked}
                onChange={() => toggleHabit(habit.id, habit.isChecked)}
              />
              <span className="checkbox-custom">
                <svg viewBox="0 0 24 24" fill="none">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className={`checkbox-label ${habit.isChecked ? 'checked' : ''}`}>
                {habit.title}
              </span>
            </label>
            <button className="delete-btn" onClick={() => deleteHabit(habit.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <form className="add-habit-form" onSubmit={handleAdd}>
        <input
          className="input"
          type="text"
          value={newHabit}
          onChange={e => setNewHabit(e.target.value)}
          placeholder="Add a habit..."
          id="add-habit-input"
        />
        <button className="btn btn-primary btn-icon" type="submit" id="add-habit-btn">
          <Plus size={18} />
        </button>
      </form>

      {habits.length > 0 && (
        <div className="habit-counter">
          <span>{checkedCount}</span> / {habits.length} completed today
        </div>
      )}
    </div>
  );
}
