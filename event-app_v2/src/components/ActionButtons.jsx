import React from 'react';
import { Heart, X } from 'lucide-react';
import './ActionButtons.css';

const ActionButtons = ({ onLike, onDislike }) => (
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
