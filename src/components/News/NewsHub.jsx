import { useState, useEffect } from 'react';
import { useNews } from '../../hooks/useNews';
import { useNewsQuiz } from '../../hooks/useNewsQuiz';
import { Sparkles, ExternalLink, Award, HelpCircle } from 'lucide-react';
import './News.css';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const CATEGORIES = [
  { id: 'politics', label: '🏛️ Politics' },
  { id: 'technology', label: '💻 Technology' },
  { id: 'cinema', label: '🎬 Cinema' }
];

export default function NewsHub() {
  const {
    activeCategory,
    setActiveCategory,
    articles,
    recommendations,
    trivia,
    isLoading,
    error,
    isOffline,
    refresh
  } = useNews();

  const { quizByUrl, generateQuiz, generatingArticleUrl } = useNewsQuiz();
  const [toastMsg, setToastMsg] = useState(null);
  const [triviaAnimClass, setTriviaAnimClass] = useState('fade-in');
  
  // Animate trivia changes
  useEffect(() => {
    setTriviaAnimClass('');
    const timer = setTimeout(() => {
      setTriviaAnimClass('fade-in');
    }, 50);
    return () => clearTimeout(timer);
  }, [trivia]);

  const handleArticleClick = (article) => {
    // Generate the quiz in background as the article opens
    generateQuiz(article, activeCategory).then((quiz) => {
      if (quiz) {
        setToastMsg(`✨ AI read "${article.title.slice(0, 38)}..." and created a 5-question quiz! Open Lifer AI to earn up to +50 XP.`);
        setTimeout(() => setToastMsg(null), 7000);
      }
    });
  };

  return (
    <div className="glass-card news-hub" id="news-hub">
      <div className="news-header">
        <div className="news-title">
          <span>📰 News Hub</span>
          <span className="news-ai-badge" title="AI reads every opened article and creates a quiz for you!">
            <Sparkles size={11} /> AI Quizzes
          </span>
        </div>
        <div className="news-header-actions">
          {isOffline && <span className="news-offline-badge">Offline Mode</span>}
          <button 
            className="refresh-btn" 
            onClick={refresh}
            disabled={isLoading}
            title="Refresh News"
          >
            🔄
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="news-toast fade-in">
          <div className="news-toast-text">{toastMsg}</div>
          <button className="news-toast-close" onClick={() => setToastMsg(null)}>✕</button>
        </div>
      )}

      <div className="tab-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`tab-item ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="news-content">
        <div className="news-articles">
          {isLoading ? (
            <div className="news-loading">
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
            </div>
          ) : articles.length > 0 ? (
            articles.map((article, idx) => {
              const quiz = quizByUrl.get(article.link);
              const isGeneratingThis = generatingArticleUrl === article.link;

              return (
                <div key={idx} className="news-article">
                  <div className="news-article-top-row">
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="news-article-title"
                      onClick={() => handleArticleClick(article)}
                    >
                      {article.title}
                      <ExternalLink size={12} className="news-article-ext-icon" />
                    </a>
                  </div>
                  
                  <div className="news-article-meta-row">
                    <div className="news-article-meta">
                      {article.source} • {formatTimeAgo(article.pubDate)}
                    </div>

                    <div className="news-article-quiz-status">
                      {isGeneratingThis ? (
                        <span className="quiz-pill generating">
                          <span className="quiz-pulse-dot" /> AI Reading & Prep...
                        </span>
                      ) : quiz ? (
                        quiz.isFullyAnswered ? (
                          <span className={`quiz-pill ${quiz.correctCount > 0 ? 'correct' : 'attempted'}`}>
                            <Award size={11} /> {quiz.correctCount}/{quiz.totalQuestions} correct (+{quiz.xpAwarded || 0} XP)
                          </span>
                        ) : quiz.answeredCount > 0 ? (
                          <span className="quiz-pill ready">
                            <Sparkles size={11} /> {quiz.answeredCount}/{quiz.totalQuestions} done — continue in AI Chat
                          </span>
                        ) : (
                          <span className="quiz-pill ready">
                            <Sparkles size={11} /> 5-Q Quiz in AI Chat (up to +50 XP)
                          </span>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="news-empty">
              {error ? 'Failed to load news.' : 'No news found.'}
            </div>
          )}
        </div>

        <div className="news-recommendations-section">
          <h4 className="news-section-subtitle">📚 Reading Corner</h4>
          <div className="news-recommendations">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div key={idx} className="news-rec-card glass-card">
                <span className="news-rec-emoji">{rec.emoji}</span>
                <div className="news-rec-content">
                  <div className="news-rec-title">{rec.title}</div>
                  <div className="news-rec-author">by {rec.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="news-trivia">
        <span className="news-trivia-icon">💡</span>
        <span className={`news-trivia-text ${triviaAnimClass}`}>
          {trivia}
        </span>
      </div>
    </div>
  );
}

