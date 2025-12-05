import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, ExternalLink, Check, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthService from '@/services/authService';
import { useToast } from '@/contexts/ToastContext';
import { useAuthContext } from '@/contexts/AuthContext';
import './TelegramVerificationFlow.css';

interface TelegramVerificationFlowProps {
  /** Данные привязки из ответа регистрации */
  telegramBinding: {
    deeplink: string;
    code: string;
    expiresAt: string;
  };
  /** ID пользователя для polling статуса */
  userId: string;
  /** Email для верификации кода */
  email: string;
  /** Пароль для автологина после верификации */
  password: string;
  /** Закрыть модалку */
  onClose: () => void;
  /** Успешная верификация */
  onSuccess: () => void;
  /** Переключиться на email верификацию */
  onSwitchToEmail?: () => void;
}

type FlowStep = 'binding' | 'code-entry' | 'success';

const POLLING_INTERVAL = 3000; // 3 секунды

const TelegramVerificationFlow: FC<TelegramVerificationFlowProps> = ({
  telegramBinding,
  userId,
  email,
  password,
  onClose,
  onSuccess,
  onSwitchToEmail,
}) => {
  const toast = useToast();
  const { refreshSession } = useAuthContext();
  
  // Flow state
  const [step, setStep] = useState<FlowStep>('binding');
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Binding state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  
  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  
  // Refs
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Cleanup all timers
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

  // Calculate remaining time
  const getTimeRemaining = useCallback((): number => {
    const expiresAt = new Date(telegramBinding.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  }, [telegramBinding.expiresAt]);

  // Check binding status
  const checkBindingStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await AuthService.checkBindingStatus(userId);
      
      if (response.success && response.data?.isBound) {
        cleanup();
        setIsPolling(false);
        setStep('code-entry');
        toast.success('Telegram привязан! Введите код из чата');
        
        // Focus on code input
        setTimeout(() => codeInputRef.current?.focus(), 100);
        
        return true;
      }
    } catch (err) {
      console.error('Ошибка проверки статуса привязки:', err);
    }
    
    return false;
  }, [userId, cleanup, toast]);

  // Timer countdown
  useEffect(() => {
    const updateTimer = () => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        cleanup();
        setIsPolling(false);
        setIsExpired(true);
        setError('Время истекло. Запросите новый код.');
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [getTimeRemaining, cleanup]);

  // Polling for binding status
  useEffect(() => {
    if (step !== 'binding' || !isPolling || isExpired) return;

    const poll = async () => {
      await checkBindingStatus();
    };

    // Initial check after 2 seconds
    const initialTimeout = setTimeout(poll, 2000);
    
    // Then every 3 seconds
    pollingRef.current = setInterval(poll, POLLING_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      cleanup();
    };
  }, [step, isPolling, isExpired, checkBindingStatus, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(telegramBinding.code);
      setIsCopied(true);
      toast.success('Код скопирован');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Не удалось скопировать код');
    }
  };

  // Open Telegram
  const handleOpenTelegram = () => {
    window.open(telegramBinding.deeplink, '_blank');
  };

  // Handle verification code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  // Submit verification code
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (verificationCode.length !== 6) {
      setError('Код должен содержать 6 цифр');
      return;
    }

    setIsVerifying(true);
    
    try {
      const res = await AuthService.verify({ 
        email, 
        code: verificationCode, 
        method: 'telegram' 
      });
      
      if (!res.success) {
        setIsVerifying(false);
        const msg = res.error || 'Неверный код подтверждения';
        setError(msg);
        setAttemptsLeft((a) => a - 1);
        toast.error(msg);
        
        if (attemptsLeft - 1 <= 0) {
          setError('Слишком много неудачных попыток. Попробуйте позже.');
        }
        return;
      }

      toast.success('Верификация прошла успешно!');
      setStep('success');
      
      // Проверяем токен
      const token = AuthService.getAuthToken();
      if (!token) {
        // Fallback: логин если токен не пришёл
        console.log('🔵 TelegramVerificationFlow: No token after verify, trying login...');
        const loginRes = await AuthService.login({ email, password });
        
        if (!loginRes.success) {
          toast.error('Ошибка входа после верификации');
          setError('Ошибка входа. Попробуйте войти вручную.');
          setIsVerifying(false);
          return;
        }
      }

      // Обновляем сессию
      refreshSession();
      setIsVerifying(false);
      
      // Небольшая задержка для показа success state
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (err) {
      setIsVerifying(false);
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      toast.error('Сетевая ошибка при верификации');
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format binding code with spaces
  const formatBindingCode = (code: string): string => {
    return code.split('').join(' ');
  };

  const modal = (
    <div className="tg-verify-overlay" onClick={onClose}>
      <div className="tg-verify-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tg-verify-header">
          <div className="tg-verify-header-content">
            <span className="tg-verify-icon">
              {step === 'success' ? '✅' : step === 'code-entry' ? '🔐' : '📱'}
            </span>
            <h2 className="tg-verify-title">
              {step === 'success' 
                ? 'Готово!' 
                : step === 'code-entry' 
                  ? 'Введите код' 
                  : 'Подключите Telegram'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="tg-verify-close"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="tg-verify-body">
          {/* Step 1: Binding */}
          {step === 'binding' && (
            <>
              {error && !isExpired && (
                <div className="tg-verify-error">
                  <span>{error}</span>
                </div>
              )}

              {isExpired ? (
                <div className="tg-verify-expired">
                  <span className="tg-verify-expired-icon">⏰</span>
                  <p>Время истекло</p>
                  <p className="tg-verify-expired-hint">
                    Вернитесь к регистрации и попробуйте снова
                  </p>
                  {onSwitchToEmail && (
                    <button 
                      onClick={onSwitchToEmail}
                      className="tg-verify-switch-btn"
                    >
                      Использовать Email
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className="tg-verify-instruction">
                    Откройте бота и отправьте код:
                  </p>

                  <div className="tg-verify-code-container">
                    <div className="tg-verify-code">
                      {formatBindingCode(telegramBinding.code)}
                    </div>
                    <button 
                      onClick={handleCopyCode}
                      className="tg-verify-copy-btn"
                      aria-label="Копировать код"
                    >
                      {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>

                  <p className="tg-verify-divider">или нажмите кнопку:</p>

                  <button 
                    onClick={handleOpenTelegram}
                    className="tg-verify-open-btn"
                  >
                    <ExternalLink size={18} />
                    <span>Открыть Telegram</span>
                  </button>

                  <div className="tg-verify-timer">
                    <span className="tg-verify-timer-icon">⏱️</span>
                    <span>Код действителен: {formatTime(timeRemaining)}</span>
                  </div>

                  <div className="tg-verify-polling">
                    {isPolling && (
                      <>
                        <Loader2 className="tg-verify-spinner" size={14} />
                        <span>Ожидание подключения...</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 2: Code Entry */}
          {step === 'code-entry' && (
            <>
              <p className="tg-verify-instruction">
                Введите 6-значный код из Telegram:
              </p>

              <form onSubmit={handleVerifySubmit} className="tg-verify-form">
                <div className="tg-verify-input-wrapper">
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={verificationCode}
                    onChange={handleCodeChange}
                    placeholder="000000"
                    className="tg-verify-input"
                    disabled={isVerifying || attemptsLeft <= 0}
                    maxLength={6}
                    autoComplete="one-time-code"
                    aria-label="Код верификации"
                  />
                  <div className="tg-verify-code-chars">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="tg-verify-code-char">
                        {verificationCode[i] || ''}
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="tg-verify-error">{error}</div>
                )}

                <button
                  type="submit"
                  className="tg-verify-submit-btn"
                  disabled={isVerifying || verificationCode.length !== 6 || attemptsLeft <= 0}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="tg-verify-spinner" size={18} />
                      <span>Проверка...</span>
                    </>
                  ) : (
                    'Подтвердить'
                  )}
                </button>
              </form>

              {attemptsLeft < 3 && attemptsLeft > 0 && (
                <p className="tg-verify-attempts">
                  Осталось попыток: {attemptsLeft}
                </p>
              )}
            </>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="tg-verify-success">
              <CheckCircle className="tg-verify-success-icon" size={64} />
              <p className="tg-verify-success-text">
                Аккаунт подтверждён!
              </p>
              <p className="tg-verify-success-hint">
                Перенаправляем вас...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="tg-verify-footer">
          {step === 'binding' && !isExpired && onSwitchToEmail && (
            <button 
              onClick={onSwitchToEmail}
              className="tg-verify-alt-btn"
            >
              <ArrowLeft size={16} />
              Использовать Email
            </button>
          )}
          {step === 'binding' && !isExpired && (
            <button 
              onClick={onClose}
              className="tg-verify-skip-btn"
            >
              Отмена
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render via portal
  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body);
  }

  return modal;
};

export default TelegramVerificationFlow;
