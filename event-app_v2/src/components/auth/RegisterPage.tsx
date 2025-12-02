import { FC, useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import type { RegistrationData } from '@/types';
import './RegisterPage.css';
import { saveRegistrationData, loadRegistrationData } from '@/services/registrationStorage';

interface RegisterPageProps {
  onRegister?: (data: RegistrationData) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

const RegisterPage: FC<RegisterPageProps> = ({ onRegister, onSwitchToLogin, isLoading = false }) => {

  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  useEffect(() => {
    const saved = loadRegistrationData();
    if (saved) {
      setFormData(prev => ({ ...prev, email: saved.email || '', phone: saved.phone || '' }));
    }
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<keyof RegistrationData | null>(null);

  const handleChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Заполните все обязательные поля');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    // Persist registration data to sessionStorage and navigate to /verify
      try {
        saveRegistrationData({ email: formData.email, phone: formData.phone || '', password: formData.password });
        window.history.pushState({}, '', '/verify'); // change path to /verify so AuthFlow can react to it
        window.dispatchEvent(new PopStateEvent('popstate')); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось продолжить');
    }
  };

  return (
    <div className="register-container">
      {/* Анимированный фон */}
      <div className="register-background">
        <div className={`register-gradient-blob blob-1 ${focusedField === 'email' ? 'active' : ''}`} />
        <div className={`register-gradient-blob blob-2 ${focusedField === 'password' ? 'active' : ''}`} />
        <div className="register-gradient-blob blob-3" />
      </div>

      {/* Основной контент */}
      <div className="register-content">
        <div className="register-card">
          <h1 className="register-title">Регистрация</h1>
          <p className="register-subtitle">Создай аккаунт</p>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Поле Email */}
            <div className="register-form-group">
              <label htmlFor="email" className="register-label">Email</label>
              <div className={`register-input-wrapper ${focusedField === 'email' ? 'focused' : ''}`}>
                <Mail size={20} className="register-input-icon" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your@email.com"
                  className="register-input"
                  disabled={isLoading}
                  required
                  data-testid="register-email-input"
                />
              </div>
            </div>

            {/* Поле Phone */}
            <div className="register-form-group">
              <label htmlFor="phone" className="register-label">Телефон (опционально)</label>
              <div className={`register-input-wrapper ${focusedField === 'phone' ? 'focused' : ''}`}>
                <Phone size={20} className="register-input-icon" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="+375 (XX) 123-45-67"
                  className="register-input"
                  disabled={isLoading}
                  //  required
                  data-testid="register-phone-input"
                />
              </div>
            </div>

            {/* Поле Password */}
            <div className="register-form-group">
              <label htmlFor="password" className="register-label">Пароль</label>
              <div className={`register-input-wrapper ${focusedField === 'password' ? 'focused' : ''}`}>
                <Lock size={20} className="register-input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Минимум 6 символов"
                  className="register-input"
                  disabled={isLoading}
                  required
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="register-toggle-password"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Поле Confirm Password */}
            <div className="register-form-group">
              <label htmlFor="confirmPassword" className="register-label">Подтверди пароль</label>
              <div className={`register-input-wrapper ${focusedField === 'confirmPassword' ? 'focused' : ''}`}>
                <Lock size={20} className="register-input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Повтори пароль"
                  className="register-input"
                  disabled={isLoading}
                  required
                  data-testid="register-confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="register-toggle-password"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <div 
                className="register-error" 
                role="alert"
                aria-live="polite"
                data-testid="register-error-message"
              >
                {error}
              </div>
            )}

            {/* Кнопка регистрации */}
            <button
              type="submit"
              className="register-button"
              disabled={isLoading}
              data-testid="register-submit-button"
            >
              {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
            </button>
          </form>

          {/* Ссылка на вход */}
          <p className="register-footer-text">
            Уже есть аккаунт?{' '}
            <button
              onClick={onSwitchToLogin}
              className="register-switch-button"
              disabled={isLoading}
              data-testid="register-switch-to-login-button"
            >
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
