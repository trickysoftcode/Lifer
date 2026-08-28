import { useState, useEffect, useCallback } from 'react';
import { fetchNewsByCategory, getReadingRecommendations, getRandomTrivia } from '../services/newsService';

export function useNews() {
  const [activeCategory, setActiveCategory] = useState('politics');
  const [articles, setArticles] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trivia, setTrivia] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [triviaTrigger, setTriviaTrigger] = useState(0);

  const fetchNewsData = useCallback(async (category) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, isOffline, error } = await fetchNewsByCategory(category);
      if (error) {
        setError(error);
      }
      setArticles(data || []);
      setIsOffline(isOffline);
      setRecommendations(getReadingRecommendations(category));
      setTrivia(getRandomTrivia(category));
    } catch (err) {
      setError(err.message || 'An error occurred');
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewsData(activeCategory);
  }, [activeCategory, fetchNewsData]);

  // Handle trivia auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTriviaTrigger(prev => prev + 1);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Update trivia when category or trigger changes
  useEffect(() => {
    setTrivia(getRandomTrivia(activeCategory));
  }, [activeCategory, triviaTrigger]);

  const refresh = useCallback(() => {
    fetchNewsData(activeCategory);
  }, [activeCategory, fetchNewsData]);

  return {
    activeCategory,
    setActiveCategory,
    articles,
    recommendations,
    trivia,
    isLoading,
    error,
    isOffline,
    refresh
  };
}
