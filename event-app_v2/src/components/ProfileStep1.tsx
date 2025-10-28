import { FC, useState } from 'react';
import { User, MapPin, FileText } from 'lucide-react';
import type { UserProfile } from '@/types';
import '@components/ProfileStep1.css';

interface ProfileStep1Props {
  onNext: (data: Partial<UserProfile>) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
  initialData?: Partial<UserProfile>;
}

const ProfileStep1: FC<ProfileStep1Props> = ({
  onNext,
  onSkip,
  isLoading = false,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    city: initialData.city || '',
    bio: initialData.bio || '',
  });
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName) {
      setError('Заполни имя и фамилию');
      return;
    }

    try {
      await onNext({
        firstName: formData.firstName,
        lastName: formData.lastName,
        city: formData.city,
        bio: formData.bio,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  return (
    <div className="profile-step-container">
      <div className="profile-step-background">
        <div className="profile-step-blob blob-1" />
        <div className="profile-step-blob blob-2" />
      </div>

      <div className="profile-step-content">
        <div className="profile-step-card">
          {/* Прогресс */}
          <div className="profile-step-progress">
            <div className="profile-step-progress-bar" style={{ width: '50%' }} />
          </div>

          <h1 className="profile-step-title">Расскажи о себе</h1>
          <p className="profile-step-subtitle">Шаг 1 из 2</p>

          <form onSubmit={handleSubmit} className="profile-step-form">
            {/* Имя и Фамилия в одной строке */}
            <div className="profile-step-row">
              <div className="profile-step-form-group">
                <label htmlFor="firstName" className="profile-step-label">Имя</label>
                <div className="profile-step-input-wrapper">
                  <User size={20} className="profile-step-input-icon" />
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="Иван"
                    className="profile-step-input"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="profile-step-form-group">
                <label htmlFor="lastName" className="profile-step-label">Фамилия</label>
                <div className="profile-step-input-wrapper">
                  <User size={20} className="profile-step-input-icon" />
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Петров"
                    className="profile-step-input"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Город */}
            <div className="profile-step-form-group">
              <label htmlFor="city" className="profile-step-label">Город</label>
              <div className="profile-step-input-wrapper">
                <MapPin size={20} className="profile-step-input-icon" />
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Москва"
                  className="profile-step-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="profile-step-form-group">
              <label htmlFor="bio" className="profile-step-label">О себе</label>
              <div className="profile-step-textarea-wrapper">
                <FileText size={20} className="profile-step-input-icon" />
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Расскажи о себе..."
                  className="profile-step-textarea"
                  disabled={isLoading}
                  rows={4}
                />
              </div>
            </div>

            {/* Ошибка */}
            {error && <div className="profile-step-error">{error}</div>}

            {/* Кнопки */}
            <div className="profile-step-buttons">
              <button
                type="button"
                onClick={onSkip}
                className="profile-step-button secondary"
                disabled={isLoading}
              >
                Пропустить
              </button>
              <button
                type="submit"
                className="profile-step-button primary"
                disabled={isLoading}
              >
                {isLoading ? 'Загрузка...' : 'Далее'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileStep1;
