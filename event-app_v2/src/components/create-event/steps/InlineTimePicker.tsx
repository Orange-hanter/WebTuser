import { FC, useRef, TouchEvent } from 'react';
import { Plus, Minus } from 'lucide-react';
import './InlineTimePicker.css';

interface InlineTimePickerProps {
  value: string; // HH:MM
  onChange: (time: string) => void;
}

const PRESET_TIMES = ['10:00', '15:00', '18:00'];

export const InlineTimePicker: FC<InlineTimePickerProps> = ({ value, onChange }) => {
  const parts = value ? value.split(':').map(Number) : [12, 0];
  const hours = parts[0] ?? 12;
  const minutes = parts[1] ?? 0;
  
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const formatTime = (h: number, m: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const adjustHours = (delta: number) => {
    let newHours = hours + delta;
    if (newHours < 0) newHours = 23;
    if (newHours > 23) newHours = 0;
    onChange(formatTime(newHours, minutes));
  };

  const adjustMinutes = (delta: number) => {
    let newMinutes = minutes + delta;
    let newHours = hours;
    
    if (newMinutes < 0) {
      newMinutes = 45;
      newHours = hours - 1;
      if (newHours < 0) newHours = 23;
    }
    if (newMinutes >= 60) {
      newMinutes = 0;
      newHours = hours + 1;
      if (newHours > 23) newHours = 0;
    }
    
    onChange(formatTime(newHours, newMinutes));
  };

  const handleHourTouchStart = (e: TouchEvent) => {
    if (e.touches[0]) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleHourTouchEnd = (e: TouchEvent) => {
    if (!e.changedTouches[0]) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 20) {
      adjustHours(diff > 0 ? 1 : -1);
    }
  };

  const handleMinuteTouchStart = (e: TouchEvent) => {
    if (e.touches[0]) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleMinuteTouchEnd = (e: TouchEvent) => {
    if (!e.changedTouches[0]) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 20) {
      adjustMinutes(diff > 0 ? 15 : -15);
    }
  };

  const selectPreset = (time: string) => {
    onChange(time);
  };

  return (
    <div className="inline-time-picker">
      {/* Preset buttons */}
      <div className="time-presets">
        {PRESET_TIMES.map(time => (
          <button
            key={time}
            type="button"
            className={`time-preset-btn ${value === time ? 'active' : ''}`}
            onClick={() => selectPreset(time)}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Time display with scroll */}
      <div className="time-display">
        <div className="time-column">
          <button 
            type="button" 
            className="time-adjust-btn"
            onClick={() => adjustHours(1)}
          >
            <Plus size={14} />
          </button>
          <div 
            ref={hourRef}
            className="time-value"
            onTouchStart={handleHourTouchStart}
            onTouchEnd={handleHourTouchEnd}
          >
            {String(hours).padStart(2, '0')}
          </div>
          <button 
            type="button" 
            className="time-adjust-btn"
            onClick={() => adjustHours(-1)}
          >
            <Minus size={14} />
          </button>
          <span className="time-label">часы</span>
        </div>

        <div className="time-separator">:</div>

        <div className="time-column">
          <button 
            type="button" 
            className="time-adjust-btn"
            onClick={() => adjustMinutes(15)}
          >
            <Plus size={14} />
          </button>
          <div 
            ref={minuteRef}
            className="time-value"
            onTouchStart={handleMinuteTouchStart}
            onTouchEnd={handleMinuteTouchEnd}
          >
            {String(minutes).padStart(2, '0')}
          </div>
          <button 
            type="button" 
            className="time-adjust-btn"
            onClick={() => adjustMinutes(-15)}
          >
            <Minus size={14} />
          </button>
          <span className="time-label">минуты</span>
        </div>
      </div>

      {/* Quick adjust buttons */}
      <div className="time-quick-adjust">
        <button type="button" className="quick-btn" onClick={() => adjustHours(-1)}>
          −1 час
        </button>
        <button type="button" className="quick-btn" onClick={() => adjustMinutes(-15)}>
          −15 мин
        </button>
        <button type="button" className="quick-btn" onClick={() => adjustMinutes(15)}>
          +15 мин
        </button>
        <button type="button" className="quick-btn" onClick={() => adjustHours(1)}>
          +1 час
        </button>
      </div>
    </div>
  );
};
