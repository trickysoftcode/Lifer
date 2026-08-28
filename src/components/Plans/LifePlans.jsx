import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Plus, X, Calendar, Target, Plane, PartyPopper, MapPin, ExternalLink, Zap, ShoppingBag, Trophy } from 'lucide-react';
import { usePlans, usePlanItems } from '../../hooks/usePlans';
import './Plans.css';

const PLAN_TABS = [
  { key: 'goal', label: 'Goals', icon: Target },
  { key: 'event', label: 'Events', icon: PartyPopper },
  { key: 'travel', label: 'Travel', icon: Plane },
];

const GOAL_CATEGORIES = [
  { key: 'short', label: 'Short-Term Goals', icon: '⚡', description: 'Quick wins & sprints' },
  { key: 'long-term', label: 'Long-Term Goals', icon: '🏆', description: 'Big picture targets' },
];

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUS_BADGE = {
  planned: 'badge-purple',
  'in-progress': 'badge-amber',
  completed: 'badge-green',
  'on-hold': 'badge-red',
};

const PRIORITY_BADGE = {
  low: 'badge-cyan',
  medium: 'badge-amber',
  high: 'badge-red',
};

function PlanCardSubtaskProgress({ planId }) {
  const { goalSubtasks, eventTasks } = usePlanItems(planId);
  const allTasks = [...goalSubtasks, ...eventTasks];
  if (allTasks.length === 0) return null;
  const done = allTasks.filter(t => t.isCompleted).length;
  const pct = Math.round((done / allTasks.length) * 100);
  return (
    <div className="plan-card-subtask-progress">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">{done}/{allTasks.length} tasks done</span>
    </div>
  );
}

