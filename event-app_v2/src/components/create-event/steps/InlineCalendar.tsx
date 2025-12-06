import { FC, useState, useRef, TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './InlineCalendar.css';

interface InlineCalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const InlineCalendar: FC<InlineCalendarProps> = ({ value, onChange, minDate }) => {
  const selectedDate = value ? new Date(value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const minDateObj = minDate ? new Date(minDate) : today;
  minDateObj.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    return selectedDate || new Date();
  });

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = e.touches[0].clientX;
      isSwiping.current = false;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches[0]) {
      touchEndX.current = e.touches[0].clientX;
      // Mark as swiping if moved more than 10px
      if (Math.abs(touchStartX.current - touchEndX.current) > 10) {
        isSwiping.current = true;
      }
    }
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    // Only trigger swipe if actually moved significantly
    if (isSwiping.current && Math.abs(diff) > 50) {
      if (diff > 0) {
        nextMonth();
      } else {
        prevMonth();
      }
    }
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
    isSwiping.current = false;
  };

  const prevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Понедельник = 0
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (newDate >= minDateObj) {
      const yyyy = newDate.getFullYear();
      const mm = String(newDate.getMonth() + 1).padStart(2, '0');
      const dd = String(newDate.getDate()).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewDate.getMonth() &&
      selectedDate.getFullYear() === viewDate.getFullYear()
    );
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  };

  const isDisabled = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return date < minDateObj;
  };

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDay = getFirstDayOfMonth(viewDate);

  const canGoPrev = () => {
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0);
    return prevMonth >= minDateObj;
  };

  return (
    <div 
      className="inline-calendar"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="calendar-header">
        <button 
          type="button"
          className="calendar-nav-btn"
          onClick={prevMonth}
          disabled={!canGoPrev()}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="calendar-month-year">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button 
          type="button"
          className="calendar-nav-btn"
          onClick={nextMonth}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-days">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day empty" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const disabled = isDisabled(day);
          return (
            <button
              key={day}
              type="button"
              className={`calendar-day ${isSelected(day) ? 'selected' : ''} ${isToday(day) ? 'today' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && handleSelectDate(day)}
              disabled={disabled}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
