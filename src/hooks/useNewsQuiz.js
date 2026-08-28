import { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { generateQuizForArticle, answerQuizQuestion } from '../services/newsQuizService';

export function useNewsQuiz() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingArticleUrl, setGeneratingArticleUrl] = useState(null);
  const [error, setError] = useState(null);

  const quizzes = useLiveQuery(
    () => db.newsQuizzes.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const unansweredQuizzes = useMemo(() => {
    return quizzes.filter(q => !q.isFullyAnswered);
  }, [quizzes]);

  const answeredQuizzes = useMemo(() => {
    return quizzes.filter(q => q.isFullyAnswered);
  }, [quizzes]);

  const correctQuizzes = useMemo(() => {
    return quizzes.filter(q => Boolean(q.isCorrect));
  }, [quizzes]);

  // Quick lookup map: articleUrl -> quiz
  const quizByUrl = useMemo(() => {
    const map = new Map();
    for (const q of quizzes) {
      if (q.articleUrl) {
        map.set(q.articleUrl, q);
      }
    }
    return map;
  }, [quizzes]);

  // Total stats across all quizzes
  const totalStats = useMemo(() => {
    let totalAnswered = 0;
    let totalCorrect = 0;
    let totalXp = 0;
    for (const q of quizzes) {
      totalAnswered += q.answeredCount || 0;
      totalCorrect += q.correctCount || 0;
      totalXp += q.xpAwarded || 0;
    }
    return { totalAnswered, totalCorrect, totalXp };
  }, [quizzes]);

  const generateQuiz = useCallback(async (article, category) => {
    if (!article || !article.title) return null;
    
    // If quiz already exists, return it immediately
    const existing = quizByUrl.get(article.link);
    if (existing) {
      return existing;
    }

    setIsGenerating(true);
    setGeneratingArticleUrl(article.link);
    setError(null);

    try {
      const quiz = await generateQuizForArticle(article, category);
      return quiz;
    } catch (err) {
      console.error('Failed to generate news quiz:', err);
      setError(err.message || 'Failed to generate quiz');
      return null;
    } finally {
      setIsGenerating(false);
      setGeneratingArticleUrl(null);
    }
  }, [quizByUrl]);

  const answerQuestion = useCallback(async (quizId, questionIndex, optionIndex) => {
    try {
      const result = await answerQuizQuestion(quizId, questionIndex, optionIndex);
      return result;
    } catch (err) {
      console.error('Failed to answer quiz question:', err);
      throw err;
    }
  }, []);

  return {
    quizzes,
    unansweredQuizzes,
    answeredQuizzes,
    correctQuizzes,
    quizByUrl,
    totalStats,
    quizCount: quizzes.length,
    unansweredCount: unansweredQuizzes.length,
    correctCount: correctQuizzes.length,
    isGenerating,
    generatingArticleUrl,
    error,
    generateQuiz,
    answerQuestion,
  };
}
