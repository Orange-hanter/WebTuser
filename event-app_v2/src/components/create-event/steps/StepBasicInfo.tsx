import { FC } from 'react';
import type { CreateEventData } from '@/types';

interface StepBasicInfoProps {
  data: CreateEventData;
  onUpdate: (field: keyof CreateEventData, value: any) => void;
}

export const StepBasicInfo: FC<StepBasicInfoProps> = ({ data, onUpdate }) => {
  return (
    <div>
      <h2 className="wizard-step-title">Основная информация</h2>
      <div className="form-field">
        <label className="form-label">Название события</label>
        <input
          type="text"
          className="form-input"
          value={data.title}
          onChange={e => onUpdate('title', e.target.value)}
          placeholder="Яркое название"
          autoFocus
        />
      </div>
      <div className="form-field">
        <label className="form-label">Описание</label>
        <textarea
          className="form-textarea"
          rows={5}
          value={data.description}
          onChange={e => onUpdate('description', e.target.value)}
          placeholder="О чем это событие?"
        />
      </div>
    </div>
  );
};
