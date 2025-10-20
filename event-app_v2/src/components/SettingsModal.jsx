import React from 'react';
import { X } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, preferences, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleTypeChange = (type, checked) => {
    if (checked) {
      onSettingsChange('types', [...preferences.types, type]);
    } else {
      onSettingsChange('types', preferences.types.filter(t => t !== type));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Настройки</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Типы мероприятий</label>
              <div className="grid grid-cols-2 gap-2">
                {['Музыка', 'Творчество', 'Общение', 'Искусство', 'Здоровье'].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.types.includes(type)}
                      onChange={(e) => handleTypeChange(type, e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Радиус поиска: {preferences.distance} км
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={preferences.distance}
                onChange={(e) => onSettingsChange('distance', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Время суток</label>
              <select
                value={preferences.timeOfDay}
                onChange={(e) => onSettingsChange('timeOfDay', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl"
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
            className="w-full mt-8 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
          >
            Применить настройки
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;