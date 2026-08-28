import { useWeeklyChallenges } from '../../hooks/useGamification';
import { Swords } from 'lucide-react';

export default function WeeklyChallenges() {
  const { challenges, completedCount, totalCount } = useWeeklyChallenges();

  if (challenges.length === 0) return null;

  return (
    <div className="challenges-banner" id="weekly-challenges">
      <div className="challenges-header">
        <div className="challenges-title">
          <Swords size={16} /> Weekly Challenges
        </div>
        <span className="challenges-progress-text">
          {completedCount}/{totalCount} complete
        </span>
      </div>
      <div className="challenge-list">
        {challenges.map(ch => {
          const pct = Math.min(Math.round(((ch.progress || 0) / ch.target) * 100), 100);
          return (
            <div className={`challenge-chip ${ch.isCompleted ? 'completed' : ''}`} key={ch.id}>
              <div className="challenge-chip-title">
                {ch.isCompleted ? '✅ ' : ''}{ch.title}
              </div>
              <div className="challenge-progress-bar">
                <div className="challenge-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="challenge-progress-text-sm">
                {ch.progress || 0}/{ch.target} {ch.isCompleted ? '🎉' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
