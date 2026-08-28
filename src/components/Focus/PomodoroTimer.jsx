import { Timer, Play, Pause, RotateCcw, Flame } from 'lucide-react';
import { usePomodoro } from '../../hooks/usePomodoro';
import './Focus.css';

export default function PomodoroTimer() {
  const {
    mode, isRunning, progress, currentMode,
    completedWorkSessions, formattedTime,
    start, pause, reset, switchMode, MODES,
  } = usePomodoro();

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - progress);

  const modeColors = {
    work: '#ef4444',
    shortBreak: '#10b981',
    longBreak: '#06b6d4',
  };

  return (
    <div className="pomodoro-card glass-card" id="pomodoro">
      <div className="pomodoro-header">
        <Timer size={20} className="icon" />
        Pomodoro Timer
      </div>

      <div className="pomodoro-mode-tabs">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            className={`pomodoro-mode-tab ${mode === key ? 'active' : ''}`}
            onClick={() => switchMode(key)}
            style={mode === key ? { background: modeColors[key] } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="timer-circle">
        <svg viewBox="0 0 200 200">
          <circle className="track" cx="100" cy="100" r={radius} />
          <circle
            className="progress"
            cx="100" cy="100" r={radius}
            stroke={modeColors[mode]}
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
          />
        </svg>
        <div className="timer-display">
          <div className="timer-time" style={{ color: modeColors[mode] }}>
            {formattedTime}
          </div>
          <div className="timer-mode-label">{currentMode.label}</div>
        </div>
      </div>

      <div className="pomodoro-controls">
        {isRunning ? (
          <button className="btn btn-secondary btn-lg" onClick={pause} id="pomodoro-pause">
            <Pause size={18} /> Pause
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={start} id="pomodoro-start">
            <Play size={18} /> Start
          </button>
        )}
        <button className="btn btn-ghost btn-icon" onClick={reset} id="pomodoro-reset">
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="pomodoro-sessions">
        <Flame size={16} />
        Focus sessions today:
        <span className="count">{completedWorkSessions}</span>
      </div>
    </div>
  );
}
