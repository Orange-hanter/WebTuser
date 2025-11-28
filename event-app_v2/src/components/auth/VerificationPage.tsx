import { FC, useState, useRef, useEffect } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import './VerificationPage.css';

interface VerificationPageProps {
  email: string;
  onVerify: (code: string, method: 'sms' | 'email') => Promise<void>;
  onResend?: () => Promise<void>;
  onSwitchToNextStep: () => void;
  onSwitchToLogin?: () => void;
  isLoading?: boolean;
  defaultMethod?: 'sms' | 'email';
}

const VerificationPage: FC<VerificationPageProps> = ({
  email,
  onVerify,
  onResend,
  // @ts-ignore
  onSwitchToNextStep,
  onSwitchToLogin,
  isLoading = false,
  defaultMethod = 'email'
  
}) => {
  const [code, setCode] = useState('');
  const [method, setMethod] = useState<'sms' | 'email'>(defaultMethod);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Автофокус на инпут при монтировании
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Код должен содержать 6 символов');
      return;
    }

    try {
      await onVerify(code, method);
      // Переход на следующий шаг происходит в AuthFlow.handleVerify
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка верификации');
    }
  };

  const handleResend = async () => {
    setError('');
    if (onResend) {
      try {
        await onResend();
        setTimeLeft(60);
        setCanResend(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка отправки кода');
      }
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleCodeBoxClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="verification-container">
      {/* Фон */}
      <div className="verification-background">
        <div className="verification-blob blob-1" />
        <div className="verification-blob blob-2" />
      </div>

      {/* Контент */}
      <div className="verification-content">
        <div className="verification-card">
          <div className="verification-icon">
            {method === 'email' ? (
              <Mail size={48} />
            ) : (
              <MessageSquare size={48} />
            )}
          </div>

          <h1 className="verification-title">Подтверди email</h1>
          <p className="verification-subtitle">
            Мы отправили код подтверждения на {email}
          </p>

          {/* Выбор метода */}
          <div className="verification-method-selector">
            <button
              type="button"
              className={`verification-method-btn ${method === 'email' ? 'active' : ''}`}
              onClick={() => setMethod('email')}
              disabled={isLoading}
            >
              <Mail size={20} />
              Email
            </button>
            <button
              type="button"
              className={`verification-method-btn ${method === 'sms' ? 'active' : ''}`}
              onClick={() => setMethod('sms')}
              disabled={isLoading}
            >
              <MessageSquare size={20} />
              SMS
            </button>
          </div>

          <form onSubmit={handleSubmit} className="verification-form">
            {/* Поле кода */}
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
                disabled={isLoading}
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

            {/* Ошибка */}
            {error && <div className="verification-error">{error}</div>}

            {/* Кнопка подтверждения */}
            <button
              type="submit"
              className="verification-button"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Загрузка...' : 'Подтвердить'}
            </button>
          </form>

          {/* Переотправка */}
          <div className="verification-resend">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="verification-resend-button"
                disabled={isLoading}
              >
                Отправить код снова
              </button>
            ) : (
              <p className="verification-resend-text">
                Отправить код снова через {timeLeft}с
              </p>
            )}
          </div>

          {/* Вернуться ко входу */}
          {onSwitchToLogin && (
            <div className="verification-login-link">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="verification-switch-button"
                disabled={isLoading}
              >
                Вернуться ко входу
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
