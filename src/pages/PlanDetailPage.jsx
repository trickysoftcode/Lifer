import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft, MapPin, Calendar, IndianRupee, Luggage, ClipboardList,
  Route, StickyNote, Plus, X, Check, Target, PartyPopper, Plane,
} from 'lucide-react';
import db from '../db/db';
import { usePlanItems } from '../hooks/usePlans';
import './PlanDetailPage.css';

const STATUS_BADGE = {
  planned: 'badge-purple',
  'in-progress': 'badge-amber',
  completed: 'badge-green',
  'on-hold': 'badge-red',
};

const formatCurrency = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function ChecklistSection({ title, icon: Icon, items, itemType, onAdd, onToggle, onDelete, showAmount }) {
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAdd({ itemType, title: newTitle.trim(), amount: newAmount ? Number(newAmount) : null });
    setNewTitle('');
    setNewAmount('');
  };

  return (
    <div className="plan-section">
      <div className="plan-section-header">
        <div className="plan-section-title">
          <Icon size={18} className="icon" /> {title}
          <span className="goal-category-count">{items.length}</span>
        </div>
        <span className="text-sm text-muted">
          {items.filter(i => i.isCompleted).length}/{items.length} done
        </span>
      </div>
      {items.map(item => (
        <div className="plan-item" key={item.id}>
          <label className="checkbox-wrapper">
            <input type="checkbox" checked={item.isCompleted} onChange={() => onToggle(item.id, item.isCompleted)} />
            <span className="checkbox-custom">
              <svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
          </label>
          <div className="item-content">
            <span className={`item-title ${item.isCompleted ? 'checkbox-label checked' : ''}`}>{item.title}</span>
            {item.date && <span className="item-subtitle">{item.date}</span>}
          </div>
          {showAmount && item.amount && <span className="item-amount">{formatCurrency(item.amount)}</span>}
          <button className="delete-item-btn" onClick={() => onDelete(item.id)}><X size={14} /></button>
        </div>
      ))}
      <form className="add-item-form" onSubmit={handleAdd}>
        <input className="input" type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
          placeholder={`Add ${title.toLowerCase().replace(/s$/, '')}...`} />
        {showAmount && (
          <input className="input amount-input" type="number" value={newAmount}
            onChange={e => setNewAmount(e.target.value)} placeholder="₹ Amount" min="0" />
        )}
        <button className="btn btn-primary btn-icon" type="submit"><Plus size={18} /></button>
      </form>
    </div>
  );
}

