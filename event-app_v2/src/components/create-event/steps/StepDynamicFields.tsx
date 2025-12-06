import { FC } from 'react';
import type { CreateEventData } from '@/types';
import { DYNAMIC_SCHEMAS } from '../wizardConfig';

interface StepDynamicFieldsProps {
  data: CreateEventData;
  onUpdateDynamic: (field: string, value: any) => void;
}

export const StepDynamicFields: FC<StepDynamicFieldsProps> = ({ data, onUpdateDynamic }) => {
  const schema = DYNAMIC_SCHEMAS[data.type] || DYNAMIC_SCHEMAS['default'];
  
  if (!schema) return null;

  return (
    <div>
      <h2 className="wizard-step-title">Детали для "{data.type}"</h2>
      {schema.map(field => (
        <div key={field.name} className="form-field">
          <label className="form-label">
            {field.label} {field.required && <span className="required-mark">*</span>}
          </label>
          {field.type === 'checkbox' ? (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!data.dynamicFields[field.name]}
                onChange={e => onUpdateDynamic(field.name, e.target.checked)}
                className="checkbox-input"
              />
              <span>Да</span>
            </label>
          ) : (
            <input
              type={field.type}
              className="form-input"
              value={data.dynamicFields[field.name] || ''}
              onChange={e => onUpdateDynamic(field.name, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
