import { FC, useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import TelegramService from '@/services/telegramService';
import TelegramLinkModal from '@/components/modals/TelegramLinkModal';
import { useToast } from '@/contexts/ToastContext';
import type { TelegramStatus as TelegramStatusType } from '@/types';
import './TelegramStatus.css';

interface TelegramStatusProps {
  onStatusChange?: () => void;
}

const TelegramStatus: FC<TelegramStatusProps> = ({ onStatusChange }) => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnbinding, setIsUnbinding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusData, setStatusData] = useState<TelegramStatusType | null>(null);
  const [isBound, setIsBound] = useState(false);

  // Load status on mount
  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // First do a lightweight bound check
      const boundResponse = await TelegramService.checkBound();
      
      if (boundResponse.success && boundResponse.data?.is_bound) {
        setIsBound(true);
        // Then get detailed status
        const statusResponse = await TelegramService.checkStatus();
        if (statusResponse.success && statusResponse.data) {
          setStatusData(statusResponse.data);
        }
      } else {
        setIsBound(false);
        setStatusData(null);
      }
    } catch (err) {
      console.error('Error loading Telegram status:', err);
      setIsBound(false);
      setStatusData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleUnbind = async () => {
    if (!confirm('Вы уверены, что хотите отключить уведомления в Telegram?')) {
      return;
    }

    setIsUnbinding(true);
    try {
      const response = await TelegramService.unbind();
      
      if (response.success) {
        toast.success('Telegram отключён');
        setIsBound(false);
        setStatusData(null);
        onStatusChange?.();
      } else {
        toast.error(response.error || 'Ошибка отключения');
      }
    } catch (err) {
      toast.error('Ошибка отключения Telegram');
    } finally {
      setIsUnbinding(false);
    }
  };

  const handleBindSuccess = () => {
    setIsModalOpen(false);
    loadStatus();
    onStatusChange?.();
  };

  // Format display name
  const displayName = statusData?.first_name && statusData?.last_name
    ? `${statusData.first_name} ${statusData.last_name}`
    : statusData?.first_name || statusData?.last_name || '';

  // Format updated date
  const formatUpdatedAt = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="telegram-status-container">
        <div className="telegram-status-loading">
          <Loader2 className="telegram-loading-spinner" size={16} />
          <span>Проверка статуса...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="telegram-status-container">
        <div className="telegram-status-header">
          <span className="telegram-status-label">Telegram</span>
        </div>
        
        {isBound && statusData?.status === 'active' ? (
          <div className="telegram-status-connected">
            <div className="telegram-status-info">
              <div className="telegram-status-indicator active" />
              <div className="telegram-status-details">
                {statusData.username && (
                  <span className="telegram-username">@{statusData.username}</span>
                )}
                {displayName && (
                  <span className="telegram-name">{displayName}</span>
                )}
                {statusData.updated_at && (
                  <span className="telegram-updated">
                    Подключено: {formatUpdatedAt(statusData.updated_at)}
                  </span>
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
