import { FC } from 'react';
import { X } from 'lucide-react';
import type { EventPreferences } from '@/types';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: EventPreferences;
  onSettingsChange: (key: keyof EventPreferences, value: any) => void;
}

const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose, preferences, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      onSettingsChange('types', [...preferences.types, type]);
    } else {
      onSettingsChange('types', preferences.types.filter((t: string) => t !== type));
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal-content">
        <div className="settings-modal-body">
          <div className="settings-modal-header">
            <h2 className="settings-modal-title">Настройки</h2>
            <button 
              onClick={onClose}
              className="settings-modal-close-button"
              aria-label="Закрыть"
            >
              <X className="settings-modal-close-icon" />
            </button>
          </div>

          <div className="settings-sections">
            <div>
              <label className="settings-section-title">Типы мероприятий</label>
              <div className="settings-checkboxes">
                {['Музыка', 'Творчество', 'Общение', 'Искусство', 'Здоровье'].map((type) => (
                  <label key={type} className="settings-checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.types.includes(type)}
                      onChange={(e) => handleTypeChange(type, e.target.checked)}
                      className="settings-checkbox-input"
                    />
                    <span className="settings-checkbox-text">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="settings-range-label">
                Радиус поиска: {preferences.distance} км
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={preferences.distance}
                onChange={(e) => onSettingsChange('distance', parseInt(e.target.value))}
                className="settings-range-input"
              />
            </div>

            <div>
              <label className="settings-section-title">Время суток</label>
              <select
                value={preferences.timeOfDay}
                onChange={(e) => onSettingsChange('timeOfDay', e.target.value)}
                className="settings-select"
              >
                <option value="any">Любое время</option>
                <option value="morning">Утро (6:00-12:00)</option>
                <option value="afternoon">День (12:00-18:00)</option>
                <option value="evening">Вечер (18:00-24:00)</option>
              </select>
            </div>
          </div>

          <button
            onClick={onClose}
            className="settings-submit-button"
          >
            Применить настройки
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;