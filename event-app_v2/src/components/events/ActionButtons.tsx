import { FC } from 'react';
import { Heart, X, SkipForward } from 'lucide-react';
import './ActionButtons.css';

interface ActionButtonsProps {
  onLike: () => void;
  onDislike: () => void;
  onSkip: () => void;
  disabled?: boolean;
}

const ActionButtons: FC<ActionButtonsProps> = ({ onLike, onDislike, onSkip, disabled = false }) => (
  <div className="action-buttons">
    <button 
      onClick={onDislike}
      className="action-button action-button-dislike"
      aria-label="Не интересно"
      disabled={disabled}
    >
      <X className="action-button-icon" size={24} />
    </button>
    
    <button 
      onClick={onSkip}
      className="action-button action-button-skip"
      aria-label="Пропустить"
      disabled={disabled}
    >
      <SkipForward className="action-button-icon" size={28} />
    </button>

    <button 
      onClick={onLike}
      className="action-button action-button-like"
      aria-label="Интересно"
      disabled={disabled}
    >
      <Heart className="action-button-icon" size={24} />
    </button>
  </div>
);

export default ActionButtons;
