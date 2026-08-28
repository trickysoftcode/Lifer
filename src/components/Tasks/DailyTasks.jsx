import { useState, useRef, useEffect } from 'react';
import { ListTodo, Plus, X, ChevronRight, Undo2 } from 'lucide-react';
import { useDailyTasks } from '../../hooks/useDailyTasks';
import './Tasks.css';

export default function DailyTasks() {
  const { pendingTasks, completedTasks, addTask, completeTask, uncompleteTask, deleteTask } = useDailyTasks();
  const [newTask, setNewTask] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [fadingIds, setFadingIds] = useState(new Set());
  const fadeTimers = useRef({});

  const handleAdd = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(newTask.trim());
      setNewTask('');
    }
  };

  const handleComplete = (id) => {
    // Start fade animation
    setFadingIds(prev => new Set([...prev, id]));

    // After animation, move to completed
    fadeTimers.current[id] = setTimeout(() => {
      completeTask(id);
      setFadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      delete fadeTimers.current[id];
    }, 600);
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      Object.values(fadeTimers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="daily-tasks-section glass-card" id="daily-tasks">
      <div className="daily-tasks-header">
        <div className="daily-tasks-title">
          <ListTodo size={20} className="icon" />
          Today's Tasks
        </div>
      </div>

      <div className="tasks-list">
        {pendingTasks.length === 0 && !fadingIds.size && (
          <div className="empty-state" style={{ padding: '24px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            <span className="text-sm text-muted">All clear! Add some tasks for today</span>
          </div>
        )}
        {pendingTasks.map(task => (
          <div
            className={`task-item ${fadingIds.has(task.id) ? 'fading' : ''}`}
            key={task.id}
          >
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={false}
                onChange={() => handleComplete(task.id)}
              />
              <span className="checkbox-custom">
                <svg viewBox="0 0 24 24" fill="none">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="checkbox-label">{task.title}</span>
            </label>
            <button className="delete-btn" onClick={() => deleteTask(task.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <form className="add-task-form" onSubmit={handleAdd}>
        <input
          className="input"
          type="text"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Add a task for today..."
          id="add-task-input"
        />
        <button className="btn btn-primary btn-icon" type="submit" id="add-task-btn">
          <Plus size={18} />
        </button>
      </form>

      {completedTasks.length > 0 && (
        <div className="completed-toggle">
          <button
            className="completed-toggle-btn"
            onClick={() => setShowCompleted(!showCompleted)}
            id="toggle-completed-btn"
          >
            <ChevronRight size={16} className={`chevron ${showCompleted ? 'open' : ''}`} />
            Completed
            <span className="count">{completedTasks.length}</span>
          </button>

          {showCompleted && (
            <div className="completed-list">
              {completedTasks.map(task => (
                <div className="task-item completed-item" key={task.id}>
                  <label className="checkbox-wrapper">
                    <input type="checkbox" checked readOnly />
                    <span className="checkbox-custom">
                      <svg viewBox="0 0 24 24" fill="none">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="checkbox-label checked">{task.title}</span>
                  </label>
                  <button className="undo-btn" onClick={() => uncompleteTask(task.id)}>
                    <Undo2 size={12} /> Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
