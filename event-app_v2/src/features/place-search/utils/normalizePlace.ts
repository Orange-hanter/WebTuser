import type { NominatimResult, Place } from '../types';

/**
 * Нормализует ответ Nominatim API в унифицированный формат Place
 */
export function normalizePlace(raw: NominatimResult): Place {
  const lat = parseFloat(raw.lat);
  const lon = parseFloat(raw.lon);

  // Определяем название места
  let name = raw.name || '';
  const address = raw.address;

  // Если есть конкретное название (amenity, shop, tourism) — используем его
  if (address) {
    if (address.amenity && !name) name = address.amenity;
    else if (address.shop && !name) name = address.shop;
    else if (address.tourism && !name) name = address.tourism;
  }

  // Если названия нет — берём улицу
  if (!name && address?.road) {
    name = address.house_number 
      ? `${address.road}, ${address.house_number}` 
      : address.road;
  }

  // Формируем читаемый адрес
  let formattedAddress = '';
  if (address) {
    const parts: string[] = [];
    
    if (address.road) {
      parts.push(address.house_number 
        ? `${address.road}, ${address.house_number}` 
        : address.road);
    }
    
    if (address.suburb) {
      parts.push(address.suburb);
    }
    
    if (address.city) {
      parts.push(address.city);
    }
    
    formattedAddress = parts.join(', ');
  }

  // Если адрес пустой — используем display_name
  if (!formattedAddress) {
    // Убираем страну и область из display_name для краткости
    const displayParts = raw.display_name.split(', ');
    formattedAddress = displayParts.slice(0, -2).join(', ');
  }

  // Если название всё ещё пустое — берём первую часть display_name
  if (!name) {
    name = raw.display_name.split(', ')[0] || raw.display_name;
  }

  return {
    name,
    address: formattedAddress,
    lat,
    lon,
    osmId: raw.osm_id,
    osmType: raw.osm_type,
    type: raw.type || raw.class,
    isLocal: false,
    raw,
  };
}

/**
 * Валидирует координаты для Беларуси
 * lat: 51-57, lon: 23-33
 */
export function isValidBelarusCoords(lat: number, lon: number): boolean {
  return lat >= 51 && lat <= 57 && lon >= 23 && lon <= 33;
}

/**
 * Форматирует Place для отображения в списке
 */
export function formatPlaceDisplay(place: Place): { primary: string; secondary: string } {
  return {
    primary: place.name,
    secondary: place.address,
  };
}
