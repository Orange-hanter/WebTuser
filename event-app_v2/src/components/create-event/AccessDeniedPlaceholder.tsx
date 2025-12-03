import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { userService } from '@/services/userService';
import './AccessDeniedPlaceholder.css';

interface AccessDeniedPlaceholderProps {
  onClose: () => void;
}

// Глобальный флаг для предотвращения двойных запросов в Strict Mode
let globalFetchInProgress = false;

export const AccessDeniedPlaceholder: FC<AccessDeniedPlaceholderProps> = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'initial' | 'pending' | 'rejected' | 'approved' | 'loading'>('loading');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(false);

  const checkStatus = useCallback(async () => {
    // Предотвращаем параллельные запросы
    if (globalFetchInProgress) {
      console.log('🔍 AccessDeniedPlaceholder: Skipping - fetch already in progress');
      return;
    }
    
    globalFetchInProgress = true;
    try {
      console.log('🔍 AccessDeniedPlaceholder: Checking role request status...');
      const requests = await userService.getRoleRequests();
      console.log('🔍 AccessDeniedPlaceholder: Role requests received:', requests);
      
      if (!isMounted.current) return;
      
      const creatorRequests = requests.filter(r => r.requested_role === 'creator');
      // Sort by created_at desc
      creatorRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const latest = creatorRequests[0];
      console.log('🔍 AccessDeniedPlaceholder: Latest creator request:', latest);

      if (!latest) {
        console.log('🔍 AccessDeniedPlaceholder: No creator requests found, setting status to initial');
        setStatus('initial');
        return;
      }

      if (latest.status === 'pending') {
        console.log('🔍 AccessDeniedPlaceholder: Status is pending');
        setStatus('pending');
      } else if (latest.status === 'rejected') {
        console.log('🔍 AccessDeniedPlaceholder: Status is rejected');
        setStatus('rejected');
        setRejectionReason(latest.rejection_reason || 'Причина не указана');
      } else if (latest.status === 'approved') {
        console.log('🔍 AccessDeniedPlaceholder: Status is approved');
        setStatus('approved');
      } else {
        console.log('🔍 AccessDeniedPlaceholder: Unknown status, setting to initial');
        setStatus('initial');
      }
    } catch (err) {
      console.error('🔍 AccessDeniedPlaceholder: Failed to check role request status:', err);
      // При ошибке API показываем форму отправки заявки
      if (isMounted.current) {
        setStatus('initial');
      }
    } finally {
      globalFetchInProgress = false;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    checkStatus();
    return () => {
      isMounted.current = false;
    };
  }, [checkStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await userService.requestCreatorRole(reason);
      setStatus('pending');
    } catch (err) {
      console.error('Failed to request role:', err);
      setError('Не удалось отправить запрос. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="access-denied-container">
        <div className="access-denied-content">
          <div className="spinner-sm"></div>
        </div>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="access-denied-container">
        <div className="access-denied-content success">
          <CheckCircle size={64} className="success-icon" />
          <h2>Поздравляем!</h2>
          <p>
            Вам выданы права организатора. Теперь вы можете создавать свои мероприятия.
          </p>
          <button className="btn-close" onClick={() => window.location.reload()}>
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="access-denied-container">
        <div className="access-denied-content pending">
          <Clock size={64} className="pending-icon" style={{ color: '#f59e0b' }} />
          <h2>Заявка на рассмотрении</h2>
          <p>
            Ваша заявка на получение прав организатора принята и находится в обработке. 
            Мы рассмотрим её в ближайшее время.
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
          {status === 'rejected' ? <XCircle size={48} color="#ef4444" /> : <ShieldAlert size={48} />}
        </div>
        
        {status === 'rejected' ? (
          <>
            <h2>Заявка отклонена</h2>
            <div className="rejection-message">
              <p>Администратор отклонил вашу заявку по следующей причине:</p>
              <blockquote>{rejectionReason}</blockquote>
              <p>Вы можете исправить недочеты и отправить заявку повторно.</p>
            </div>
          </>
        ) : (
          <>
            <h2>Доступ ограничен</h2>
            <p className="description">
              Для создания мероприятий необходимы права организатора. 
              Вы можете запросить их у администрации, рассказав немного о своих планах.
            </p>
          </>
        )}

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
                  <span>{status === 'rejected' ? 'Отправить повторно' : 'Отправить запрос'}</span>
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
