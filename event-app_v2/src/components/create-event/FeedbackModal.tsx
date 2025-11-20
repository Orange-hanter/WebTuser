import { FC, useState } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import type { FeedbackData } from '@/types';
import './FeedbackModal.css';

interface FeedbackModalProps {
  currentStep: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const FeedbackModal: FC<FeedbackModalProps> = ({ currentStep }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const feedbackData: FeedbackData = {
        step: currentStep,
        message,
        ...(email ? { email } : {}),
      };

      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Success
      setIsOpen(false);
      setMessage('');
      setEmail('');
    } catch (err) {
      setError('Не удалось отправить отзыв. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        className="feedback-trigger-button"
        onClick={() => setIsOpen(true)}
        aria-label="Оставить отзыв"
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="feedback-modal-overlay" onClick={() => setIsOpen(false)}>
          <div 
            className="feedback-modal-content" 
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-labelledby="feedback-title"
          >
            <div className="feedback-header">
              <h3 id="feedback-title">Отзыв о шаге {currentStep}</h3>
              <button 
                className="feedback-close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-group">
                <label htmlFor="feedback-message">Ваше сообщение</label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Что можно улучшить на этом шаге?"
                  required
                  rows={4}
                  className="feedback-textarea"
                />
              </div>

              <div className="form-group">
                <label htmlFor="feedback-email">Email (необязательно)</label>
                <input
                  type="email"
                  id="feedback-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Для обратной связи"
                  className="feedback-input"
                />
              </div>

              {error && <div className="feedback-error">{error}</div>}

              <button 
                type="submit" 
                className="feedback-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Отправка...' : (
                  <>
                    <span>Отправить</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
