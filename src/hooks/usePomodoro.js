import { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { awardXP, incrementChallengeProgress } from '../services/gamification';

const MODES = {
  work: { label: 'Focus', duration: 25 * 60, color: '#ef4444' },
  shortBreak: { label: 'Short Break', duration: 5 * 60, color: '#10b981' },
  longBreak: { label: 'Long Break', duration: 15 * 60, color: '#06b6d4' },
};

export function usePomodoro() {
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySessions = useLiveQuery(
    () => db.pomodoroSessions
      .where('completedAt')
      .above(todayStart.toISOString())
      .toArray(),
    []
  ) || [];

  const completedWorkSessions = todaySessions.filter(s => s.type === 'work').length;

  const currentMode = MODES[mode];
  const progress = 1 - (timeLeft / currentMode.duration);

  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        // Timer completed
        setIsRunning(false);
        // Record session
        db.pomodoroSessions.add({
          startedAt: startTimeRef.current,
          duration: currentMode.duration,
          type: mode,
          completedAt: new Date().toISOString(),
        });
        // Award XP for work sessions
        if (mode === 'work') {
          awardXP('pomodoro_complete');
          incrementChallengeProgress('pomodoro_complete');
        }
        // Play notification sound
        try {
          const audio = new AudioContext();
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.connect(gain);
          gain.connect(audio.destination);
          osc.frequency.value = 800;
          gain.gain.value = 0.3;
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.8);
          osc.stop(audio.currentTime + 0.8);
        } catch (e) { /* silent fail */ }
        return 0;
      }
      return prev - 1;
    });
  }, [mode, currentMode.duration]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, tick]);

  const start = useCallback(() => {
    if (timeLeft === 0) {
      setTimeLeft(currentMode.duration);
    }
    startTimeRef.current = new Date().toISOString();
    setIsRunning(true);
  }, [timeLeft, currentMode.duration]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(currentMode.duration);
  }, [currentMode.duration]);

  const switchMode = useCallback((newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    mode,
    timeLeft,
    isRunning,
    progress,
    currentMode,
    completedWorkSessions,
    formattedTime: formatTime(timeLeft),
    start,
    pause,
    reset,
    switchMode,
    MODES,
  };
}
