import { FC } from 'react';
import { Star } from 'lucide-react';
import '@components/EmptyState.css';

interface EmptyStateProps {
  onReset: () => void;
}

const EmptyState: FC<EmptyStateProps> = ({ onReset }) => (
  <div className="empty-state-container">
    <div className="empty-state-card">
      <Star className="empty-state-icon" />
      <h2 className="empty-state-title">Все мероприятия просмотрены!</h2>
      <p className="empty-state-message">Вы просмотрели все доступные события. Попробуйте изменить настройки фильтра.</p>
      <button 
        onClick={onReset}
        className="empty-state-button"
      >
        Настроить фильтры
      </button>
    </div>
  </div>
);

export default EmptyState;