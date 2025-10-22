import { FC } from 'react';
import { Compass, Plus, Heart } from 'lucide-react';
import '@components/BottomNavigation.css';

export type NavTab = 'discover' | 'create' | 'subscribed';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const BottomNavigation: FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bottom-navigation">
      <button
        className={`bottom-nav-item ${activeTab === 'discover' ? 'active' : ''}`}
        onClick={() => onTabChange('discover')}
        aria-label="Обзор событий"
        title="Обзор событий"
      >
        <Compass size={24} />
        <span className="bottom-nav-label">Обзор</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'create' ? 'active' : ''}`}
        onClick={() => onTabChange('create')}
        aria-label="Создать событие"
        title="Создать событие"
      >
        <Plus size={24} />
        <span className="bottom-nav-label">Создать</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'subscribed' ? 'active' : ''}`}
        onClick={() => onTabChange('subscribed')}
        aria-label="Подписанные события"
        title="Подписанные события"
      >
        <Heart size={24} />
        <span className="bottom-nav-label">Избранное</span>
      </button>
    </nav>
  );
};

export default BottomNavigation;
