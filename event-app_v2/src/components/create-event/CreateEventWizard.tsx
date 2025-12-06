import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { CreatorEventsPage } from './CreatorEventsPage';
import {
  StepEventType,
  StepBasicInfo,
  StepDateTime,
  StepLocationPrice,
  StepDynamicFields,
  StepPreview,
} from './steps';
import {
  STORAGE_KEY,
  DRAFT_EXPIRY_DAYS,
  API_BASE_URL,
  INITIAL_DATA,
  TYPE_MAPPING,
  DYNAMIC_SCHEMAS,
  TOTAL_STEPS,
} from './wizardConfig';
import type { CreateEventData } from '@/types';
import './CreateEventWizard.css';

interface CreateEventWizardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CreateEventWizard: FC<CreateEventWizardProps> = ({ isVisible, onClose }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CreateEventData>(INITIAL_DATA);
  const [draftRestored, setDraftRestored] = useState<{ timestamp: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMyEvents, setShowMyEvents] = useState(false);
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
        const draft = { data, step, timestamp: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isVisible, data, step]);

  // Save draft on step change
  useEffect(() => {
    if (isVisible && step > 1) {
      const draft = { data, step, timestamp: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [step, data, isVisible]);

  const handleResetDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(INITIAL_DATA);
    setStep(1);
    setDraftRestored(null);
  };

  const updateData = useCallback((field: keyof CreateEventData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateDynamicField = useCallback((field: string, value: any) => {
    setData(prev => ({
      ...prev,
      dynamicFields: { ...prev.dynamicFields, [field]: value }
    }));
  }, []);

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
      setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        const result = await response.json();
        alert(`Событие отправлено на модерацию. ID: ${result.id || 'new'}\nОжидайте проверки.`);
        localStorage.removeItem(STORAGE_KEY);
        onClose();
      } else if (response.status === 400) {
        const errorData = await response.json();
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

  // По умолчанию показываем страницу "Мои мероприятия" с проверкой доступа
  // Wizard открывается при нажатии "Создать мероприятие"
  if (!showMyEvents) {
    return (
      <CreatorEventsPage 
        onClose={onClose}
        onCreateNew={() => {
          handleResetDraft();
          setShowMyEvents(true);
        }}
      />
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <StepEventType data={data} onUpdate={updateData} />;
      case 2:
        return <StepBasicInfo data={data} onUpdate={updateData} />;
      case 3:
        return <StepDateTime data={data} onUpdate={updateData} />;
      case 4:
        return <StepLocationPrice data={data} onUpdate={updateData} />;
      case 5:
        return <StepDynamicFields data={data} onUpdateDynamic={updateDynamicField} />;
      case 6:
        return <StepPreview data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <button 
          className="wizard-back-button" 
          onClick={() => setShowMyEvents(false)}
          title="Назад к списку"
        >
          <ChevronLeft size={24} />
        </button>
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
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
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
          <ChevronLeft size={20} />
          <span>Назад</span>
        </button>

        {step < TOTAL_STEPS ? (
          <button 
            className="wizard-button wizard-button-primary"
            onClick={handleNext}
          >
            <span>Далее</span>
            <ChevronRight size={20} />
          </button>
        ) : (
          <button 
            className="wizard-button wizard-button-primary"
            onClick={handlePublish}
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? 'Публикация...' : 'Опубликовать'}</span>
            {!isSubmitting && <Check size={20} />}
          </button>
        )}
      </div>

      <FeedbackModal currentStep={step} />
    </div>
  );
};
