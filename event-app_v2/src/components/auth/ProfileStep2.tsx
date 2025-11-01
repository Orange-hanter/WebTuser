import { FC, useState } from 'react';
import { Heart, Music, Film, Book, Dumbbell, Palette, Code, Plane, Sparkles } from 'lucide-react';
import type { UserProfile } from '@/types';
import './ProfileStep2.css';

interface ProfileStep2Props {
  onComplete: (data: Partial<UserProfile>) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  initialData?: Partial<UserProfile>;
}

const INTEREST_OPTIONS = [
  'Спорт', 'Музыка', 'Искусство', 'Технология',
  'Путешествия', 'Фотография', 'Кулинария', 'Танцы',
  'Йога', 'Чтение', 'Кино', 'Пиво и вино',
  'Градостроительство', 'Дизайн', 'Мода', 'Волонтёрство'
];

const ProfileStep2: FC<ProfileStep2Props> = ({
  onComplete,
  onBack,
  isLoading = false,
  initialData = {}
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialData.interests || []
  );
  const [error, setError] = useState('');

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedInterests.length === 0) {
      setError('Выбери хотя бы один интерес');
      return;
    }

    try {
      await onComplete({
        interests: selectedInterests,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  return (
    <div className="profile-step2-container">
      <div className="profile-step2-background">
        <div className="profile-step2-blob blob-1" />
        <div className="profile-step2-blob blob-2" />
      </div>

      <div className="profile-step2-content">
        <div className="profile-step2-card">
          {/* Прогресс */}
          <div className="profile-step2-progress">
            <div className="profile-step2-progress-bar" style={{ width: '100%' }} />
          </div>

          <h1 className="profile-step2-title">Твои интересы</h1>
          <p className="profile-step2-subtitle">Выбери свои интересы (минимум 1)</p>

          <form onSubmit={handleSubmit} className="profile-step2-form">
            {/* Сетка интересов */}
            <div className="profile-step2-interests">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`profile-step2-interest-btn ${
                    selectedInterests.includes(interest) ? 'active' : ''
                  }`}
                  disabled={isLoading}
                >
                  <Sparkles size={18} />
                  {interest}
                </button>
              ))}
            </div>

            {/* Показатель */}
            <div className="profile-step2-counter">
              Выбрано: {selectedInterests.length}
            </div>

            {/* Ошибка */}
            {error && <div className="profile-step2-error">{error}</div>}

            {/* Кнопки */}
            <div className="profile-step2-buttons">
              <button
                type="button"
                onClick={onBack}
                className="profile-step2-button secondary"
                disabled={isLoading}
              >
                Назад
              </button>
              <button
                type="submit"
                className="profile-step2-button primary"
                disabled={isLoading || selectedInterests.length === 0}
              >
                {isLoading ? 'Загрузка...' : 'Завершить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileStep2;
