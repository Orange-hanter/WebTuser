import { FC, useState, useEffect } from 'react';
import { User, Bell, Calendar, Clock, ChevronRight, LogOut, ArrowLeft } from 'lucide-react';
import { userService, EventWithSubscription } from '@/services/userService';
import { useAuthContext } from '@/contexts';
import { LoadingSpinner } from '@/components/common';
import { ChangePasswordModal } from './ChangePasswordModal';
import './ProfilePage.css';
import type { User as UserType } from '@/types';

interface ProfilePageProps {
  onBack?: () => void;
}

export const ProfilePage: FC<ProfilePageProps> = ({ onBack }) => {
  const { logout } = useAuthContext();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // History state
  const [historyEvents, setHistoryEvents] = useState<EventWithSubscription[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    loadProfile();
    loadEvents();
  }, []);

  const loadProfile = async () => {
    try {
      const userData = await userService.getProfile();
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        logout();
        return;
      }
      setError('Не удалось загрузить профиль');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const history = await userService.getEventHistory();
      setHistoryEvents(history);
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        logout();
        return;
      }
      console.error('Failed to load events', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = await userService.updateProfile(formData);
      setUser(updatedUser);
      // Show success toast (omitted for brevity)
    } catch (err) {
      setError('Не удалось сохранить изменения');
    } finally {
      setIsSaving(false);
    }
  };

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
          style={{ 
            background: 'none', 
            border: 'none', 
              color: 'var(--purple-800);', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '16px', 
            cursor: 'pointer',
            padding: 0,
            fontSize: '16px'
          }}
        >
          <ArrowLeft size={24} />
          Назад
        </button>
      )}

      {/* Personal Info Section */}
      <section className="profile-section">
        <div className="profile-header">
          <div className="profile-avatar">
                      <User size={32} color="var(--purple-800);" />
          </div>
          <div>
            <h2 className="profile-title">{user?.firstName} {user?.lastName}</h2>
            <div className="profile-label">{user?.email}</div>
          </div>
        </div>

        <div className="profile-form-group">
          <label className="profile-label">Имя</label>
          <input
            className="profile-input"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-label">Фамилия</label>
          <input
            className="profile-input"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-label">Телефон</label>
          <input
            className="profile-input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+7 (999) 000-00-00"
          />
        </div>

        {user?.telegram_registered && (
          <div className="telegram-badge">
            <Bell size={16} />
            Уведомления включены
          </div>
        )}

        <div className="profile-actions">
          <button 
            className="btn-secondary"
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Сменить пароль
          </button>
          <button 
            className="btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>

        <button 
          className="btn-secondary"
          onClick={logout}
          style={{ 
            marginTop: '12px', 
            width: '100%', 
            color: '#f87171', 
            background: 'rgba(248, 113, 113, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <LogOut size={18} />
          Выйти из аккаунта
        </button>
      </section>

      {/* Participation History Section */}
      <section className="profile-section">
        <h3 className="profile-subtitle">История участия</h3>

        {isLoadingEvents ? (
          <LoadingSpinner />
        ) : (
          <div className="events-list">
            {historyEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>
                История пуста
              </div>
            ) : (
              historyEvents.map(event => (
                <div key={event.id} className="event-card-compact">
                  <div className="event-info">
                    <h4>{event.title}</h4>
                    <div className="event-meta">
                      <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                      {new Date(event.date).toLocaleDateString()}
                      <span style={{ margin: '0 8px' }}>•</span>
                      <Clock size={14} style={{ display: 'inline', marginRight: 4 }} />
                      {event.time}
                    </div>
                    <div className={`status-badge status-${event.subscriptionStatus}`}>
                      {event.subscriptionStatus === 'confirmed' && 'Подтверждено'}
                      {event.subscriptionStatus === 'waitlisted' && 'В листе ожидания'}
                      {event.subscriptionStatus === 'attended' && 'Посещено'}
                      {event.subscriptionStatus === 'cancelled' && 'Отменено'}
                    </div>
                  </div>
                  <div className="event-actions">
                    <button 
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 8 }}
                      title="Подробнее"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
};
