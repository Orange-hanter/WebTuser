import { FC } from 'react';
import { Settings, LogOut, Search } from 'lucide-react';
import { useAuthContext } from '@/contexts';
import './Header.css';

interface HeaderProps {
  onSettingsClick: () => void;
  viewMode?: 'card' | 'category';
  onViewModeChange?: (mode: 'card' | 'category') => void;
}

const Header: FC<HeaderProps> = ({ onSettingsClick, viewMode, onViewModeChange }) => {
  const { logout } = useAuthContext();

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
            className="app-header-button"
            aria-label="Поиск"
            title="Поиск"
          >
            <Search className="app-header-icon" />
          </button>
          <button 
            onClick={logout}
            className="app-header-button app-header-logout"
            aria-label="Выход"
            title="Выход"
          >
            <LogOut className="app-header-icon" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;