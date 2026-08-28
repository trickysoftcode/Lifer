import { useState } from 'react';
import { Trophy, ShoppingBag, BarChart3 } from 'lucide-react';
import { useXP, useStreak, useFocusScore } from '../../hooks/useGamification';
import TrophyCase from './TrophyCase';
import RewardShop from './RewardShop';
import WeeklyReview from './WeeklyReview';
import './Gamification.css';

function XPBar({ level, xpIntoLevel, xpForNextLevel, totalXP }) {
  const pct = Math.round((xpIntoLevel / xpForNextLevel) * 100);
  return (
    <div className="xp-bar-container" data-tooltip={`${totalXP} total XP`}>
      <span className="xp-level-badge">LV {level}</span>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="xp-bar-text">{xpIntoLevel}/{xpForNextLevel}</span>
    </div>
  );
}

function StreakCounter({ currentStreak, freezeTokens }) {
  const fireClass = currentStreak >= 30 ? 'blazing' : currentStreak >= 7 ? 'hot' : '';
  return (
    <div className="streak-counter" data-tooltip={`Best: ${currentStreak} days`}>
      <span className={`streak-fire ${fireClass}`}>🔥</span>
      <span className="streak-count">{currentStreak}</span>
      {freezeTokens > 0 && (
        <div className="streak-freeze-dots">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`freeze-dot ${i < freezeTokens ? 'active' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function FocusScoreGauge({ score }) {
  const r = 11;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="focus-score" data-tooltip="Today's Focus Score">
      <div className="focus-score-ring">
        <svg width="28" height="28" viewBox="0 0 28 28">
          <circle className="ring-bg" cx="14" cy="14" r={r} />
          <circle className="ring-fill" cx="14" cy="14" r={r}
            stroke={color}
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
      </div>
      <span className="focus-score-number" style={{ color }}>{score}</span>
    </div>
  );
}

export default function GamificationBar() {
  const { level, xpIntoLevel, xpForNextLevel, totalXP } = useXP();
  const { currentStreak, freezeTokens } = useStreak();
  const focusScore = useFocusScore();
  const [showTrophies, setShowTrophies] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showReview, setShowReview] = useState(false);

  return (
    <>
      <div className="gamification-bar">
        <XPBar level={level} xpIntoLevel={xpIntoLevel} xpForNextLevel={xpForNextLevel} totalXP={totalXP} />
        <StreakCounter currentStreak={currentStreak} freezeTokens={freezeTokens} />
        <FocusScoreGauge score={focusScore} />
        <button className="gam-btn" onClick={() => setShowTrophies(true)} id="trophy-btn">
          <Trophy size={14} /> Trophies
        </button>
        <button className="gam-btn" onClick={() => setShowShop(true)} id="shop-btn">
          <ShoppingBag size={14} /> Rewards
        </button>
        <button className="gam-btn" onClick={() => setShowReview(true)} id="review-btn">
          <BarChart3 size={14} /> Review
        </button>
      </div>

      {showTrophies && <TrophyCase onClose={() => setShowTrophies(false)} />}
      {showShop && <RewardShop onClose={() => setShowShop(false)} />}
      {showReview && <WeeklyReview onClose={() => setShowReview(false)} />}
    </>
  );
}
