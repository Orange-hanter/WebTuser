import type { LocalPlace, Place } from '../types';

// Импортируем локальный справочник мест
import localPlacesData from '../data/places-brest.json';

const localPlaces: LocalPlace[] = localPlacesData as LocalPlace[];

/**
 * Нормализует строку для поиска: lowercase, убирает лишние пробелы
 */
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Проверяет, содержит ли место совпадение с запросом
 */
function matchesQuery(place: LocalPlace, normalizedQuery: string): boolean {
  // Проверяем название
  if (place.name.toLowerCase().includes(normalizedQuery)) {
    return true;
  }
  
  // Проверяем адрес
  if (place.address.toLowerCase().includes(normalizedQuery)) {
    return true;
  }
  
  // Проверяем алиасы (fuzzy matching через includes)
  for (const alias of place.alias) {
    if (alias.toLowerCase().includes(normalizedQuery) || 
        normalizedQuery.includes(alias.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Вычисляет релевантность совпадения (для сортировки)
 */
function calculateRelevance(place: LocalPlace, normalizedQuery: string): number {
  let score = 0;
  
  // Точное совпадение названия — максимальный приоритет
  if (place.name.toLowerCase() === normalizedQuery) {
    score += 100;
  } else if (place.name.toLowerCase().startsWith(normalizedQuery)) {
    score += 50;
  } else if (place.name.toLowerCase().includes(normalizedQuery)) {
    score += 25;
  }
  
  // Совпадение с алиасом
  for (const alias of place.alias) {
    if (alias.toLowerCase() === normalizedQuery) {
      score += 80;
    } else if (alias.toLowerCase().startsWith(normalizedQuery)) {
      score += 40;
    } else if (alias.toLowerCase().includes(normalizedQuery)) {
      score += 20;
    }
  }
  
  return score;
}

/**
 * Конвертирует LocalPlace в Place
 */
function localToPlace(local: LocalPlace): Place {
  return {
    name: local.name,
    address: local.address,
    lat: local.lat,
    lon: local.lon,
    type: local.type,
    isLocal: true,
  };
}

/**
 * Ищет места в локальном справочнике
 * @param query - поисковый запрос
 * @param limit - максимальное количество результатов
 * @returns массив найденных мест
 */
export function searchLocalPlaces(query: string, limit: number = 5): Place[] {
  if (!query || query.length < 2) {
    return [];
  }
  
  const normalizedQuery = normalizeQuery(query);
  
  // Находим все совпадения
  const matches: Array<{ place: LocalPlace; relevance: number }> = [];
  
  for (const place of localPlaces) {
    if (matchesQuery(place, normalizedQuery)) {
      matches.push({
        place,
        relevance: calculateRelevance(place, normalizedQuery),
      });
    }
  }
  
  // Сортируем по релевантности и возвращаем топ
  return matches
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map(m => localToPlace(m.place));
}

/**
 * Возвращает все локальные места (для оффлайн режима)
 */
export function getAllLocalPlaces(): Place[] {
  return localPlaces.map(localToPlace);
}
