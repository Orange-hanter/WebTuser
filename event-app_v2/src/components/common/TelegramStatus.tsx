import { FC, useState } from 'react';
import TelegramService from '@/services/telegramService';
import TelegramLinkModal from '@/components/modals/TelegramLinkModal';
import { useToast } from '@/contexts/ToastContext';
import type { TelegramInfo } from '@/types';
import './TelegramStatus.css';

interface TelegramStatusProps {
  isRegistered: boolean;
  telegramInfo: TelegramInfo | undefined;
  onStatusChange?: () => void;
}

const TelegramStatus: FC<TelegramStatusProps> = ({ 
  isRegistered, 
  telegramInfo,
  onStatusChange 
}) => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnbinding, setIsUnbinding] = useState(false);

  const handleUnbind = async () => {
    if (!confirm('Вы уверены, что хотите отключить Telegram?')) {
      return;
    }

    setIsUnbinding(true);
    try {
      const response = await TelegramService.unbind();
      
      if (!response.success) {
        // Показываем сообщение об использовании бота
        toast.info(response.error || 'Для отключения используйте команду /unsubscribe в боте Telegram');
      } else {
        toast.success('Telegram отключён');
        onStatusChange?.();
      }
    } catch (err) {
      toast.error('Ошибка отключения Telegram');
    } finally {
      setIsUnbinding(false);
    }
  };

  const handleBindSuccess = () => {
    setIsModalOpen(false);
    onStatusChange?.();
  };

  const isBound = isRegistered && telegramInfo?.status === 'active';

  // Формируем отображаемое имя
  const displayName = telegramInfo?.first_name && telegramInfo?.last_name
    ? `${telegramInfo.first_name} ${telegramInfo.last_name}`
    : telegramInfo?.first_name || telegramInfo?.last_name || '';

  return (
    <>
      <div className="telegram-status-container">
        <div className="telegram-status-header">
          <span className="telegram-status-label">Telegram</span>
        </div>
        
        {isBound && telegramInfo ? (
          <div className="telegram-status-connected">
            <div className="telegram-status-info">
              <div className="telegram-status-indicator active" />
              <div className="telegram-status-details">
                {telegramInfo.username && (
                  <span className="telegram-username">@{telegramInfo.username}</span>
                )}
                {displayName && (
                  <span className="telegram-name">{displayName}</span>
                )}
              </div>
            </div>
            <button 
              onClick={handleUnbind}
              disabled={isUnbinding}
              className="telegram-action-button unbind"
            >
              {isUnbinding ? '...' : 'Отключить'}
            </button>
          </div>
        ) : (
          <div className="telegram-status-disconnected">
            <div className="telegram-status-info">
              <div className="telegram-status-indicator inactive" />
              <span className="telegram-status-text">Не подключён</span>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="telegram-action-button connect"
            >
              Подключить
            </button>
          </div>
        )}
      </div>

      <TelegramLinkModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleBindSuccess}
      />
    </>
  );
};

export default TelegramStatus;
