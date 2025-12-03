import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { User, Calendar, LogOut, ArrowLeft, Pencil, X, Check } from 'lucide-react';
import { userService, EventWithSubscription } from '@/services/userService';
import { useAuthContext } from '@/contexts';
import { LoadingSpinner } from '@/components/common';
import TelegramService from '@/services/telegramService';
import type { User as UserType, TelegramBindingLink } from '@/types';
import './ProfilePage.css';

interface ProfilePageProps {
  onBack?: () => void;
}

// Глобальные флаги для предотвращения двойных запросов в Strict Mode
let globalProfileFetchInProgress = false;
let globalEventsFetchInProgress = false;

// Telegram Binding Section Component
const TelegramBindingSection: FC = () => {
  const { user, bindTelegram, unbindTelegram } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bindingLink, setBindingLink] = useState<TelegramBindingLink | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Update time remaining countdown
  useEffect(() => {
    if (!bindingLink) return;

    const updateTimer = () => {
      const remaining = TelegramService.getTimeRemaining(bindingLink.expires_at);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setBindingLink(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [bindingLink]);



  const handleBindTelegram = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const link = await bindTelegram();
      
      if (link) {
        setBindingLink(link);
        // Open Telegram link in new tab
        TelegramService.openTelegramLink(link.deeplink);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка привязки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbindTelegram = async () => {
    if (!confirm('Вы уверены, что хотите отключить уведомления Telegram?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await unbindTelegram();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отключения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!bindingLink) return;
    
    const success = await TelegramService.copyToClipboard(bindingLink.deeplink);
    if (success) {
      alert('Ссылка скопирована в буфер обмена!');
    } else {
      alert('Не удалось скопировать ссылку');
    }
  };

  const isBound = user?.telegram_registered === true;

  return (
    <div className="telegram-section-compact">
      {error && (
        <div className="telegram-error">
          {error}
        </div>
      )}

      {isBound && user?.telegram_info ? (
        <div className="telegram-connected-compact">
           <span className="telegram-status-text active">✓ Telegram подключен</span>
           <button
            onClick={handleUnbindTelegram}
            disabled={isLoading}
            className="telegram-text-action"
          >
            {isLoading ? '...' : 'Отключить'}
          </button>
        </div>
      ) : (
        <div className="telegram-disconnected-compact">
          {bindingLink ? (
            <div className="telegram-binding-active-compact">
              <p className="telegram-instruction-compact">
                Перейдите в бот:
              </p>
              <div className="telegram-actions-compact">
                <button
                  onClick={() => TelegramService.openTelegramLink(bindingLink.deeplink)}
                  className="telegram-btn-compact primary"
                >
                  Открыть
                </button>
                <button
                  onClick={handleCopyLink}
                  className="telegram-btn-compact secondary"
                >
                  Копия
                </button>
              </div>
              <div className="telegram-timer-compact">
                {TelegramService.formatTimeRemaining(timeRemaining)}
              </div>
            </div>
          ) : (
            <div className="telegram-connect-row">
                <span className="telegram-status-text inactive">Telegram не подключен</span>
                <button
                onClick={handleBindTelegram}
                disabled={isLoading}
                className="telegram-text-action connect"
                >
                {isLoading ? '...' : 'Подключить'}
                </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ProfilePage: FC<ProfilePageProps> = ({ onBack }) => {
  const { logout } = useAuthContext();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // History state
  const [historyEvents, setHistoryEvents] = useState<EventWithSubscription[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const isMounted = useRef(false);

  const loadProfile = useCallback(async (force = false) => {
    // Предотвращаем параллельные запросы
    if (!force && globalProfileFetchInProgress) return;
    
    globalProfileFetchInProgress = true;
    try {
      const userData = await userService.getProfile();
      if (isMounted.current) {
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        logout();
        return;
      }
      if (isMounted.current) {
        setError('Не удалось загрузить профиль');
      }
    } finally {
      globalProfileFetchInProgress = false;
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [logout]);

  const loadEvents = useCallback(async (force = false) => {
    // Предотвращаем параллельные запросы
    if (!force && globalEventsFetchInProgress) return;
    
    globalEventsFetchInProgress = true;
    setIsLoadingEvents(true);
    try {
      const history = await userService.getEventHistory();
      if (isMounted.current) {
        setHistoryEvents(history);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        logout();
        return;
      }
      console.error('Failed to load events', err);
    } finally {
      globalEventsFetchInProgress = false;
      if (isMounted.current) {
        setIsLoadingEvents(false);
      }
    }
  }, [logout]);

  useEffect(() => {
    isMounted.current = true;
    loadProfile();
    loadEvents();
    return () => {
      isMounted.current = false;
    };
  }, [loadProfile, loadEvents]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await userService.updateProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
      // Show success toast (omitted for brevity)
    } catch (err) {
      setError('Не удалось сохранить изменения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
        setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phone: user.phone || '',
        });
    }
    setIsEditing(false);
  };

  const filteredEvents = historyEvents.filter(event => {
    const eventDate = new Date(event.date);
    const now = new Date();
    return eventDate < now;
  });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-section" style={{ textAlign: 'center', color: '#f87171' }}>
          <h3>Ошибка</h3>
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => window.location.reload()}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {onBack && (
        <button 
          onClick={onBack} 
          className="profile-back-button"
        >
          <ArrowLeft size={20} />
          Назад
        </button>
      )}

      {/* Personal Info Block */}
      <section className="profile-section personal-info-block">
        <div className="section-header">
            <h2 className="section-title">Личные данные</h2>
            {!isEditing ? (
                <button className="icon-btn edit-trigger" onClick={() => setIsEditing(true)}>
                    <Pencil size={18} />
                </button>
            ) : (
                <div className="edit-actions">
                    <button className="icon-btn save-btn" onClick={handleSave} disabled={isSaving}>
                        <Check size={18} />
                    </button>
                    <button className="icon-btn cancel-btn" onClick={handleCancel} disabled={isSaving}>
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>

        <div className="personal-info-content">
            <div className="avatar-column">
                <div className="profile-avatar-compact">
                    <User size={24} color="#fff" />
                </div>
            </div>
            
            <div className="info-column">
                {isEditing ? (
                    <div className="edit-form-grid">
                        <input 
                            type="text" 
                            className="compact-input"
                            placeholder="Имя"
                            value={formData.firstName}
                            onChange={e => setFormData({...formData, firstName: e.target.value})}
                        />
                        <input 
                            type="text" 
                            className="compact-input"
                            placeholder="Фамилия"
                            value={formData.lastName}
                            onChange={e => setFormData({...formData, lastName: e.target.value})}
                        />
                        <input 
                            type="tel" 
                            className="compact-input"
                            placeholder="Телефон"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                ) : (
                    <div className="read-only-grid">
                        <div className="info-row main-info">
                            <span className="user-name">
                                {user?.firstName} {user?.lastName}
                            </span>
                        </div>
                        <div className="info-row secondary-info">
                            <span className="user-phone">{user?.phone || 'Телефон не указан'}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>
                )}
                
                {/* Telegram Status integrated here */}
                <div className="telegram-status-row">
                    <TelegramBindingSection />
                </div>
            </div>
        </div>
      </section>

      {/* Participation History Block */}
      <section className="profile-section history-block">
        <div className="history-header">
            <h3 className="section-title">История</h3>
        </div>

        <div className="history-list-scrollable">
            {isLoadingEvents ? (
                <div className="loading-placeholder">Загрузка...</div>
            ) : filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                    <div key={event.id} className="history-card-compact">
                        <div className="history-card-main">
                            <h4 className="history-event-title">{event.title}</h4>
                            <div className="history-event-meta">
                                <span className="history-date">
                                    {new Date(event.date).toLocaleDateString('ru-RU', {
                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                                <span className={`status-badge-compact status-${event.subscriptionStatus}`}>
                                    {event.subscriptionStatus === 'confirmed' ? 'Подтверждено' : 
                                     event.subscriptionStatus === 'waitlisted' ? 'В ожидании' : 
                                     event.subscriptionStatus === 'attended' ? 'Посетил' : 'Отменено'}
                                </span>
                            </div>
                        </div>
                        <div className="history-card-actions">
                            {event.subscriptionStatus === 'attended' && (
                                <button className="text-action-btn">Отзыв</button>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="empty-history">
                    <Calendar size={24} className="empty-icon" />
                    <p>Нет событий</p>
                </div>
            )}
        </div>
      </section>
      
      <div className="profile-footer">
          <button onClick={logout} className="logout-button-compact">
              <LogOut size={16} />
              Выйти
          </button>
      </div>
    </div>
  );
};



