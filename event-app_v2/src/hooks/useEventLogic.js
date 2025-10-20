import { useState, useCallback, useEffect } from 'react';
import { fetchEventsBatch } from '../services/eventApi';

/**
 * Хук для управления бесконечной подзагрузкой событий
 * Загружает события порциями и добавляет их в кэш
 */
export const useInfiniteEventScroll = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Загрузка следующей порции событий
  const loadMoreEvents = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchEventsBatch(offset, 5);
      
      if (result.success) {
        setEvents(prev => [...prev, ...result.data]);
        setOffset(prev => prev + 5);
        setHasMore(result.pagination.hasMore);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [offset, isLoading, hasMore]);

  // Загрузить первую порцию событий при монтировании
  useEffect(() => {
    if (events.length === 0) {
      loadMoreEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сброс к началу
  const reset = useCallback(() => {
    setEvents([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    events,
    isLoading,
    error,
    hasMore,
    loadMoreEvents,
    reset
  };
};

/**
 * Старый хук для предпочтений
 */
export const useEventPreferences = () => {
  const [preferences, setPreferences] = useState({
    types: ['Музыка', 'Творчество', 'Общение', 'Искусство', 'Здоровье'],
    distance: 5,
    timeOfDay: 'any'
  });

  const handleSettingsChange = useCallback((key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  return [preferences, handleSettingsChange];
};

/**
 * Хук для навигации по событиям (работает с массивом событий)
 */
export const useEventNavigation = (events) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const goToNextEvent = useCallback(() => {
    setCurrentIndex(prev => {
      const nextIndex = prev + 1;
      // Если приближаемся к концу, загружаем еще события
      if (nextIndex >= events.length - 2) {
        window.dispatchEvent(new CustomEvent('loadMoreEvents'));
      }
      return nextIndex < events.length ? nextIndex : prev;
    });
  }, [events.length]);

  const resetToStart = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  return { 
    currentIndex, 
    currentEvent: events[currentIndex], 
    goToNextEvent, 
    resetToStart,
    totalEvents: events.length
  };
};