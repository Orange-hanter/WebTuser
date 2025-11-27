import { FC, useState, useEffect } from 'react';
import { Heart, X, ChevronRight } from 'lucide-react';
import './ActionButtons.css';

interface ActionButtonsProps {
  onLike: () => void;
  onDislike: () => void;
  onSkip: () => void;
  disabled?: boolean;
  // Provide current event id so the component can reset state when event changes
  eventId?: string | number | null;
}

const ActionButtons: FC<ActionButtonsProps> = ({ onLike, onDislike, onSkip, disabled = false, eventId = null }) => {
  const [liked, setLiked] = useState(false);

  // Reset liked state when the event changes
  useEffect(() => {
    setLiked(false);
  }, [eventId]);

  const handleLike = () => {
    if (disabled) return;
    setLiked(true);
    onLike();
  };

  const handleDislike = () => {
    if (disabled) return;
    setLiked(false);
    onDislike();
  };

  const handleSkip = () => {
    if (disabled) return;
    setLiked(false);
    onSkip();
  };

  return (
    <div className="action-buttons">
      <button 
        onClick={handleDislike}
        className="action-button action-button-dislike"
        aria-label="Не интересно"
        disabled={disabled}
      >
        <X className="action-button-icon" size={24} />
      </button>
      
      <button 
        onClick={handleSkip}
        className="action-button action-button-skip"
        aria-label="Пропустить"
        disabled={disabled}
      >
        <ChevronRight className="action-button-icon-back" size={28} />
      </button>

      <button 
        onClick={handleLike}
        className={`action-button action-button-like ${liked ? 'active' : ''}`}
        aria-label="Интересно"
        aria-pressed={liked}
        disabled={disabled}
      >
        <Heart className="action-button-icon" size={24} />
      </button>
    </div>
  );
};

export default ActionButtons;
