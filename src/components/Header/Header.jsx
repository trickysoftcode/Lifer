import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import GamificationBar from '../Gamification/GamificationBar';
import './Header.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Burning the midnight oil 🌙';
  if (hour < 12) return 'Good morning ☀️';
  if (hour < 17) return 'Good afternoon 🌤️';
  if (hour < 21) return 'Good evening 🌆';
  return 'Night owl mode 🦉';
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export default function Header() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToPomodoro = () => {
    const el = document.getElementById('pomodoro');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <header className="header" id="header">
      <div className="header-inner">
        <h1 className="header-title">Life of Gautam</h1>
        <div className="header-subtitle">
          <span className="header-greeting">{getGreeting()}</span>
          <span className="header-dot" />
          <span className="header-date">{formatDate(now)}</span>
          <span className="header-dot" />
          <span className="header-date">{formatTime(now)}</span>
          <span className="header-dot" />
          <button
            className="pomodoro-quick-btn"
            onClick={scrollToPomodoro}
            id="pomodoro-quick-btn"
          >
            <Timer size={16} />
            <span>Focus</span>
          </button>
        </div>
        <GamificationBar />
      </div>
    </header>
  );
}
