import { FC } from 'react';
import { Settings, LogOut, Search } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import './Header.css';

interface HeaderProps {
  onSettingsClick: () => void;
}

const Header: FC<HeaderProps> = ({ onSettingsClick }) => {
  const { logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header-content">
        <h1 className="app-header-title">Афиша</h1>
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