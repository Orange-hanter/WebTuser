/**
 * Типы для поиска мест на основе OpenStreetMap Nominatim API
 */

export interface Place {
  /** Название места (кафе, магазин, достопримечательность) */
  name: string;
  /** Полный адрес */
  address: string;
  /** Широта */
  lat: number;
  /** Долгота */
  lon: number;
  /** OSM ID для ссылки */
  osmId?: number;
  /** OSM type (node, way, relation) */
  osmType?: string;
  /** Тип места (cafe, shop, landmark и т.д.) */
  type?: string;
  /** Флаг локального места (из справочника) */
  isLocal?: boolean;
  /** Сырые данные от API (для отладки) */
  raw?: NominatimResult;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: string[];
  address?: NominatimAddress;
}

export interface NominatimAddress {
  amenity?: string;
  shop?: string;
  tourism?: string;
  road?: string;
  house_number?: string;
  suburb?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

export interface LocalPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  type: string;
  alias: string[];
}

export interface CacheEntry {
  query: string;
  results: Place[];
  timestamp: number;
}

export interface UsePlaceSearchReturn {
  /** Текущий поисковый запрос */
  query: string;
  /** Обновить запрос */
  onQueryChange: (q: string) => void;
  /** Результаты поиска */
  results: Place[];
  /** Загрузка данных */
  loading: boolean;
  /** Текст ошибки */
  error: string | null;
  /** Выбрать место */
  select: (place: Place) => void;
  /** Выбранное место */
  selectedPlace: Place | null;
  /** Очистить выбор */
  clear: () => void;
  /** Режим ручного ввода (при ошибке сети) */
  manualMode: boolean;
}