export default function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = Number(id);

  const plan = useLiveQuery(() => db.plans.get(numericId), [numericId]);
  const { itinerary, budgetItems, packingItems, eventTasks, goalSubtasks, notes, totalBudget,
    addItem, toggleItem, deleteItem, updateItem } = usePlanItems(numericId);

  const [planNotes, setPlanNotes] = useState('');
  const notesLoaded = useRef(false);

  // Load notes from existing note items
  if (notes.length > 0 && !notesLoaded.current) {
    setPlanNotes(notes[0].content || '');
    notesLoaded.current = true;
  }

  const saveNotes = useCallback(async (text) => {
    if (notes.length > 0) {
      await updateItem(notes[0].id, { content: text });
    } else {
      await addItem({ itemType: 'note', title: 'Notes', content: text });
    }
  }, [notes, updateItem, addItem]);

  const handleNotesChange = (e) => {
    setPlanNotes(e.target.value);
    clearTimeout(handleNotesChange._timer);
    handleNotesChange._timer = setTimeout(() => saveNotes(e.target.value), 800);
  };

  if (!plan) {
    return (
      <div className="plan-detail-page">
        <div className="plan-detail-topbar">
          <button className="back-btn" onClick={() => navigate('/')}><ArrowLeft size={18} /> Dashboard</button>
        </div>
        <div className="plan-detail-main"><div className="empty-state"><p>Plan not found</p></div></div>
      </div>
    );
  }

  const planIcon = plan.type === 'travel' ? '✈️' : plan.type === 'event' ? '🎉' : '🎯';
  const allocatedBudget = plan.budget || 0;
  const remainingBudget = allocatedBudget - totalBudget;

  return (
    <div className="plan-detail-page">
      {/* Top Bar */}
      <div className="plan-detail-topbar">
        <div className="plan-detail-topbar-left">
          <button className="back-btn" onClick={() => navigate('/')}><ArrowLeft size={18} /> Dashboard</button>
        </div>
      </div>

      <div className="plan-detail-main">
        {/* Hero */}
        <div className="plan-hero">
          <h1 className="plan-hero-title">{planIcon} {plan.title}</h1>
          <div className="plan-hero-meta">
            <span className={`badge ${STATUS_BADGE[plan.status]}`}>{plan.status}</span>
            {plan.targetDate && (
              <span className="plan-card-date"><Calendar size={14} />
                {new Date(plan.targetDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {plan.destination && <span className="plan-card-destination"><MapPin size={14} /> {plan.destination}</span>}
            {plan.venue && <span className="plan-card-destination"><MapPin size={14} /> {plan.venue}</span>}
          </div>
          {plan.description && <p className="plan-hero-desc">{plan.description}</p>}
        </div>

        {/* ---- TRAVEL SECTIONS ---- */}
        {plan.type === 'travel' && (
          <>
            {/* Budget Summary */}
            {allocatedBudget > 0 && (
              <div className="budget-summary">
                <div className="budget-summary-card">
                  <div className="budget-summary-label">Total Budget</div>
                  <div className="budget-summary-value" style={{ color: 'var(--accent-secondary)' }}>{formatCurrency(allocatedBudget)}</div>
                </div>
                <div className="budget-summary-card">
                  <div className="budget-summary-label">Spent / Allocated</div>
                  <div className="budget-summary-value" style={{ color: 'var(--accent-warning)' }}>{formatCurrency(totalBudget)}</div>
                </div>
                <div className="budget-summary-card">
                  <div className="budget-summary-label">Remaining</div>
                  <div className="budget-summary-value" style={{ color: remainingBudget >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                    {formatCurrency(remainingBudget)}
                  </div>
                </div>
              </div>
            )}

            <ChecklistSection title="Itinerary" icon={Route} items={itinerary} itemType="itinerary"
              onAdd={addItem} onToggle={toggleItem} onDelete={deleteItem} />

            <ChecklistSection title="Budget Breakdown" icon={IndianRupee} items={budgetItems} itemType="budget"
              onAdd={addItem} onToggle={toggleItem} onDelete={deleteItem} showAmount />

            <ChecklistSection title="Packing List" icon={Luggage} items={packingItems} itemType="packing"
              onAdd={addItem} onToggle={toggleItem} onDelete={deleteItem} />
          </>
        )}

        {/* ---- EVENT SECTIONS ---- */}
        {plan.type === 'event' && (
          <ChecklistSection title="To-Do for this Event" icon={ClipboardList} items={eventTasks} itemType="event-task"
            onAdd={addItem} onToggle={toggleItem} onDelete={deleteItem} />
        )}

        {/* ---- GOAL SECTIONS ---- */}
        {plan.type === 'goal' && (
          <ChecklistSection title="Sub-tasks & Milestones" icon={Target} items={goalSubtasks} itemType="subtask"
            onAdd={addItem} onToggle={toggleItem} onDelete={deleteItem} />
        )}

        {/* Notes (all types) */}
        <div className="plan-section">
          <div className="plan-section-header">
            <div className="plan-section-title">
              <StickyNote size={18} className="icon" /> Notes
            </div>
          </div>
          <textarea className="plan-notes-textarea" value={planNotes} onChange={handleNotesChange}
            placeholder="Add notes, ideas, links..." />
        </div>
      </div>
    </div>
  );
}
