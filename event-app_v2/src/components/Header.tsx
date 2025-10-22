import { FC } from 'react';
import { Settings, Search } from 'lucide-react';
import '@components/Header.css';

interface HeaderProps {
  onSettingsClick: () => void;
}

const Header: FC<HeaderProps> = ({ onSettingsClick }) => (
  <header className="app-header">
    <div className="app-header-content">
      <h1 className="app-header-title">Афиша</h1>
      <div className="app-header-buttons">
        <button 
          onClick={onSettingsClick}
          className="app-header-button"
          aria-label="Настройки"
        >
          <Settings className="app-header-icon" />
        </button>
        <button 
          className="app-header-button"
          aria-label="Поиск"
        >
          <Search className="app-header-icon" />
        </button>
      </div>
    </div>
  </header>
);

export default Header;