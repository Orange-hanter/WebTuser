import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchEventsBatch } from '@services/eventApi';
import type { Event, EventPreferences, UseInfiniteEventScrollReturn, UseEventNavigationReturn } from '@/types';

/**
 * Хук для управления бесконечной подзагрузкой событий
 * Загружает события порциями и добавляет их в кэш
 */
export const useInfiniteEventScroll = (): UseInfiniteEventScrollReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const isLoadingRef = useRef(false);

  // Загрузка следующей порции событий
  const loadMoreEvents = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchEventsBatch(offset, 5);
      
      if (result.success) {
        setEvents(prev => [...prev, ...result.data]);
        setOffset(prev => prev + result.data.length);
        setHasMore(result.pagination.hasMore);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Error loading events:', err);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [offset, hasMore]);

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
    isLoadingRef.current = false;
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
 * Хук для предпочтений пользователя
 */
export const useEventPreferences = () => {
  const [preferences, setPreferences] = useState<EventPreferences>({
    types: ['Музыка', 'Творчество', 'Общение', 'Искусство', 'Здоровье'],
    distance: 5,
    timeOfDay: 'any'
  });

  const handleSettingsChange = useCallback((key: keyof EventPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  return [preferences, handleSettingsChange] as const;
};

/**
 * Хук для навигации по событиям (работает с массивом событий)
 */
export const useEventNavigation = (events: Event[], onLoadMore?: () => void): UseEventNavigationReturn => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const goToNextEvent = useCallback(() => {
    setCurrentIndex(prev => {
      const nextIndex = prev + 1;
      // Если приближаемся к концу, загружаем еще события
      if (nextIndex >= events.length - 2 && onLoadMore) {
        onLoadMore();
      }
      console.debug('Navigating to event index:', nextIndex, 'of', events.length);
      if (nextIndex >= events.length) {
        console.warn('No more events to navigate to.');
        return prev;
      }
      return nextIndex;
    });
  }, [events.length, onLoadMore]);

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