export default function LifePlans() {
  const navigate = useNavigate();
  const { goals, events, travels, shortGoals, longTermGoals, addPlan, deletePlan } = usePlans();
  const [activeTab, setActiveTab] = useState('goal');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState('planned');
  const [priority, setPriority] = useState('medium');
  const [goalCategory, setGoalCategory] = useState('short');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [venue, setVenue] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const id = await addPlan({
      title: title.trim(),
      type: activeTab,
      category: activeTab === 'goal' ? goalCategory : null,
      description: description.trim(),
      targetDate: targetDate || null,
      status,
      priority,
      destination: destination.trim() || null,
      budget: budget ? Number(budget) : null,
      venue: venue.trim() || null,
    });
    resetForm();
    setShowModal(false);
    // Navigate to detail page for travel and events
    if (activeTab === 'travel' || activeTab === 'event') {
      navigate(`/plan/${id}`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetDate('');
    setStatus('planned');
    setPriority('medium');
    setGoalCategory('short');
    setDestination('');
    setBudget('');
    setVenue('');
  };

  const handleDeletePlan = (e, id) => {
    e.stopPropagation();
    deletePlan(id);
  };

  const handleCardClick = (plan) => {
    navigate(`/plan/${plan.id}`);
  };

  const renderPlanCard = (plan) => (
    <div className="plan-card" key={plan.id} onClick={() => handleCardClick(plan)}>
      <div className="plan-card-header">
        <div className="plan-card-title">{plan.title}</div>
        <div className="plan-card-actions">
          <button onClick={(e) => handleDeletePlan(e, plan.id)}><X size={14} /></button>
        </div>
      </div>
      {plan.description && <div className="plan-card-desc">{plan.description}</div>}
      {plan.destination && (
        <div className="plan-card-destination">
          <MapPin size={12} /> {plan.destination}
        </div>
      )}
      <div className="plan-card-meta">
        <span className={`badge ${STATUS_BADGE[plan.status]}`}>{plan.status}</span>
        <span className={`badge ${PRIORITY_BADGE[plan.priority]}`}>{plan.priority}</span>
        {plan.targetDate && (
          <span className="plan-card-date">
            <Calendar size={12} />
            {new Date(plan.targetDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        {plan.budget && <span className="plan-card-budget">₹{plan.budget.toLocaleString('en-IN')}</span>}
      </div>
      <PlanCardSubtaskProgress planId={plan.id} />
      <div className="plan-card-open">
        <ExternalLink size={12} /> Open details
      </div>
    </div>
  );

  // Render goals with subcategories
  const renderGoalsTab = () => (
    <>
      {GOAL_CATEGORIES.map(cat => {
        const catGoals = cat.key === 'short' ? shortGoals : longTermGoals;
        return (
          <div className="goal-category" key={cat.key}>
            <div className="goal-category-header">
              <span className="goal-category-icon">{cat.icon}</span>
              <span className="goal-category-label">{cat.label}</span>
              <span className="goal-category-count">{catGoals.length}</span>
            </div>
            <div className="plans-grid">
              {catGoals.map(renderPlanCard)}
              <div className="add-plan-card" onClick={() => { setGoalCategory(cat.key); setShowModal(true); }}>
                <Plus size={20} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Add {cat.label.replace('Goals', 'Goal').replace('Wishlist', 'Wish')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );

  // Render events/travel as flat grids
  const renderFlatTab = (items, addLabel) => (
    <div className="plans-grid stagger-children">
      {items.map(renderPlanCard)}
      <div className="add-plan-card" onClick={() => setShowModal(true)}>
        <Plus size={24} />
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Add {addLabel}</span>
      </div>
    </div>
  );

  return (
    <div className="plans-section glass-card" id="plans">
      <div className="plans-header">
        <div className="plans-title">
          <Compass size={22} className="icon" />
          Life Plans
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} id="add-plan-btn">
          <Plus size={14} /> Add Plan
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        {PLAN_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={14} style={{ marginRight: 6 }} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'goal' && renderGoalsTab()}
      {activeTab === 'event' && renderFlatTab(events, 'Event')}
      {activeTab === 'travel' && renderFlatTab(travels, 'Travel Plan')}

      {/* Add Plan Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {activeTab === 'goal' ? '🎯 New Goal' : activeTab === 'event' ? '🎉 New Event' : '✈️ New Travel Plan'}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Type Tabs */}
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <div className="tab-bar">
                    {PLAN_TABS.map(tab => (
                      <button key={tab.key} type="button"
                        className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                      >{tab.label}</button>
                    ))}
                  </div>
                </div>

                {/* Goal Category */}
                {activeTab === 'goal' && (
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <div className="tab-bar">
                      {GOAL_CATEGORIES.map(cat => (
                        <button key={cat.key} type="button"
                          className={`tab-item ${goalCategory === cat.key ? 'active' : ''}`}
                          onClick={() => setGoalCategory(cat.key)}
                        >{cat.icon} {cat.label.replace('Goals', '').replace('-Term', '').trim()}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="input" type="text" value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={activeTab === 'travel' ? 'e.g. Bali Trip 2026' : activeTab === 'event' ? 'e.g. Diwali Party' : 'What\'s the goal?'}
                    autoFocus id="plan-title-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="input" value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Details..." rows={2}
                  />
                </div>

                {/* Travel-specific fields */}
                {activeTab === 'travel' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Destination</label>
                      <input className="input" type="text" value={destination}
                        onChange={e => setDestination(e.target.value)} placeholder="e.g. Bali, Indonesia"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Budget (₹)</label>
                      <input className="input" type="number" value={budget}
                        onChange={e => setBudget(e.target.value)} placeholder="0" min="0"
                      />
                    </div>
                  </div>
                )}

                {/* Event-specific fields */}
                {activeTab === 'event' && (
                  <div className="form-group">
                    <label className="form-label">Venue / Location</label>
                    <input className="input" type="text" value={venue}
                      onChange={e => setVenue(e.target.value)} placeholder="e.g. Home, Restaurant, Online"
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Target Date</label>
                    <input className="input" type="date" value={targetDate}
                      onChange={e => setTargetDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                      {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="create-plan-btn">
                  <Plus size={16} /> Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
