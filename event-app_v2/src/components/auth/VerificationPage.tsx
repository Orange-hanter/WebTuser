import React, { FC, useState, useRef, useEffect } from 'react';
import { Mail as MailIcon, MessageSquare as MessageIcon, ArrowLeft } from 'lucide-react';
import './VerificationPage.css';
import AuthService from '@/services/authService';
import { useToast } from '@/contexts/ToastContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { loadRegistrationData } from '@/services/registrationStorage';
import TelegramVerificationFlow from './TelegramVerificationFlow';

// Telegram icon component
const TelegramIcon: FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

interface VerificationPageProps {
  onSwitchToLogin?: () => void;
  defaultMethod?: 'sms' | 'email' | 'telegram';
}

const VerificationPage: FC<VerificationPageProps> = ({ onSwitchToLogin, defaultMethod = 'email' }) => {
  // no react-router in AuthFlow — use history pushState so AuthFlow can react
  const toast = useToast();
  const { refreshSession } = useAuthContext();

  const [code, setCode] = useState('');
  const [method, setMethod] = useState<'sms' | 'email' | 'telegram'>(defaultMethod);
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'email' | 'telegram' | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [hasConflictPending, setHasConflictPending] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [registrationData, setRegistrationData] = useState<{ email: string; phone: string; password: string } | null>(null);
  const [verifyCodeDev, setVerifyCodeDev] = useState<string | null>(null);
  const [conflictUser, setConflictUser] = useState(false);
  
  // Telegram flow state
  const [showTelegramFlow, setShowTelegramFlow] = useState(false);
  const [telegramBindingData, setTelegramBindingData] = useState<{
    deeplink: string;
    code: string;
    expiresAt: string;
    userId: string;
  } | null>(null);

  useEffect(() => {
    const saved = loadRegistrationData();
    if (!saved) {
      // No data — go back to register
      window.history.pushState({}, '', '/register');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    setRegistrationData(saved);
  }, []);

  useEffect(() => {
    if (showCodeEntry) {
      inputRef.current?.focus();
    }
  }, [showCodeEntry]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCodeEntry && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft <= 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, showCodeEntry]);

  const sendVerificationCode = async () => {
    if (!registrationData || !selectedMethod) return;
    setError('');
    setIsRegistering(true);
    try {
      const res = await AuthService.register({
        email: registrationData.email,
        password: registrationData.password,
        phone: registrationData.phone,
        confirmPassword: registrationData.password,
      } as any, selectedMethod);

      setIsRegistering(false);

      if (!res.success) {
        // 409 conflict handling
        const errText = (res.error || '').toLowerCase();
        const isConflict = errText.includes('409') || 
                          errText.includes('exist') || 
                          errText.includes('существ') || 
                          errText.includes('ожидает подтверждения') ||
                          errText.includes('conflict');

        if (isConflict) {
          setHasConflictPending(true);
          setConflictUser(true);
          // Закрыть возможный старый Telegram flow, если был
          setShowTelegramFlow(false);
          // При конфликте просто показываем поле ввода кода. Повторная отправка
          // выполняется через кнопку "Отправить код снова" (verification-resend).
          console.log('🔵 VerificationPage: Conflict detected, showing code entry without resend');
          setShowCodeEntry(true);
          // Сбрасываем таймер на дефолт, чтобы пользователь видел обратный отсчёт/кнопку ресенда
          setTimeLeft(60);
          setCanResend(false);
          toast.info('Введите код подтверждения, отправленный ранее.');
          return;
        }

        setError(res.error || 'Ошибка регистрации');
        toast.error(res.error || 'Ошибка регистрации');
        return;
      }

      // Если выбран Telegram и пришли данные для привязки
      if (selectedMethod === 'telegram' && res.data?.telegramBinding) {
        setTelegramBindingData({
          deeplink: res.data.telegramBinding.deeplink,
          code: res.data.telegramBinding.code,
          expiresAt: res.data.telegramBinding.expiresAt,
          userId: res.data.user.id,
        });
        setShowTelegramFlow(true);
        return;
      } else if (selectedMethod === 'telegram') {
        console.warn('🔵 VerificationPage.sendVerificationCode: Telegram selected but no binding data', res.data);
      }

      // Стандартный flow для email/sms
      setVerifyCodeDev(res.data?.verifyCode || null);
      setShowCodeEntry(true);
      setTimeLeft(60);
      setCanResend(false);
      toast.success('Код отправлен');
    } catch (err) {
      setIsRegistering(false);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      toast.error('Сетевая ошибка');
      
      // Если Telegram недоступен, предложить email
      if (selectedMethod === 'telegram') {
        toast.info('Telegram сервис временно недоступен. Попробуйте Email.');
      }
    }
  };

  // Обработка успешной Telegram верификации
  const handleTelegramSuccess = () => {
    setShowTelegramFlow(false);
    // Переходим к заполнению профиля
    window.history.pushState({}, '', '/profile-step1');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Переключение с Telegram на Email
  const handleSwitchToEmail = () => {
    setShowTelegramFlow(false);
    setTelegramBindingData(null);
    setSelectedMethod('email');
    setMethod('email');
    toast.info('Выбрана верификация через Email');
  };

  // Закрытие Telegram flow
  const handleCloseTelegramFlow = () => {
    setShowTelegramFlow(false);
    setTelegramBindingData(null);
    setSelectedMethod(null);
  };

  const handleChannelClick = (selected: 'email' | 'sms' | 'telegram') => {
    if (selected === 'sms') {
      toast.info('SMS-верификация появится в ближайшем обновлении');
      return;
    }
    setMethod(selected);
    setSelectedMethod(selected);
    setError('');

    // Если ранее был конфликт/ожидание подтверждения (409), сразу показываем поле ввода кода,
    // чтобы пользователь мог ввести уже отправленный код без повторной регистрации.
    if (hasConflictPending) {
      setShowTelegramFlow(false);
      setShowCodeEntry(true);
      if (!canResend) {
        // перезапустить таймер, если нужен UI таймера
        setTimeLeft((t) => (t > 0 ? t : 60));
      }
      toast.info('Введите код подтверждения, который уже был отправлен.');
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleCodeBoxClick = () => {
    inputRef.current?.focus();
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!registrationData) return;
    if (code.length !== 6) {
      setError('Код должен содержать 6 символов');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await AuthService.verify({ email: registrationData.email, code, method });
      
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

      // После успешной верификации токен уже сохранён в AuthService.verify()
      toast.success('Верификация прошла успешно');
      setIsVerifying(false);

      // Проверяем, что токен сохранился
      const token = AuthService.getAuthToken();
      if (!token) {
        // Fallback: попытка логина если токен не пришёл от verify
        console.log('🔵 VerificationPage: No token after verify, trying login...');
        const loginRes = await AuthService.login({
          email: registrationData.email,
          password: registrationData.password,
        });
        
        if (!loginRes.success) {
          toast.error('Ошибка входа после верификации');
          setError('Ошибка входа. Попробуйте войти вручную.');
          window.history.pushState({}, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
          return;
        }
      }

      // Обновляем состояние сессии в контексте
      refreshSession();

      // Переходим к заполнению профиля
      console.log('🔵 VerificationPage: Success, navigating to profile-step1');
      window.history.pushState({}, '', '/profile-step1');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      setIsVerifying(false);
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      toast.error('Сетевая ошибка при верификации');
    }
  };

  const handleResend = async () => {
    if (!registrationData || !selectedMethod) return;
    setError('');
    try {
      const res = await AuthService.resendCode(registrationData.email, selectedMethod);
      if (!res.success) {
        const errorMsg = res.error || 'Ошибка отправки кода';
        setError(errorMsg);
        toast.error(errorMsg);
        
        // Handle rate limit - set timer based on retry_after if provided
        if (res.data?.retry_after) {
          setTimeLeft(res.data.retry_after);
          setCanResend(false);
        }
        return;
      }
      
      // Update timer based on expires_in from response
      const expiresIn = res.data?.expires_in || 60;
      setTimeLeft(expiresIn);
      setCanResend(false);
      
      // Show verify code in dev mode
      if (res.data?.verify_code) {
        setVerifyCodeDev(res.data.verify_code);
        console.log('🔑 Dev mode: Verification code =', res.data.verify_code);
      }
      
      const successMsg = res.data?.message || 'Код отправлен снова';
      toast.success(successMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      toast.error('Сетeвая ошибка');
    }
  };

  const handleBack = () => {
    window.history.pushState({}, '', '/register');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="verification-container">
      <div className="verification-background">
        <div className="verification-blob blob-1" />
        <div className="verification-blob blob-2" />
      </div>

      <div className="verification-content">
        <div className="verification-card">
          <button type="button" className="verification-back" onClick={handleBack} aria-label="Назад"><ArrowLeft size={24} /></button>
          <div className="verification-icon">
            {method === 'email' ? <MailIcon size={48} /> : <MessageIcon size={48} />}
          </div>

          <h1 className="verification-title">Подтвердите аккаунт</h1>
          <p className="verification-subtitle">
            {registrationData ? (
              method === 'telegram' 
                ? 'Привяжите Telegram и получите код в чате' 
                : `Мы отправим код подтверждения на ${registrationData.email}`
            ) : 'Загрузка...'}
          </p>

          {conflictUser && (
            <div className="verification-conflict">
              <p>Пользователь с таким email уже существует.</p>
              {onSwitchToLogin ? (
                <button className="verification-switch-button" onClick={onSwitchToLogin}>Войти</button>
              ) : (
                <button className="verification-switch-button" onClick={() => { window.history.pushState({}, '', '/login'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Войти</button>
              )}
            </div>
          )}

          <div className="verification-method-selector">
            <button
              type="button"
              className={`verification-method-btn ${selectedMethod === 'email' ? 'active' : ''}`}
              onClick={() => handleChannelClick('email')}
              disabled={showCodeEntry}
            >
              <MailIcon size={20} />
              Email
            </button>

            <div style={{ position: 'relative', flex: 1 }}>
              <button
                type="button"
                className={`verification-method-btn disabled ${selectedMethod === 'sms' ? 'active' : ''}`}
                onClick={() => handleChannelClick('sms')}
                disabled={showCodeEntry}
              >
                <MessageIcon size={20} />
                SMS
                <span className="soon-badge">Скоро</span>
              </button>
            </div>

            <button
              type="button"
              className={`verification-method-btn ${selectedMethod === 'telegram' ? 'active' : ''}`}
              onClick={() => handleChannelClick('telegram')}
              disabled={showCodeEntry}
            >
              <TelegramIcon size={20} />
              Telegram
            </button>
          </div>

          {!showCodeEntry && selectedMethod && (
            <button
              type="button"
              className="verification-send-button"
              onClick={sendVerificationCode}
              disabled={isRegistering}
            >
              {isRegistering ? 'Отправка...' : 'Отправить код'}
            </button>
          )}

          {showCodeEntry && (
            <form onSubmit={handleVerifySubmit} className="verification-form">
              <div className="verification-code-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  className="verification-code-input"
                  disabled={isVerifying || attemptsLeft <= 0}
                  maxLength={6}
                  autoComplete="off"
                  aria-label="Код верификации"
                />
                <div className="verification-code-chars" onClick={handleCodeBoxClick}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="verification-code-char">
                      {code[i] || ''}
                    </div>
                  ))}
                </div>
              </div>

              {verifyCodeDev && (
                <div className="verification-dev-hint">Dev code: {verifyCodeDev}</div>
              )}

              {error && <div className="verification-error">{error}</div>}

              <button
                type="submit"
                className="verification-button"
                disabled={isVerifying || code.length !== 6 || attemptsLeft <= 0}
              >
                {isVerifying ? 'Загрузка...' : 'Подтвердить'}
              </button>
            </form>
          )}

          <div className="verification-resend">
            {showCodeEntry ? (
              canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="verification-resend-button"
                  disabled={isVerifying || !selectedMethod}
                >
                  Отправить код снова
                </button>
              ) : (
                <p className="verification-resend-text">Отправить код снова через {timeLeft}с</p>
              )
            ) : null}
          </div>

          {onSwitchToLogin && (
            <div className="verification-login-link">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="verification-switch-button"
                disabled={isRegistering}
              >
                Вернуться ко входу
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Telegram Verification Flow Modal */}
      {showTelegramFlow && telegramBindingData && registrationData && (
        <TelegramVerificationFlow
          telegramBinding={{
            deeplink: telegramBindingData.deeplink,
            code: telegramBindingData.code,
            expiresAt: telegramBindingData.expiresAt,
          }}
          userId={telegramBindingData.userId}
          email={registrationData.email}
          password={registrationData.password}
          onClose={handleCloseTelegramFlow}
          onSuccess={handleTelegramSuccess}
          onSwitchToEmail={handleSwitchToEmail}
        />
      )}
    </div>
  );
};

export default VerificationPage;
