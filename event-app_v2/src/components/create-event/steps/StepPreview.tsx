import { FC } from 'react';
import type { CreateEventData } from '@/types';
import { DYNAMIC_SCHEMAS } from '../wizardConfig';

interface StepPreviewProps {
  data: CreateEventData;
}

export const StepPreview: FC<StepPreviewProps> = ({ data }) => {
  const schema = DYNAMIC_SCHEMAS[data.type] || DYNAMIC_SCHEMAS['default'];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPriceLabel = () => {
    switch (data.priceType) {
      case 'free': return 'Бесплатно';
      case 'donation': return 'Donation';
      case 'paid': return `Платное (${data.price || '—'})`;
      default: return '—';
    }
  };

  return (
    <div>
      <h2 className="wizard-step-title">Проверка данных</h2>
      
      <div className="preview-section">
        <div className="preview-label">Тип события</div>
        <div className="preview-value">{data.type || '—'}</div>
      </div>

      <div className="preview-section">
        <div className="preview-label">Название</div>
        <div className="preview-value">{data.title || '—'}</div>
      </div>

      <div className="preview-section">
        <div className="preview-label">Описание</div>
        <div className="preview-value preview-description">{data.description || '—'}</div>
      </div>

      <div className="preview-section">
        <div className="preview-label">Когда</div>
        <div className="preview-value">
          {formatDate(data.date)} в {data.time || '—'} ({data.duration} мин)
        </div>
      </div>

      <div className="preview-section">
        <div className="preview-label">Где</div>
        <div className="preview-value">{data.location || '—'}</div>
      </div>

      <div className="preview-section">
        <div className="preview-label">Контакты</div>
        <div className="preview-value">{data.organizerContact || '—'}</div>
      </div>

      <div className="preview-section">
        <div className="preview-label">Условия</div>
        <div className="preview-value">
          {getPriceLabel()}
          {data.needReg && (
            <div className="preview-note">• Требуется регистрация</div>
          )}
        </div>
      </div>

      {Object.keys(data.dynamicFields).length > 0 && (
        <div className="preview-section">
          <div className="preview-label">Дополнительно</div>
          <div className="preview-value">
            {Object.entries(data.dynamicFields).map(([key, value]) => {
              const fieldDef = schema?.find(f => f.name === key);
              if (value === undefined || value === '') return null;
              return (
                <div key={key} className="preview-dynamic-item">
                  <span className="preview-dynamic-label">{fieldDef?.label || key}:</span>
                  <span>{value === true ? 'Да' : value === false ? 'Нет' : value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
