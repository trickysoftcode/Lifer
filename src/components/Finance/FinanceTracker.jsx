import { useState } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, X, PieChart as PieIcon, Zap, Repeat, Settings, Pencil, Trash2, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTransactions, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../hooks/useTransactions';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/db';
import './Finance.css';

const CHART_COLORS = [
  '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1',
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 'var(--text-xs)',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>{payload[0].name}</p>
        <p style={{ color: 'var(--accent-secondary)' }}>{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

const DEFAULT_TEMPLATES = {
  income: [
    { label: 'Salary', category: 'salary', amount: 50000 },
    { label: 'FD Interest', category: 'investments', amount: 1500 },
    { label: 'Dividend', category: 'investments', amount: 500 },
  ],
  expense: [
    { label: 'Rent', category: 'rent', amount: 15000 },
    { label: 'Electricity Bill', category: 'electricity', amount: 1200 },
    { label: 'Internet', category: 'internet-phone', amount: 800 },
    { label: 'Netflix', category: 'streaming', amount: 649 },
  ]
};

const TEMPLATES_KEY = 'lifer_finance_templates';

function loadTemplates() {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_TEMPLATES;
}

function saveTemplates(tpls) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(tpls));
}

export default function FinanceTracker() {
  const {
    incomeTransactions, expenseTransactions, totalIncome, totalExpenses, netBalance,
    expensesByCategory, incomeByCategory, addTransaction, deleteTransaction,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState('none');

  // Template management state
  const [templates, setTemplatesState] = useState(loadTemplates);
  const [showTplManager, setShowTplManager] = useState(false);
  const [tplLabel, setTplLabel] = useState('');
  const [tplCategory, setTplCategory] = useState('');
  const [tplAmount, setTplAmount] = useState('');

  const setTemplates = (newTpls) => {
    setTemplatesState(newTpls);
    saveTemplates(newTpls);
  };

  const categories = activeTab === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const chartData = activeTab === 'expense' ? expensesByCategory : incomeByCategory;
  const transactions = activeTab === 'expense' ? expenseTransactions : incomeTransactions;
  const currentTemplates = templates[activeTab] || [];

  const applyTemplate = (tpl) => {
    setCategory(tpl.category);
    setAmount(tpl.amount);
    setDescription(tpl.label);
  };

  const addTemplate = () => {
    if (!tplLabel.trim() || !tplCategory || !tplAmount) return;
    const newTpls = { ...templates };
    newTpls[activeTab] = [...(newTpls[activeTab] || []), { label: tplLabel.trim(), category: tplCategory, amount: Number(tplAmount) }];
    setTemplates(newTpls);
    setTplLabel('');
    setTplCategory('');
    setTplAmount('');
  };

  const deleteTemplate = (index) => {
    const newTpls = { ...templates };
    newTpls[activeTab] = newTpls[activeTab].filter((_, i) => i !== index);
    setTemplates(newTpls);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !amount) return;
    addTransaction({
      type: activeTab,
      category,
      amount: Number(amount),
      description: description.trim(),
      date,
      frequency
    });
    setCategory('');
    setAmount('');
    setDescription('');
    setFrequency('none');
  };

  return (
    <div className="finance-section glass-card" id="finance">
      <div className="finance-header">
        <div className="finance-title">
          <Wallet size={22} className="icon" />
          Finance Tracker
        </div>
      </div>

      <div className="finance-summary">
        <div className="summary-card">
          <div className="summary-card-label">Total Income</div>
          <div className="summary-card-value income">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Total Expenses</div>
          <div className="summary-card-value expense">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Net Balance</div>
          <div className={`summary-card-value ${netBalance >= 0 ? 'income' : 'expense'}`}>
            {formatCurrency(netBalance)}
          </div>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: 'var(--space-md)' }}>
        <button className={`tab-item ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}>
          <TrendingUp size={14} style={{ marginRight: 6 }} /> Income
        </button>
        <button className={`tab-item ${activeTab === 'expense' ? 'active' : ''}`} onClick={() => setActiveTab('expense')}>
          <TrendingDown size={14} style={{ marginRight: 6 }} /> Expenses
        </button>
      </div>

      {/* Templates */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={14} /> Quick Add:
        </span>
        {currentTemplates.map((tpl, i) => (
          <button key={`${tpl.label}-${i}`} className="badge badge-purple" style={{ cursor: 'pointer', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }} onClick={() => applyTemplate(tpl)}>
            {tpl.label} <span style={{ opacity: 0.5, marginLeft: 4 }}>{formatCurrency(tpl.amount)}</span>
          </button>
        ))}
        <button className="btn btn-ghost btn-icon" style={{ width: 24, height: 24, padding: 2 }} onClick={() => setShowTplManager(!showTplManager)} data-tooltip="Manage Templates">
          <Settings size={14} />
        </button>
      </div>

      {/* Template Manager */}
      {showTplManager && (
        <div className="glass-card-static" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Settings size={14} /> Manage {activeTab === 'income' ? 'Income' : 'Expense'} Templates
          </div>

          {/* Existing templates */}
          {currentTemplates.map((tpl, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-sm)' }}>
                {tpl.label} — <span style={{ color: 'var(--accent-secondary)' }}>{formatCurrency(tpl.amount)}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 'var(--text-xs)' }}>({tpl.category})</span>
              </span>
              <button onClick={() => deleteTemplate(i)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Add new template */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
            <input className="input" type="text" value={tplLabel} onChange={e => setTplLabel(e.target.value)} placeholder="Label" style={{ flex: 1, minWidth: 120 }} />
            <select className="input" value={tplCategory} onChange={e => setTplCategory(e.target.value)} style={{ flex: 1, minWidth: 120 }}>
              <option value="">Category...</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input className="input" type="number" value={tplAmount} onChange={e => setTplAmount(e.target.value)} placeholder="Amount" style={{ width: 100 }} min="0" />
            <button className="btn btn-primary btn-sm" onClick={addTemplate}><Plus size={14} /> Add</button>
          </div>
        </div>
      )}

      <div className="finance-content">
        <div className="finance-form">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select category...</option>
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.group ? `${c.group} → ` : ''}{c.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="input" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What was this for?" />
              </div>
              <div className="form-group">
                <label className="form-label">Repeat</label>
                <select className="input" value={frequency} onChange={e => setFrequency(e.target.value)}>
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" id="add-transaction-btn">
              <Plus size={16} /> Add {activeTab === 'income' ? 'Income' : 'Expense'}
            </button>
          </form>
        </div>

        <div className="finance-chart">
          <h4><PieIcon size={16} /> {activeTab === 'expense' ? 'Expense' : 'Income'} Breakdown</h4>
          {chartData.length === 0 ? (
            <div className="chart-empty">No data yet. Add some transactions!</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} stroke="none">
                  {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {transactions.length > 0 && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            Recent {activeTab === 'expense' ? 'Expenses' : 'Income'}
          </h4>
          <div className="transaction-list-container">
            {transactions.slice(0, 20).map(t => {
              const catLabel = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].find(c => c.value === t.category)?.label || t.category;
              return (
                <div className="transaction-item" key={t.id}>
                  <div className="transaction-info">
                    <span className="transaction-desc">
                      {t.description || catLabel}
                      {t.frequency && t.frequency !== 'none' && <Repeat size={12} style={{ marginLeft: 6, color: 'var(--accent-secondary)' }} />}
                    </span>
                    <span className="transaction-meta">
                      <span>{catLabel}</span>
                      <span>•</span>
                      <span>{t.date}</span>
                    </span>
                  </div>
                  <div className={`transaction-amount ${t.type}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    <button className="transaction-delete" onClick={() => deleteTransaction(t.id)}><X size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
