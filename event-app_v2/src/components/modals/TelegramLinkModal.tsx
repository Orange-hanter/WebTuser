import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { X, Copy, ExternalLink, Check, Loader2 } from 'lucide-react';
import TelegramService from '@/services/telegramService';
import type { TelegramBindingLink, TelegramStatus } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import './TelegramLinkModal.css';

interface TelegramLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (status: TelegramStatus) => void;
}

const POLLING_INTERVAL = 3000; // 3 секунды

const TelegramLinkModal: FC<TelegramLinkModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const [bindingLink, setBindingLink] = useState<TelegramBindingLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Очистка при размонтировании
  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Запрос ссылки привязки
  const requestBindingLink = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsCopied(false);
    
    try {
      const response = await TelegramService.requestBindingLink();
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Не удалось получить ссылку');
      }
      
      setBindingLink(response.data);
      setIsPolling(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка получения ссылки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Проверка статуса привязки
  const checkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await TelegramService.checkStatus();
      
      if (response.success && response.data?.status === 'active') {
        cleanup();
        setIsPolling(false);
        toast.success('Telegram успешно подключён!');
        
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        return true;
      }
    } catch (err) {
      console.error('Ошибка проверки статуса:', err);
    }
    
    return false;
  }, [cleanup, onSuccess, toast]);

  // Запуск polling при получении ссылки
  useEffect(() => {
    if (!bindingLink || !isPolling) return;

    const poll = async () => {
      const success = await checkStatus();
      if (success) {
        cleanup();
      }
    };

    // Первая проверка через 2 секунды
    const initialTimeout = setTimeout(poll, 2000);
    
    // Затем каждые 3 секунды
    pollingRef.current = setInterval(poll, POLLING_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      cleanup();
    };
  }, [bindingLink, isPolling, checkStatus, cleanup]);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (!bindingLink) return;

    const updateTimer = () => {
      const remaining = TelegramService.getTimeRemaining(bindingLink.expires_at);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        cleanup();
        setIsPolling(false);
        setError('Код истёк. Запросите новый.');
        setBindingLink(null);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [bindingLink, cleanup]);

  // Запрос ссылки при открытии модалки
  useEffect(() => {
    if (isOpen && !bindingLink && !isLoading) {
      requestBindingLink();
    }
  }, [isOpen, bindingLink, isLoading, requestBindingLink]);

  // Очистка при закрытии
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setBindingLink(null);
      setIsPolling(false);
      setError(null);
      setIsCopied(false);
    }
  }, [isOpen, cleanup]);

  // Копирование кода
  const handleCopyCode = async () => {
    if (!bindingLink?.code) return;
    
    const success = await TelegramService.copyToClipboard(bindingLink.code);
    if (success) {
      setIsCopied(true);
      toast.success('Код скопирован');
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error('Не удалось скопировать код');
    }
  };

  // Открытие Telegram
  const handleOpenTelegram = () => {
    if (!bindingLink?.deeplink) return;
    TelegramService.openTelegramLink(bindingLink.deeplink);
  };

  // Форматирование времени
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Форматирование кода с пробелами
  const formatCode = (code: string): string => {
    return code.split('').join(' ');
  };

  if (!isOpen) return null;

  return (
    <div className="telegram-modal-overlay" onClick={onClose}>
      <div className="telegram-modal-content" onClick={e => e.stopPropagation()}>
        <div className="telegram-modal-header">
          <div className="telegram-modal-header-content">
            <span className="telegram-modal-icon">🔗</span>
            <h2 className="telegram-modal-title">Подключить Telegram</h2>
          </div>
          <button 
            onClick={onClose}
            className="telegram-modal-close"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        <div className="telegram-modal-body">
          {error && (
            <div className="telegram-modal-error">
              <span>{error}</span>
              <button 
                onClick={requestBindingLink}
                className="telegram-modal-retry"
                disabled={isLoading}
              >
                Запросить новый
              </button>
            </div>
          )}

          {isLoading && (
            <div className="telegram-modal-loading">
              <Loader2 className="telegram-modal-spinner" />
              <span>Загрузка...</span>
            </div>
          )}

          {bindingLink && !error && (
            <>
              <p className="telegram-modal-instruction">
                Откройте бота и отправьте код:
              </p>

              <div className="telegram-code-container">
                <div className="telegram-code">
                  {formatCode(bindingLink.code)}
                </div>
                <button 
                  onClick={handleCopyCode}
                  className="telegram-copy-button"
                  aria-label="Копировать код"
                >
                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <p className="telegram-modal-divider">или нажмите кнопку:</p>

              <button 
                onClick={handleOpenTelegram}
                className="telegram-open-button"
              >
                <ExternalLink size={18} />
                <span>Открыть Telegram</span>
              </button>

              <div className="telegram-timer">
                <span className="telegram-timer-icon">⏱️</span>
                <span>Код действителен: {formatTime(timeRemaining)}</span>
              </div>

              <div className="telegram-polling-status">
                {isPolling && (
                  <>
                    <Loader2 className="telegram-polling-spinner" size={14} />
                    <span>Ожидание подключения...</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="telegram-modal-footer">
          <button 
            onClick={onClose}
            className="telegram-skip-button"
          >
            Пропустить
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelegramLinkModal;
