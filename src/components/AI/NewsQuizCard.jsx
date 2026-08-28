import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ExternalLink, CheckCircle2, XCircle, Award, Sparkles, HelpCircle, ChevronRight, Trophy } from 'lucide-react';
import db from '../../db/db';
import { answerQuizQuestion } from '../../services/newsQuizService';
import './NewsQuizCard.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const CATEGORY_EMOJIS = {
  politics: '🏛️',
  technology: '💻',
  cinema: '🎬',
  general: '📰',
};

export default function NewsQuizCard({ quiz: initialQuiz, quizId, onAnswered }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(null);
  const [loadError, setLoadError] = useState(false);

  // Live query for reactivity
  const liveQuiz = useLiveQuery(
    async () => {
      try {
        const idToQuery = quizId || initialQuiz?.id;
        if (!idToQuery) return null;
        const numId = Number(idToQuery);
        if (isNaN(numId)) return null;
        return await db.newsQuizzes.get(numId);
      } catch (err) {
        console.error('Failed to load quiz:', err);
        setLoadError(true);
        return null;
      }
    },
    [quizId, initialQuiz?.id]
  );

  const quiz = liveQuiz || initialQuiz;

  // Derive all quiz data (safe even when quiz is null)
  const questions = quiz?.questions || [];
  const totalQuestions = questions.length;
  const answeredCount = questions.filter(q => q.isAnswered).length;
  const correctCount = questions.filter(q => q.isCorrect).length;
  const isFullyAnswered = totalQuestions > 0 && answeredCount >= totalQuestions;

  const activeIdx = currentQuestionIdx !== null
    ? currentQuestionIdx
    : questions.findIndex(q => !q.isAnswered);
  const displayIdx = activeIdx >= 0 ? activeIdx : Math.max(totalQuestions - 1, 0);
  const currentQ = questions[displayIdx] || null;

  // ALL hooks must be declared before any early returns
  const handleSelectOption = useCallback(async (optionIndex) => {
    if (!currentQ || currentQ.isAnswered || isSubmitting || !quiz) return;

    setIsSubmitting(true);
    try {
      const result = await answerQuizQuestion(quiz.id, displayIdx, optionIndex);

      if (onAnswered) onAnswered(result);

      // Auto-advance to next question after a brief pause
      if (!result.isFullyAnswered) {
        setTimeout(() => {
          setCurrentQuestionIdx(null);
        }, 1500);
      }
    } catch (err) {
      console.error('Error answering quiz question:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQ, isSubmitting, quiz, displayIdx, onAnswered]);

  const goToQuestion = useCallback((idx) => {
    setCurrentQuestionIdx(idx);
  }, []);

  // ── Early returns AFTER all hooks ────────────────────────────
  if (loadError) {
    return (
      <div className="news-quiz-card glass-card empty">
        <div className="news-quiz-loading">
          <span>⚠️ Could not load quiz.</span>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="news-quiz-card glass-card empty">
        <div className="news-quiz-loading">
          <HelpCircle size={18} className="animate-spin" />
          <span>Loading quiz...</span>
        </div>
      </div>
    );
  }

  const categoryEmoji = CATEGORY_EMOJIS[quiz.category?.toLowerCase()] || '📰';
  const maxXp = totalQuestions * 10;
  const earnedXp = correctCount * 10;

  return (
    <div className={`news-quiz-card glass-card ${isFullyAnswered ? 'quiz-completed' : ''}`}>
      {/* Header */}
      <div className="news-quiz-header">
        <div className="news-quiz-tag">
          <span className="news-quiz-cat-emoji">{categoryEmoji}</span>
          <span className="news-quiz-cat-name">{quiz.category || 'News'}</span>
        </div>
        <div className="news-quiz-bounty">
          <Sparkles size={13} />
          <span>{isFullyAnswered ? `${earnedXp}/${maxXp} XP` : `Up to +${maxXp} XP`}</span>
        </div>
      </div>

      {/* Article Reference */}
      <div className="news-quiz-article-ref">
        <span className="news-quiz-ref-label">Article:</span>
        <a
          href={quiz.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="news-quiz-article-link"
          title={quiz.articleTitle}
        >
          <span>{quiz.articleTitle}</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Progress Bar */}
      <div className="news-quiz-progress">
        <div className="news-quiz-progress-bar">
          <div
            className="news-quiz-progress-fill"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
        <div className="news-quiz-progress-label">
          {answeredCount}/{totalQuestions} answered • {correctCount} correct
        </div>
      </div>

      {/* Question Navigation Dots */}
      <div className="news-quiz-dots">
        {questions.map((q, idx) => (
          <button
            key={idx}
            className={`quiz-dot ${idx === displayIdx ? 'active' : ''} ${q.isAnswered ? (q.isCorrect ? 'correct' : 'wrong') : ''}`}
            onClick={() => goToQuestion(idx)}
            title={`Question ${idx + 1}`}
          >
            {q.isAnswered ? (q.isCorrect ? '✓' : '✗') : idx + 1}
          </button>
        ))}
      </div>

      {/* Current Question */}
      {currentQ && (
        <div className="news-quiz-question-block fade-in" key={`q-${displayIdx}`}>
          <div className="news-quiz-question">
            <span className="news-quiz-q-number">Q{displayIdx + 1}</span>
            <div className="news-quiz-q-text">{currentQ.question}</div>
            <span className="news-quiz-q-xp">+10 XP</span>
          </div>

          {/* Options */}
          <div className="news-quiz-options">
            {currentQ.options?.map((option, idx) => {
              let optionClass = 'news-quiz-option';
              let icon = null;

              if (currentQ.isAnswered) {
                if (idx === currentQ.correctAnswerIndex) {
                  optionClass += ' correct';
                  icon = <CheckCircle2 size={16} className="opt-status-icon correct" />;
                } else if (idx === currentQ.userAnswerIndex) {
                  optionClass += ' wrong';
                  icon = <XCircle size={16} className="opt-status-icon wrong" />;
                } else {
                  optionClass += ' dimmed';
                }
              }

              return (
                <button
                  key={idx}
                  className={optionClass}
                  onClick={() => handleSelectOption(idx)}
                  disabled={currentQ.isAnswered || isSubmitting}
                >
                  <div className="news-quiz-opt-badge">{OPTION_LETTERS[idx]}</div>
                  <div className="news-quiz-opt-text">{option}</div>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Per-question Feedback */}
          {currentQ.isAnswered && (
            <div className="news-quiz-q-feedback fade-in">
              <div className={`news-quiz-q-result ${currentQ.isCorrect ? 'correct' : 'incorrect'}`}>
                {currentQ.isCorrect ? (
                  <>
                    <Award size={15} />
                    <span><strong>Correct!</strong> +10 XP earned</span>
                  </>
                ) : (
                  <>
                    <XCircle size={15} />
                    <span><strong>Not quite.</strong> Answer was <strong>{OPTION_LETTERS[currentQ.correctAnswerIndex]}</strong></span>
                  </>
                )}
              </div>
              {currentQ.explanation && (
                <div className="news-quiz-q-explanation">
                  <span>💡</span> {currentQ.explanation}
                </div>
              )}
              {!isFullyAnswered && displayIdx < totalQuestions - 1 && (
                <button
                  className="news-quiz-next-btn"
                  onClick={() => setCurrentQuestionIdx(null)}
                >
                  Next Question <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Final Summary — shown when all 5 are done */}
      {isFullyAnswered && (
        <div className="news-quiz-summary fade-in">
          <div className="news-quiz-summary-header">
            <Trophy size={20} />
            <span>Quiz Complete!</span>
          </div>
          <div className="news-quiz-summary-stats">
            <div className="nqs-stat">
              <span className="nqs-stat-value">{correctCount}/{totalQuestions}</span>
              <span className="nqs-stat-label">Correct</span>
            </div>
            <div className="nqs-stat highlight">
              <span className="nqs-stat-value">+{earnedXp}</span>
              <span className="nqs-stat-label">XP Earned</span>
            </div>
            <div className="nqs-stat">
              <span className="nqs-stat-value">{Math.round((correctCount / totalQuestions) * 100)}%</span>
              <span className="nqs-stat-label">Accuracy</span>
            </div>
          </div>
          {quiz.keyTakeaways && (
            <div className="news-quiz-summary-takeaway">
              <strong>Key Takeaways:</strong> {quiz.keyTakeaways}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
