import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchEventsBatch, fetchNextDiscoveryEvent, sendDiscoveryAction, bookEvent } from '@services/eventApi';
import type { Event, EventPreferences, UseInfiniteEventScrollReturn, UseEventNavigationReturn } from '@/types';

/**
 * Хук для управления бесконечной подзагрузкой событий
 * Загружает события порциями и добавляет их в кэш
 */
export const useInfiniteEventScroll = (): UseInfiniteEventScrollReturn & { setCategoryFilter: (category: string | null) => void } => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [categoryFilter, setCategoryFilterState] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  // Загрузка следующей порции событий
  const loadMoreEvents = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchEventsBatch(offset, 5, categoryFilter || undefined);
      
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
  }, [offset, hasMore, categoryFilter]);

  const setCategoryFilter = useCallback((category: string | null) => {
    setCategoryFilterState(category);
    setEvents([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    // We need to trigger a reload, but since state updates are async, 
    // we rely on useEffect or manual trigger.
    // Let's use a ref to force reload in the next effect or just reset and let the component call loadMore
  }, []);

  // Effect to reload when filter changes (and events are empty)
  useEffect(() => {
    if (events.length === 0 && hasMore && !isLoadingRef.current) {
      loadMoreEvents();
    }
  }, [events.length, hasMore, loadMoreEvents]);

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
    setCategoryFilterState(null);
    isLoadingRef.current = false;
  }, []);

  return {
    events,
    isLoading,
    error,
    hasMore,
    loadMoreEvents,
    reset,
    setCategoryFilter
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

/**
 * Хук для режима Discovery (очередь событий на сервере)
 * Реализует Dual Discovery Mode Architecture:
 * 1. Queue-Based Discovery (Default) - обычная очередь
 * 2. Expanded Service Discovery (Category seeded) - расширенная очередь по категории
 */
export const useDiscoveryQueue = () => {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [hasNoEvents, setHasNoEvents] = useState(false);
  // Track event IDs that already had an action sent (any action)
  const actionSentRef = useRef<Set<string | number>>(new Set());
  // Track liked event IDs for UI state (to show filled heart)
  const likedEventsRef = useRef<Set<string | number>>(new Set());

  // Загрузка следующего события из очереди (GET /next)
  const fetchNext = useCallback(async (categoryOverride?: string | null) => {
    setIsLoading(true);
    setError(null);
    setHasNoEvents(false);

    try {
      // Если категория передана явно (при инициализации), используем её.
      // Иначе используем сохраненную категорию (режим Expanded) или undefined (режим Default).
      // Note: expandedCategory state might not be updated yet if called immediately after setExpandedCategory
      const categoryToUse = categoryOverride !== undefined ? categoryOverride : expandedCategory;
      
      const event = await fetchNextDiscoveryEvent(categoryToUse);
      console.debug("Fetching next discovery event with category:", event);

      if (event) {
        setCurrentEvent(event);
      } else {
        setCurrentEvent(null);
        setHasNoEvents(true);
      }
    } catch (err: any) {
      console.error('Discovery fetch error:', err);
      // Treat 404 as "no more events" — show empty card instead of error
      if (err.message?.includes('404') || err.status === 404) {
        setCurrentEvent(null);
        setHasNoEvents(true);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to load event'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [expandedCategory]);

  // Инициализация режима (смена категории или сброс)
  const initialize = useCallback((category?: string) => {
    const newCategory = category || null;
    setExpandedCategory(newCategory);
    setCurrentEvent(null);
    setError(null);
    setHasNoEvents(false);
    // Запускаем загрузку с новой категорией (или без неё)
    fetchNext(newCategory);
  }, [fetchNext]);

  // Обработка действий (like, dislike, neutral)
  const handleAction = useCallback(async (action: 'like' | 'dislike' | 'neutral') => {
    if (!currentEvent) return;

    const eventId = currentEvent.id as string | number;
    const alreadySentAction = actionSentRef.current.has(eventId);
    const alreadyLiked = likedEventsRef.current.has(eventId);

    // CASE 1: Like action
    if (action === 'like') {
      if (alreadyLiked) {
        // Already liked — do nothing (no duplicate likes)
        return;
      }
      // Mark as liked for UI
      likedEventsRef.current.add(eventId);

      if (alreadySentAction) {
        // Action was already sent (e.g., skip after like) — don't send again, just update UI
        // But this shouldn't happen for like since we stay on same card
        return;
      }

      // Send like action, stay on current card
      setIsLoading(true);
      actionSentRef.current.add(eventId);

      try {
        await sendDiscoveryAction(currentEvent.id || '', action);
        // Stay on the same card
        setIsLoading(false);
      } catch (err: any) {
        console.error('Action error:', err);
        if (err.message === 'Event unavailable' || err.message?.includes('409') || err.message?.includes('404')) {
          await fetchNext();
        } else {
          setError(err instanceof Error ? err : new Error('Action failed'));
          setIsLoading(false);
        }
      }
      return;
    }

    // CASE 2: Dislike or Skip (neutral)
    // If action was already sent for this event (e.g., we liked it), just move to next without sending
    if (alreadySentAction) {
      // Just move to next card, no API call
      await fetchNext();
      return;
    }

    // First action on this card — send it and move to next
    setIsLoading(true);
    actionSentRef.current.add(eventId);

    try {
      await sendDiscoveryAction(currentEvent.id || '', action);
      await fetchNext();
    } catch (err: any) {
      console.error('Action error:', err);
      
      // Handle 409/404 - treat as stale, reload next
      if (err.message === 'Event unavailable' || err.message?.includes('409') || err.message?.includes('404')) {
        console.warn('Event unavailable, fetching next...');
        await fetchNext();
      } else {
        // Network error or other - show retry
        setError(err instanceof Error ? err : new Error('Action failed'));
        setIsLoading(false); // Stop loading to show error state
      }
    }
  }, [currentEvent, fetchNext]);

  // Обработка бронирования
  const handleBook = useCallback(async () => {
    if (!currentEvent) return;

    setIsLoading(true);

    try {
      await bookEvent(currentEvent.id);
      // On success, fetch next
      await fetchNext();
    } catch (err: any) {
      console.error('Booking error:', err);
      
      if (err.message === 'Event unavailable' || err.message.includes('409') || err.message.includes('404')) {
        console.warn('Event unavailable, fetching next...');
        await fetchNext();
      } else {
        setError(err instanceof Error ? err : new Error('Booking failed'));
        setIsLoading(false);
      }
    }
  }, [currentEvent, fetchNext]);

  // Retry handler
  const retry = useCallback(() => {
    if (error?.message === 'Failed to load event' || !currentEvent) {
      fetchNext();
    } else {
      // Action failed. Clear error so user can try again.
      setError(null);
      setIsLoading(false);
    }
  }, [currentEvent, error, fetchNext]);

  // Initial load
  useEffect(() => {
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    currentEvent,
    isLoading,
    error,
    hasNoEvents,
    expandedCategory,
    initialize,
    handleAction,
    handleBook,
    retry
  };
};