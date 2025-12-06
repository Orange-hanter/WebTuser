import { FC, useState, useCallback } from 'react';
import { PlaceSearch, type Place } from '@/features/place-search';
import type { CreateEventData } from '@/types';

interface StepLocationPriceProps {
  data: CreateEventData;
  onUpdate: (field: keyof CreateEventData, value: any) => void;
}

export const StepLocationPrice: FC<StepLocationPriceProps> = ({ data, onUpdate }) => {
  // Инициализируем selectedPlace из существующих данных
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(() => {
    if (data.location && data.locationLat && data.locationLon) {
      return {
        name: data.location,
        address: data.location,
        lat: data.locationLat,
        lon: data.locationLon,
      };
    }
    return null;
  });

  const handlePlaceChange = useCallback((place: Place | null) => {
    setSelectedPlace(place);
    if (place) {
      onUpdate('location', place.name + (place.address !== place.name ? `, ${place.address}` : ''));
      onUpdate('locationLat', place.lat);
      onUpdate('locationLon', place.lon);
    } else {
      onUpdate('location', '');
      onUpdate('locationLat', undefined);
      onUpdate('locationLon', undefined);
    }
  }, [onUpdate]);

  const handleManualInput = useCallback((address: string) => {
    onUpdate('location', address);
    onUpdate('locationLat', undefined);
    onUpdate('locationLon', undefined);
  }, [onUpdate]);

  return (
    <div>
      <h2 className="wizard-step-title">Место и условия</h2>
      
      <div className="form-field">
        <label className="form-label">Место проведения</label>
        <PlaceSearch
          value={selectedPlace}
          onChange={handlePlaceChange}
          onManualInput={handleManualInput}
          placeholder="Например: Арбат, кафе Богема, ТЦ Корона"
          showCoords
        />
      </div>

      <div className="form-field">
        <label className="form-label">Контакты организатора</label>
        <input
          type="text"
          className="form-input"
          value={data.organizerContact}
          onChange={e => onUpdate('organizerContact', e.target.value)}
          placeholder="Телефон или Telegram"
        />
      </div>
      
      <div className="form-field">
        <label className="form-label">Условия входа</label>
        <select 
          className="form-select"
          value={data.priceType}
          onChange={e => onUpdate('priceType', e.target.value)}
        >
          <option value="free">Бесплатно</option>
          <option value="paid">Платное</option>
          <option value="donation">Donation (добровольный взнос)</option>
        </select>
      </div>

      {data.priceType === 'paid' && (
        <div className="form-field">
          <label className="form-label">Стоимость</label>
          <input
            type="text"
            className="form-input"
            value={data.price || ''}
            onChange={e => onUpdate('price', e.target.value)}
            placeholder="Например: 500 руб."
          />
        </div>
      )}

      <div className="form-field checkbox-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={data.needReg}
            onChange={e => onUpdate('needReg', e.target.checked)}
            className="checkbox-input"
          />
          <span>Требуется предварительная регистрация</span>
        </label>
      </div>
    </div>
  );
};
