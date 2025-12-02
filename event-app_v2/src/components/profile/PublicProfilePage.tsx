import { FC, useEffect, useState } from 'react';
import { MapPin, Calendar, Twitter, Send, Instagram, Linkedin, Globe, UserX, AlertCircle } from 'lucide-react';
import { userService, PublicUserProfile } from '@/services/userService';
import './PublicProfilePage.css';

interface PublicProfilePageProps {
  userId: string;
}

export const PublicProfilePage: FC<PublicProfilePageProps> = ({ userId }) => {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code: number; message: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await userService.getPublicUserProfile(userId);
        setProfile(data);
      } catch (err: any) {
        console.error('Failed to load public profile:', err);
        
        // Determine error code based on message or error object structure
        // Ideally userService should throw typed errors or we parse the message
        let code = 500;
        let message = 'Ошибка сервера';

        if (err.message === 'User not found') {
          code = 404;
          message = 'Пользователь не найден';
        } else if (err.message === 'Invalid user ID') {
          code = 400;
          message = 'Некорректный ID пользователя';
        } else if (err.message.includes('Too many requests')) {
          code = 429;
          message = 'Слишком много запросов. Попробуйте позже.';
        }

        setError({ code, message });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="public-profile-container">
        <div className="public-profile-card">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <div className="skeleton skeleton-avatar"></div>
            </div>
            <div className="profile-info" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="skeleton skeleton-text skeleton-title"></div>
              <div className="skeleton skeleton-text skeleton-subtitle"></div>
              <div className="profile-stats">
                <div className="stat-item">
                  <div className="skeleton skeleton-text skeleton-stat"></div>
                  <span className="stat-label">событий</span>
                </div>
              </div>
            </div>
          </div>
          <div className="profile-details">
            <div className="profile-section">
              <div className="skeleton skeleton-text skeleton-line"></div>
              <div className="skeleton skeleton-text skeleton-line" style={{ width: '80%' }}></div>
            </div>
            <div className="profile-meta">
              <div className="skeleton skeleton-text skeleton-meta"></div>
              <div className="skeleton skeleton-text skeleton-meta"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-profile-error">
        {error.code === 404 ? (
          <div className="error-content">
            <UserX size={48} className="error-icon" />
            <h2>Пользователь не найден</h2>
            <p>Возможно, профиль был удален или скрыт настройками приватности.</p>
            <button onClick={() => window.history.back()} className="back-button">
              Вернуться назад
            </button>
          </div>
        ) : (
          <div className="error-content">
            <AlertCircle size={48} className="error-icon" />
            <h2>Ошибка загрузки</h2>
            <p>{error.message}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Попробовать снова
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!profile) return null;

  const renderSocialIcon = (network: string) => {
    switch (network) {
      case 'twitter': return <Twitter size={20} />;
      case 'telegram': return <Send size={20} />;
      case 'instagram': return <Instagram size={20} />;
      case 'linkedin': return <Linkedin size={20} />;
      default: return <Globe size={20} />;
    }
  };

  return (
    <div className="public-profile-container">
      <div className="public-profile-card">
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={`${profile.displayName} avatar`} 
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {profile.isVerified && (
              <div className="verified-badge" title="Подтвержденный аккаунт">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
          
          <div className="profile-info">
            <h1 className="profile-name">{profile.displayName}</h1>
            {profile.username && (
              <span className="profile-username">@{profile.username}</span>
            )}
            
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{profile.publicEventsCount}</span>
                <span className="stat-label">событий</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-details">
          {profile.bio && (
            <div className="profile-section">
              <h3>О себе</h3>
              <p className="profile-bio">{profile.bio}</p>
            </div>
          )}

          <div className="profile-meta">
            {(profile.city || profile.country) && (
              <div className="meta-item">
                <MapPin size={18} />
                <span>
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            
            <div className="meta-item">
              <Calendar size={18} />
              <span>На сайте с {new Date(profile.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="profile-section">
              <h3>Социальные сети</h3>
              <div className="social-links">
                {Object.entries(profile.socialLinks).map(([network, url]) => {
                  if (!url || typeof url !== 'string') return null;
                  return (
                    <a 
                      key={network}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`social-link social-${network}`}
                      title={network}
                    >
                      {renderSocialIcon(network)}
                      <span>{network.charAt(0).toUpperCase() + network.slice(1)}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
