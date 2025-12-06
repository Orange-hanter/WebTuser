import { FC } from 'react';
import type { CreateEventData } from '@/types';
import { InlineCalendar } from './InlineCalendar';
import { InlineTimePicker } from './InlineTimePicker';
import { DurationPicker } from './DurationPicker';

interface StepDateTimeProps {
  data: CreateEventData;
  onUpdate: (field: keyof CreateEventData, value: any) => void;
}

export const StepDateTime: FC<StepDateTimeProps> = ({ data, onUpdate }) => {
  // Get today's date in YYYY-MM-DD format for minDate
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="step-datetime">
      <h2 className="wizard-step-title">Время проведения</h2>
      
      <div className="form-field">
        <label className="form-label">Дата</label>
        <InlineCalendar
          value={data.date}
          onChange={(date) => onUpdate('date', date)}
          minDate={todayStr}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Время начала</label>
        <InlineTimePicker
          value={data.time || '12:00'}
          onChange={(time) => onUpdate('time', time)}
        />
      </div>

      <div className="form-field">
        <label className="form-label">Продолжительность</label>
        <DurationPicker
          value={data.duration}
          onChange={(duration) => onUpdate('duration', duration)}
          min={30}
        />
      </div>
    </div>
  );
};
