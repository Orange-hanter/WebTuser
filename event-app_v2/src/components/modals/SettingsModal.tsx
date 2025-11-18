import { FC, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import TelegramService from '@/services/telegramService';
import type { EventPreferences, TelegramBindingLink } from '@/types';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: EventPreferences;
  onSettingsChange: (key: keyof EventPreferences, value: any) => void;
}

// Telegram Binding Section Component
const TelegramBindingSection: FC = () => {
  const { user, refreshTelegramStatus, bindTelegram, unbindTelegram } = useAuthContext();
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

  // Auto-refresh status when modal opens or after binding
  useEffect(() => {
    if (user && !user.telegram_registered) {
      const checkInterval = setInterval(async () => {
        await refreshTelegramStatus();
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(checkInterval);
    }
    return undefined;
  }, [user, refreshTelegramStatus]);

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
    <div className="telegram-section">
      <div className="telegram-divider"></div>
      
      <label className="settings-section-title">Уведомления Telegram</label>
      
      {error && (
        <div className="telegram-error">
          {error}
        </div>
      )}

      {isBound && user?.telegram_info ? (
        <div className="telegram-connected">
          <div className="telegram-info">
            <div className="telegram-status-badge telegram-status-active">
              ✓ Подключено
            </div>
            {user.telegram_info.username && (
              <div className="telegram-username">
                @{user.telegram_info.username}
              </div>
            )}
            <div className="telegram-updated">
              Обновлено: {new Date(user.telegram_info.updated_at).toLocaleString('ru-RU')}
            </div>
          </div>
          
          <button
            onClick={handleUnbindTelegram}
            disabled={isLoading}
            className="telegram-button telegram-button-disconnect"
          >
            {isLoading ? 'Отключение...' : 'Отключить Telegram'}
          </button>
        </div>
      ) : (
        <div className="telegram-disconnected">
          <p className="telegram-description">
            Получайте уведомления о мероприятиях в Telegram
          </p>
          
          {bindingLink ? (
            <div className="telegram-binding-active">
              <p className="telegram-binding-instruction">
                Ссылка для привязки создана. Перейдите по ней и нажмите /start в боте.
              </p>
              <div className="telegram-timer">
                Ссылка действительна: {TelegramService.formatTimeRemaining(timeRemaining)}
              </div>
              <div className="telegram-actions">
                <button
                  onClick={() => TelegramService.openTelegramLink(bindingLink.deeplink)}
                  className="telegram-button telegram-button-primary"
                >
                  Открыть Telegram
                </button>
                <button
                  onClick={handleCopyLink}
                  className="telegram-button telegram-button-secondary"
                >
                  Копировать ссылку
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleBindTelegram}
              disabled={isLoading}
              className="telegram-button telegram-button-connect"
            >
              {isLoading ? 'Создание ссылки...' : 'Подключить Telegram'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose, preferences, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      onSettingsChange('types', [...preferences.types, type]);
    } else {
      onSettingsChange('types', preferences.types.filter((t: string) => t !== type));
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal-content">
        <div className="settings-modal-body">
          <div className="settings-modal-header">
            <h2 className="settings-modal-title">Настройки</h2>
            <button 
              onClick={onClose}
              className="settings-modal-close-button"
              aria-label="Закрыть"
            >
              <X className="settings-modal-close-icon" />
            </button>
          </div>

          <div className="settings-sections">
            <div>
              <label className="settings-section-title">Типы мероприятий</label>
              <div className="settings-checkboxes">
                {['Музыка', 'Творчество', 'Общение', 'Искусство', 'Здоровье'].map((type) => (
                  <label key={type} className="settings-checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.types.includes(type)}
                      onChange={(e) => handleTypeChange(type, e.target.checked)}
                      className="settings-checkbox-input"
                    />
                    <span className="settings-checkbox-text">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="settings-range-label">
                Радиус поиска: {preferences.distance} км
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={preferences.distance}
                onChange={(e) => onSettingsChange('distance', parseInt(e.target.value))}
                className="settings-range-input"
              />
            </div>

            <div>
              <label className="settings-section-title">Время суток</label>
              <select
                value={preferences.timeOfDay}
                onChange={(e) => onSettingsChange('timeOfDay', e.target.value)}
                className="settings-select"
              >
                <option value="any">Любое время</option>
                <option value="morning">Утро (6:00-12:00)</option>
                <option value="afternoon">День (12:00-18:00)</option>
                <option value="evening">Вечер (18:00-24:00)</option>
              </select>
            </div>
          </div>

          <TelegramBindingSection />

          <button
            onClick={onClose}
            className="settings-submit-button"
          >
            Применить настройки
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;