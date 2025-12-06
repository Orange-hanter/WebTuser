import { useState, useEffect, useCallback, useRef } from 'react';
import type { Place, NominatimResult, UsePlaceSearchReturn, CacheEntry } from '../types';
import { normalizePlace } from '../utils/normalizePlace';
import { searchLocalPlaces } from '../utils/searchLocalPlaces';

const CACHE_KEY = 'place-search-cache-v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа
const DEBOUNCE_DELAY = 350; // мс
const MIN_QUERY_LENGTH = 2;
const API_BASE = 'https://nominatim.openstreetmap.org/search';

// In-memory кэш
const memoryCache = new Map<string, CacheEntry>();

/**
 * Загружает кэш из localStorage
 */
function loadCache(): void {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const entries: CacheEntry[] = JSON.parse(stored);
      const now = Date.now();
      
      for (const entry of entries) {
        // Пропускаем устаревшие записи
        if (now - entry.timestamp < CACHE_TTL) {
          memoryCache.set(entry.query.toLowerCase(), entry);
        }
      }
    }
  } catch {
    // Игнорируем ошибки localStorage
  }
}

/**
 * Сохраняет кэш в localStorage
 */
function saveCache(): void {
  try {
    const entries = Array.from(memoryCache.values());
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Игнорируем ошибки localStorage
  }
}

/**
 * Добавляет запись в кэш
 */
function addToCache(query: string, results: Place[]): void {
  const entry: CacheEntry = {
    query: query.toLowerCase(),
    results,
    timestamp: Date.now(),
  };
  memoryCache.set(entry.query, entry);
  saveCache();
}

/**
 * Получает запись из кэша
 */
function getFromCache(query: string): Place[] | null {
  const entry = memoryCache.get(query.toLowerCase());
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.results;
  }
  return null;
}

// Загружаем кэш при инициализации модуля
loadCache();

/**
 * Хук для поиска мест с использованием OpenStreetMap Nominatim API
 */
export function usePlaceSearch(): UsePlaceSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [manualMode, setManualMode] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Выполняет поиск через Nominatim API
   */
  const searchNominatim = useCallback(async (searchQuery: string, signal: AbortSignal): Promise<Place[]> => {
    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'by',
      'accept-language': 'ru',
    });

    const response = await fetch(`${API_BASE}?${params}`, {
      signal,
      headers: {
        'User-Agent': 'EventApp/1.0 (contact@example.com)',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Слишком много запросов. Подождите немного.');
      }
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();
    return data.map(normalizePlace);
  }, []);

  /**
   * Основная функция поиска
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmedQuery = searchQuery.trim();
    
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Ищем в локальном справочнике
    const localResults = searchLocalPlaces(trimmedQuery, 3);
    
    // 2. Проверяем кэш
    const cachedResults = getFromCache(trimmedQuery);
    if (cachedResults) {
      // Комбинируем локальные и закэшированные результаты
      const combined = [...localResults];
      for (const cached of cachedResults) {
        if (!combined.some(r => r.lat === cached.lat && r.lon === cached.lon)) {
          combined.push(cached);
        }
      }
      setResults(combined.slice(0, 7));
      setLoading(false);
      return;
    }

    // 3. Запрос к Nominatim API
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const apiResults = await searchNominatim(trimmedQuery, controller.signal);
      
      // Кэшируем результаты API
      addToCache(trimmedQuery, apiResults);

      // Комбинируем: локальные в начале
      const combined = [...localResults];
      for (const apiResult of apiResults) {
        if (!combined.some(r => r.lat === apiResult.lat && r.lon === apiResult.lon)) {
          combined.push(apiResult);
        }
      }

      setResults(combined.slice(0, 7));
      setManualMode(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Запрос отменён — игнорируем
      }

      console.error('Place search error:', err);
      
      // При ошибке показываем локальные результаты и включаем ручной режим
      setResults(localResults);
      setError('Нет соединения. Введите адрес вручную.');
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  }, [searchNominatim]);

  /**
   * Обработчик изменения запроса с debounce
   */
  const onQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedPlace(null);

    // Очищаем предыдущий таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Устанавливаем новый таймер
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, DEBOUNCE_DELAY);
  }, [performSearch]);

  /**
   * Выбор места
   */
  const select = useCallback((place: Place) => {
    setSelectedPlace(place);
    setQuery(place.name);
    setResults([]);
    setError(null);
  }, []);

  /**
   * Очистка выбора
   */
  const clear = useCallback(() => {
    setQuery('');
    setSelectedPlace(null);
    setResults([]);
    setError(null);
    setManualMode(false);
  }, []);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    onQueryChange,
    results,
    loading,
    error,
    select,
    selectedPlace,
    clear,
    manualMode,
  };
}
