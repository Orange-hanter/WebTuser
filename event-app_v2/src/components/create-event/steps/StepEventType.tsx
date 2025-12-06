import { FC } from 'react';
import type { CreateEventData } from '@/types';
import { EVENT_TYPES } from '../wizardConfig';

interface StepEventTypeProps {
  data: CreateEventData;
  onUpdate: (field: keyof CreateEventData, value: any) => void;
}

export const StepEventType: FC<StepEventTypeProps> = ({ data, onUpdate }) => {
  return (
    <div>
      <h2 className="wizard-step-title">Выберите тип события</h2>
      <div className="event-type-grid">
        {EVENT_TYPES.map(type => (
          <div
            key={type}
            className={`event-type-card ${data.type === type ? 'selected' : ''}`}
            onClick={() => onUpdate('type', type)}
          >
            {type}
          </div>
        ))}
      </div>
    </div>
  );
};
