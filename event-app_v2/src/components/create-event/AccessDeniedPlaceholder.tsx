import { FC, useState } from 'react';
import { ShieldAlert, Send, CheckCircle } from 'lucide-react';
import { userService } from '@/services/userService';
import './AccessDeniedPlaceholder.css';

interface AccessDeniedPlaceholderProps {
  onClose: () => void;
}

export const AccessDeniedPlaceholder: FC<AccessDeniedPlaceholderProps> = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await userService.requestCreatorRole(reason);
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to request role:', err);
      setError('Не удалось отправить запрос. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="access-denied-container">
        <div className="access-denied-content success">
          <CheckCircle size={64} className="success-icon" />
          <h2>Запрос отправлен!</h2>
          <p>
            Ваша заявка на получение прав организатора принята. 
            Мы рассмотрим её в ближайшее время и пришлём уведомление.
          </p>
          <button className="btn-close" onClick={onClose}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="access-denied-container">
      <div className="access-denied-content">
        <div className="icon-wrapper">
          <ShieldAlert size={48} />
        </div>
        
        <h2>Доступ ограничен</h2>
        <p className="description">
          Для создания мероприятий необходимы права организатора. 
          Вы можете запросить их у администрации, рассказав немного о своих планах.
        </p>

        <form onSubmit={handleSubmit} className="request-form">
          <div className="form-group">
            <label htmlFor="reason">Почему вы хотите стать организатором?</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Например: Я хочу организовывать встречи книжного клуба..."
              required
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="spinner-sm"></span>
              ) : (
                <>
                  <span>Отправить запрос</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
