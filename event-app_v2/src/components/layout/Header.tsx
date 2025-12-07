import { FC } from 'react';
import { Settings, User, MessageSquare } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  onSettingsClick: () => void;
  onProfileClick: () => void;
  onFeedbackClick: () => void;
}

const Header: FC<HeaderProps> = ({ onSettingsClick, onProfileClick, onFeedbackClick }) => {
  return (
    <header className="app-header">
      <div className="app-header-content">
        <div className="header-left">
          <h1 className="app-header-title">Афиша</h1>
        </div>
        <div className="app-header-buttons">
          {/* 
          <button 
            onClick={onSettingsClick}
            className="app-header-button"
            aria-label="Настройки"
            title="Настройки"
          >
            <Settings className="app-header-icon" />
          </button>
          */}
          <button 
            onClick={onFeedbackClick}
            className="app-header-button"
            aria-label="Обратная связь"
            title="Обратная связь"
          >
            <MessageSquare className="app-header-icon" />
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