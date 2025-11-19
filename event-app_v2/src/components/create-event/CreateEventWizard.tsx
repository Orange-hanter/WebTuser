import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import type { CreateEventData } from '@/types';
import './CreateEventWizard.css';

interface CreateEventWizardProps {
  isVisible: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'create_event_draft';
const DRAFT_EXPIRY_DAYS = 7;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const INITIAL_DATA: CreateEventData = {
  type: '',
  title: '',
  description: '',
  date: '',
  time: '',
  duration: 60,
  location: '',
  organizerContact: '',
  priceType: 'free',
  price: '',
  needReg: false,
  dynamicFields: {},
};

const EVENT_TYPES = ['Музыка', 'Творчество', 'Общение', 'Искусство', 'Здоровье', 'Спорт'];

const TYPE_MAPPING: Record<string, string> = {
  'Музыка': 'concert',
  'Творчество': 'workshop',
  'Общение': 'networking',
  'Искусство': 'exhibition',
  'Здоровье': 'health',
  'Спорт': 'sports',
  'Театр': 'theatre',
  'Лекция': 'lecture'
};

const DYNAMIC_SCHEMAS: Record<string, Array<{ name: string; label: string; type: 'text' | 'number' | 'checkbox'; required?: boolean }>> = {
  'Музыка': [
    { name: 'genre', label: 'Жанр музыки', type: 'text', required: true },
    { name: 'lineup', label: 'Состав исполнителей', type: 'text', required: false },
    { name: 'ageLimit', label: 'Возрастное ограничение', type: 'number', required: true },
  ],
  'Творчество': [
    { name: 'materials', label: 'Материалы включены', type: 'checkbox' },
    { name: 'skillLevel', label: 'Уровень подготовки', type: 'text', required: true },
  ],
  'Спорт': [
    { name: 'sportType', label: 'Вид спорта', type: 'text', required: true },
    { name: 'equipmentRequired', label: 'Нужен свой инвентарь', type: 'checkbox' },
  ],
  // Default schema for others
  'default': [
    { name: 'requirements', label: 'Требования к участникам', type: 'text', required: false },
    { name: 'maxParticipants', label: 'Макс. участников', type: 'number', required: true },
  ]
};

export const CreateEventWizard: FC<CreateEventWizardProps> = ({ isVisible, onClose }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CreateEventData>(INITIAL_DATA);
  const [draftRestored, setDraftRestored] = useState<{ timestamp: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load draft on mount
  useEffect(() => {
    if (!isVisible) return;

    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const { data: savedData, step: savedStep, timestamp } = JSON.parse(savedDraft);
        const draftDate = new Date(timestamp);
        const now = new Date();
        const diffDays = (now.getTime() - draftDate.getTime()) / (1000 * 3600 * 24);

        if (diffDays < DRAFT_EXPIRY_DAYS) {
          setData(savedData);
          setStep(savedStep);
          setDraftRestored({ timestamp: draftDate.toLocaleString('ru-RU') });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to parse draft', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [isVisible]);

  // Save draft on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isVisible && step > 1) {
        const draft = {
          data,
          step,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isVisible, data, step]);

  // Save draft on step change
  useEffect(() => {
    if (isVisible && step > 1) {
      const draft = {
        data,
        step,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [step, data, isVisible]);

  const handleResetDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(INITIAL_DATA);
    setStep(1);
    setDraftRestored(null);
  };

  const updateData = (field: keyof CreateEventData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateDynamicField = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      dynamicFields: { ...prev.dynamicFields, [field]: value }
    }));
  };

  const validateStep = (): boolean => {
    setError(null);
    switch (step) {
      case 1:
        if (!data.type) {
          setError('Выберите тип события');
          return false;
        }
        return true;
      case 2:
        if (!data.title.trim()) {
          setError('Введите название');
          return false;
        }
        if (!data.description.trim()) {
          setError('Введите описание');
          return false;
        }
        return true;
      case 3:
        if (!data.date) {
          setError('Выберите дату');
          return false;
        }
        if (!data.time) {
          setError('Выберите время');
          return false;
        }
        if (data.duration < 30) {
          setError('Минимальная продолжительность - 30 минут');
          return false;
        }
        return true;
      case 4:
        if (!data.location.trim()) {
          setError('Укажите место проведения');
          return false;
        }
        if (!data.organizerContact.trim()) {
          setError('Укажите контакты организатора');
          return false;
        }
        if (data.priceType === 'paid' && !data.price) {
          setError('Укажите стоимость');
          return false;
        }
        return true;
      case 5:
        const schema = DYNAMIC_SCHEMAS[data.type] || DYNAMIC_SCHEMAS['default'];
        if (!schema) return true;
        for (const field of schema) {
          if (field.required && !data.dynamicFields[field.name]) {
            setError(`Заполните поле "${field.label}"`);
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 6));
      contentRef.current?.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError(null);
    contentRef.current?.scrollTo(0, 0);
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Construct payload strictly according to API contract
      const startDateTime = new Date(`${data.date}T${data.time}`);
      const endDateTime = new Date(startDateTime.getTime() + data.duration * 60000);

      const payload = {
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        duration: Number(data.duration),
        type: TYPE_MAPPING[data.type] || 'other',
        priceType: data.priceType,
        place: data.location,
        needReg: data.needReg,
        details: {
          title: data.title,
          description: data.description,
          organizer_contact: data.organizerContact,
          price_value: data.price,
          ...data.dynamicFields
        }
      };

      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        const result = await response.json();
        alert(`Событие отправлено на модерацию. ID: ${result.id || 'new'}\nОжидайте проверки.`);
        localStorage.removeItem(STORAGE_KEY);
        onClose();
      } else if (response.status === 400) {
        const errorData = await response.json();
        // Map backend errors to UI if possible, for now just show message
        throw new Error(errorData.message || 'Ошибка валидации данных');
      } else {
        throw new Error('Ошибка при создании события');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать событие');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="wizard-step-title">Выберите тип события</h2>
            <div className="event-type-grid">
              {EVENT_TYPES.map(type => (
                <div
                  key={type}
                  className={`event-type-card ${data.type === type ? 'selected' : ''}`}
                  onClick={() => updateData('type', type)}
                >
                  {type}
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="wizard-step-title">Основная информация</h2>
            <div className="form-field">
              <label className="form-label">Название события</label>
              <input
                type="text"
                className="form-input"
                value={data.title}
                onChange={e => updateData('title', e.target.value)}
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
                onChange={e => updateData('description', e.target.value)}
                placeholder="О чем это событие?"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="wizard-step-title">Время проведения</h2>
            <div className="form-field">
              <label className="form-label">Дата</label>
              <input
                type="date"
                className="form-input"
                value={data.date}
                onChange={e => updateData('date', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Время начала</label>
              <input
                type="time"
                className="form-input"
                value={data.time}
                onChange={e => updateData('time', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Продолжительность (минут)</label>
              <input
                type="number"
                min="30"
                step="15"
                className="form-input"
                value={data.duration}
                onChange={e => updateData('duration', parseInt(e.target.value))}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="wizard-step-title">Место и условия</h2>
            <div className="form-field">
              <label className="form-label">Место проведения</label>
              <input
                type="text"
                className="form-input"
                value={data.location}
                onChange={e => updateData('location', e.target.value)}
                placeholder="Адрес или название места"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Контакты организатора</label>
              <input
                type="text"
                className="form-input"
                value={data.organizerContact}
                onChange={e => updateData('organizerContact', e.target.value)}
                placeholder="Телефон или Telegram"
              />
            </div>
            
            <div className="form-field">
              <label className="form-label">Условия входа</label>
              <select 
                className="form-select"
                value={data.priceType}
                onChange={e => updateData('priceType', e.target.value)}
              >
                <option value="free">Бесплатно</option>
                <option value="paid">Платное</option>
                <option value="donation">Donation (добровольный взнос)</option>
              </select>
            </div>

            {data.priceType === 'paid' && (
              <div className="form-field">
                <label className="form-label">Стоимость</label>
                <input
                  type="text"
                  className="form-input"
                  value={data.price || ''}
                  onChange={e => updateData('price', e.target.value)}
                  placeholder="Например: 500 руб."
                />
              </div>
            )}

            <div className="form-field checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={data.needReg}
                  onChange={e => updateData('needReg', e.target.checked)}
                  className="checkbox-input"
                />
                <span>Требуется предварительная регистрация</span>
              </label>
            </div>
          </div>
        );
      case 5:
        const schema = DYNAMIC_SCHEMAS[data.type] || DYNAMIC_SCHEMAS['default'];
        if (!schema) return null;
        return (
          <div>
            <h2 className="wizard-step-title">Детали для "{data.type}"</h2>
            {schema.map(field => (
              <div key={field.name} className="form-field">
                <label className="form-label">
                  {field.label} {field.required && <span style={{color: 'red'}}>*</span>}
                </label>
                {field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={!!data.dynamicFields[field.name]}
                    onChange={e => updateDynamicField(field.name, e.target.checked)}
                    style={{ width: '20px', height: '20px' }}
                  />
                ) : (
                  <input
                    type={field.type}
                    className="form-input"
                    value={data.dynamicFields[field.name] || ''}
                    onChange={e => updateDynamicField(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 6:
        return (
          <div>
            <h2 className="wizard-step-title">Проверка данных</h2>
            <div className="preview-section">
              <div className="preview-label">Тип события</div>
              <div className="preview-value">{data.type}</div>
            </div>
            <div className="preview-section">
              <div className="preview-label">Название</div>
              <div className="preview-value">{data.title}</div>
            </div>
            <div className="preview-section">
              <div className="preview-label">Описание</div>
              <div className="preview-value">{data.description}</div>
            </div>
            <div className="preview-section">
              <div className="preview-label">Когда</div>
              <div className="preview-value">
                {new Date(data.date).toLocaleDateString()} в {data.time} ({data.duration} мин)
              </div>
            </div>
            <div className="preview-section">
              <div className="preview-label">Где</div>
              <div className="preview-value">{data.location}</div>
            </div>
            <div className="preview-section">
              <div className="preview-label">Условия</div>
              <div className="preview-value">
                {data.priceType === 'free' ? 'Бесплатно' : 
                 data.priceType === 'donation' ? 'Donation' : 
                 `Платное (${data.price})`}
                {data.needReg && <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>• Требуется регистрация</div>}
              </div>
            </div>
            <div className="preview-section">
              <div className="preview-label">Дополнительно</div>
              {Object.entries(data.dynamicFields).map(([key, value]) => {
                const schema = DYNAMIC_SCHEMAS[data.type] || DYNAMIC_SCHEMAS['default'];
                const fieldDef = schema?.find(f => f.name === key);
                return (
                  <div key={key} style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{fieldDef?.label || key}: </span>
                    <span>{value === true ? 'Да' : value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h1 className="wizard-title">Создание события</h1>
        <button className="wizard-close-button" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      {draftRestored && (
        <div className="draft-banner">
          <span>Восстановлен черновик от {draftRestored.timestamp}</span>
          <button className="draft-reset-button" onClick={handleResetDraft}>
            Сбросить
          </button>
        </div>
      )}

      <div className="wizard-progress">
        <div 
          className="wizard-progress-bar" 
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      <div className="wizard-content" ref={contentRef}>
        {renderStepContent()}
        {error && <div className="form-error">{error}</div>}
      </div>

      <div className="wizard-footer">
        <button 
          className="wizard-button wizard-button-secondary"
          onClick={handleBack}
          disabled={step === 1 || isSubmitting}
        >
          <ChevronLeft size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Назад
        </button>

        {step < 6 ? (
          <button 
            className="wizard-button wizard-button-primary"
            onClick={handleNext}
          >
            Далее
            <ChevronRight size={20} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />
          </button>
        ) : (
          <button 
            className="wizard-button wizard-button-primary"
            onClick={handlePublish}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Публикация...' : 'Опубликовать'}
            {!isSubmitting && <Check size={20} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />}
          </button>
        )}
      </div>

      <FeedbackModal currentStep={step} />
    </div>
  );
};
