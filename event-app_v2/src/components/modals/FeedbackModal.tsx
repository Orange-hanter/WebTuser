import { FC, useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import FeedbackService, { FeedbackCategory, FeedbackRequest } from '@/services/feedbackService';
import { useToast } from '@/contexts/ToastContext';
import './FeedbackModal.css';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: FeedbackCategory; label: string }[] = [
  { id: 'registration', label: 'Экран регистрации' },
  { id: 'create_card', label: 'Экран создания карточки' },
  { id: 'profile', label: 'Экран личного кабинета' },
  { id: 'general_suggestion', label: 'Общее пожелание' },
  { id: 'general_problem', label: 'Общая проблема' },
  { id: 'inconvenience', label: 'Неудобство' },
];

const FeedbackModal: FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedCategory) {
      showToast('Пожалуйста, выберите категорию', 'error');
      return;
    }
    if (!message.trim()) {
      showToast('Пожалуйста, введите сообщение', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackRequest = {
        category: selectedCategory,
        message: message.trim(),
        userInfo: {
          userId: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
        },
        environment: {
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          url: window.location.href,
          pwa: window.matchMedia('(display-mode: standalone)').matches,
          os: navigator.platform,
        },
      };

      await FeedbackService.sendFeedback(feedbackData);
      showToast('Спасибо за ваш отзыв!', 'success');
      onClose();
      // Reset form
      setMessage('');
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error sending feedback:', error);
      showToast('Не удалось отправить отзыв. Попробуйте позже.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <h2 className="feedback-modal-title">Обратная связь</h2>
          <button className="feedback-modal-close" onClick={onClose} aria-label="Закрыть">
            <X size={24} />
          </button>
        </div>

        <div className="feedback-modal-body">
          <div>
            <div className="feedback-section-title">О чем вы хотите рассказать?</div>
            <div className="feedback-categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`feedback-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="feedback-section-title">Ваше сообщение</div>
            <textarea
              className="feedback-textarea"
              placeholder="Опишите вашу идею, проблему или пожелание..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="feedback-modal-footer">
          <button 
            className="feedback-submit-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedCategory || !message.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Отправка...
              </>
            ) : (
              <>
                <Send size={18} />
                Отправить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
