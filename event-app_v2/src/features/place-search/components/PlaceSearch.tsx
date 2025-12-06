import { FC, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { MapPin, Search, X, Home, Loader2 } from 'lucide-react';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import type { Place } from '../types';
import './PlaceSearch.css';

interface PlaceSearchProps {
  /** Текущее выбранное место */
  value: Place | null;
  /** Callback при изменении выбранного места */
  onChange: (place: Place | null) => void;
  /** Placeholder для поля ввода */
  placeholder?: string;
  /** Callback для ручного ввода (при ошибке сети) */
  onManualInput?: (address: string) => void;
  /** Показывать координаты после выбора */
  showCoords?: boolean;
}

export const PlaceSearch: FC<PlaceSearchProps> = ({
  value,
  onChange,
  placeholder = 'Например: Арбат, Брест или кафе Богема',
  onManualInput,
  showCoords = false,
}) => {
  const {
    query,
    onQueryChange,
    results,
    loading,
    error,
    select,
    selectedPlace,
    clear,
    manualMode,
  } = usePlaceSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Синхронизация с внешним value
  useEffect(() => {
    if (value && !selectedPlace) {
      onQueryChange(value.name);
      select(value);
    }
  }, []);

  // Обновляем внешний state при выборе
  useEffect(() => {
    if (selectedPlace) {
      onChange(selectedPlace);
    }
  }, [selectedPlace, onChange]);

  // Открываем список при наличии результатов
  useEffect(() => {
    setIsOpen(results.length > 0);
    setActiveIndex(-1);
  }, [results]);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Прокрутка к активному элементу
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onQueryChange(newValue);
    
    // Если есть выбранное место и пользователь редактирует — сбрасываем
    if (selectedPlace && newValue !== selectedPlace.name) {
      onChange(null);
    }
  };

  const handleSelect = (place: Place) => {
    select(place);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    clear();
    onChange(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          handleSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleManualSubmit = () => {
    if (manualMode && query.trim() && onManualInput) {
      onManualInput(query.trim());
    }
  };

  const listId = 'place-search-listbox';

  return (
    <div className="place-search" ref={containerRef}>
      <div className="place-search-input-wrapper">
        <Search className="place-search-icon" size={18} />
        <input
          ref={inputRef}
          type="text"
          className="place-search-input"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `place-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
        {loading && (
          <Loader2 className="place-search-spinner" size={18} />
        )}
        {query && !loading && (
          <button
            type="button"
            className="place-search-clear"
            onClick={handleClear}
            aria-label="Очистить"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Выпадающий список результатов */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          className="place-search-results"
          role="listbox"
          aria-label="Результаты поиска мест"
        >
          {results.map((place, index) => (
            <li
              key={`${place.lat}-${place.lon}-${index}`}
              id={`place-option-${index}`}
              className={`place-search-item ${index === activeIndex ? 'active' : ''}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => handleSelect(place)}
            >
              <span className="place-item-icon">
                {place.isLocal ? <Home size={16} /> : <MapPin size={16} />}
              </span>
              <span className="place-item-content">
                <span className="place-item-name">{place.name}</span>
                <span className="place-item-address">{place.address}</span>
              </span>
              {place.isLocal && (
                <span className="place-item-badge">🏠</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="place-search-error">
          <span>{error}</span>
          {manualMode && onManualInput && (
            <button
              type="button"
              className="place-search-manual-btn"
              onClick={handleManualSubmit}
            >
              Использовать как есть
            </button>
          )}
        </div>
      )}

      {/* Информация о выбранном месте */}
      {selectedPlace && showCoords && (
        <div className="place-search-selected">
          <MapPin size={14} />
          <span>
            {selectedPlace.lat.toFixed(5)}, {selectedPlace.lon.toFixed(5)}
          </span>
        </div>
      )}

      {/* Подсказка о клавиатурной навигации */}
      {isOpen && results.length > 0 && (
        <div className="place-search-hint" aria-hidden="true">
          ↑↓ навигация • Enter выбор • Esc закрыть
        </div>
      )}
    </div>
  );
};
