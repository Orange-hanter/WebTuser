import { FC } from 'react';
import { Plus, Minus } from 'lucide-react';
import './DurationPicker.css';

interface DurationPickerProps {
  value: number;
  onChange: (duration: number) => void;
  min?: number;
}

const PRESET_DURATIONS = [30, 60, 90, 120];

export const DurationPicker: FC<DurationPickerProps> = ({ 
  value, 
  onChange, 
  min = 30 
}) => {
  const adjustDuration = (delta: number) => {
    const newValue = value + delta;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const selectPreset = (duration: number) => {
    onChange(duration);
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} мин`;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (minutes === 0) return `${hours} ч`;
    return `${hours} ч ${minutes} мин`;
  };

  return (
    <div className="duration-picker">
      {/* Preset buttons */}
      <div className="duration-presets">
        {PRESET_DURATIONS.map(duration => (
          <button
            key={duration}
            type="button"
            className={`duration-preset-btn ${value === duration ? 'active' : ''}`}
            onClick={() => selectPreset(duration)}
          >
            {formatDuration(duration)}
          </button>
        ))}
      </div>

      {/* Duration display */}
      <div className="duration-display">
        <button 
          type="button" 
          className="duration-adjust-btn large"
          onClick={() => adjustDuration(-15)}
          disabled={value <= min}
        >
          <Minus size={16} />
          <span>15</span>
        </button>

        <div className="duration-value">
          <span className="duration-number">{value}</span>
          <span className="duration-unit">минут</span>
        </div>

        <button 
          type="button" 
          className="duration-adjust-btn large"
          onClick={() => adjustDuration(15)}
        >
          <Plus size={16} />
          <span>15</span>
        </button>
      </div>

      {/* Visual time representation */}
      <div className="duration-visual">
        <div 
          className="duration-bar" 
          style={{ width: `${Math.min((value / 180) * 100, 100)}%` }}
        />
        <div className="duration-markers">
          <span>30м</span>
          <span>1ч</span>
          <span>1.5ч</span>
          <span>2ч</span>
          <span>3ч</span>
        </div>
      </div>
    </div>
  );
};
