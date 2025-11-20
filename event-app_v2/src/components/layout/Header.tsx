import { FC } from 'react';
import { Settings, User } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  onSettingsClick: () => void;
  onProfileClick: () => void;
  viewMode?: 'card' | 'category';
  onViewModeChange?: (mode: 'card' | 'category') => void;
}

const Header: FC<HeaderProps> = ({ onSettingsClick, onProfileClick, viewMode, onViewModeChange }) => {
  return (
    <header className="app-header">
      <div className="app-header-content">
        <div className="header-left">
          <h1 className="app-header-title">Афиша</h1>
          {viewMode && onViewModeChange && (
            <div className="view-mode-toggle">
              <button 
                className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => onViewModeChange('card')}
              >
                По слоту
              </button>
              <button 
                className={`toggle-btn ${viewMode === 'category' ? 'active' : ''}`}
                onClick={() => onViewModeChange('category')}
              >
                По категориям
              </button>
            </div>
          )}
        </div>
        <div className="app-header-buttons">
          <button 
            onClick={onSettingsClick}
            className="app-header-button"
            aria-label="Настройки"
            title="Настройки"
          >
            <Settings className="app-header-icon" />
          </button>
          <button 
            onClick={onProfileClick}
            className="app-header-button"
            aria-label="Профиль"
            title="Профиль"
          >
            <User className="app-header-icon" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;