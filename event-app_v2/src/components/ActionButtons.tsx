import { FC } from 'react';
import { Heart, X } from 'lucide-react';
import './ActionButtons.css';

interface ActionButtonsProps {
  onLike: () => void;
  onDislike: () => void;
}

const ActionButtons: FC<ActionButtonsProps> = ({ onLike, onDislike }) => (
  <div className="action-buttons">
    <button 
      onClick={onDislike}
      className="action-button action-button-dislike"
      aria-label="Не интересно"
    >
      <X className="action-button-dislike-icon" />
    </button>
    <button 
      onClick={onLike}
      className="action-button action-button-like"
      aria-label="Участвовать"
    >
      <Heart className="action-button-like-icon" />
    </button>
  </div>
);

export default ActionButtons;
