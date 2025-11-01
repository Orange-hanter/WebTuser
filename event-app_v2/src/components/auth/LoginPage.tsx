import { FC, useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import type { AuthCredentials } from '@/types';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: (credentials: AuthCredentials) => Promise<void>;
  onSwitchToRegister: () => void;
  isLoading?: boolean;
}

const LoginPage: FC<LoginPageProps> = ({ onLogin, onSwitchToRegister, isLoading = false }) => {
  const [credentials, setCredentials] = useState<AuthCredentials>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    setError('');
    try {
      await onLogin(credentials);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
      return false;
    }
  };

  const handleChange = (field: keyof AuthCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="login-container">
      {/* Анимированный фон */}
      <div className="login-background">
        <div className={`login-gradient-blob blob-1 ${focusedField === 'email' ? 'active' : ''}`} />
        <div className={`login-gradient-blob blob-2 ${focusedField === 'password' ? 'active' : ''}`} />
        <div className="login-gradient-blob blob-3" />
      </div>

      {/* Основной контент */}
      <div className="login-content">
        <div className="login-card">
          <h1 className="login-title">Вход</h1>
          <p className="login-subtitle">Войди в свой аккаунт</p>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Поле Email */}
            <div className="login-form-group">
              <label htmlFor="email" className="login-label">Email</label>
              <div className={`login-input-wrapper ${focusedField === 'email' ? 'focused' : ''}`}>
                <Mail size={20} className="login-input-icon" />
                <input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your@email.com"
                  className="login-input"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Поле Password */}
            <div className="login-form-group">
              <label htmlFor="password" className="login-label">Пароль</label>
              <div className={`login-input-wrapper ${focusedField === 'password' ? 'focused' : ''}`}>
                <Lock size={20} className="login-input-icon" />
                <input
                  id="password"
                  data-testid="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Введи пароль"
                  className="login-input"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-toggle-password"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Ошибка */}
            {error && <div
              className="login-error"
              role="alert"
              aria-live="assertive"
              data-testid="login-error"
            >
              {error}
            </div>}

            {/* Кнопка входа */}
            <button
              type="submit"
              className="login-button"
              data-testid="login-submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Войти'}
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <p className="login-footer-text">
            Нет аккаунта?{' '}
            <button
              onClick={onSwitchToRegister}
              className="login-switch-button"
              data-testid="login-switch-register"
              disabled={isLoading}
            >
              Зарегистрируйся
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
