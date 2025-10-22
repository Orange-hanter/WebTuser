import { FC } from 'react';
import { X, MapPin, Clock, Users, Star } from 'lucide-react';
import type { Event } from '@/types';
import '@components/EventDetailModal.css';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | undefined;
  onLike: () => void;
  onDislike: () => void;
}

const EventDetailModal: FC<EventDetailModalProps> = ({ isOpen, onClose, event, onLike, onDislike }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-image-wrapper">
          <img 
            src={event.image} 
            alt={event.title}
            className="modal-image"
            loading="lazy"
          />
          <button 
            onClick={onClose}
            className="modal-close-button"
            aria-label="Закрыть"
          >
            <X className="modal-close-icon" />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="modal-header">
            <div className="modal-title-section">
              <h2>{event.title}</h2>
              <span className="modal-type">{event.type}</span>
            </div>
            <div className="modal-rating-section">
              <div className="modal-rating">
                <Star className="modal-rating-star" />
                <span className="modal-rating-value">{event.rating}</span>
              </div>
              <span className="modal-date">{event.date}</span>
            </div>
          </div>

          <div className="modal-info-row">
            <div className="modal-info-item">
              <MapPin className="modal-info-icon" />
              {event.location}
            </div>
            <div className="modal-info-item">
              <Clock className="modal-info-icon" />
              {event.time}
            </div>
            <div className="modal-info-item">
              <Users className="modal-info-icon" />
              {event.attendees}
            </div>
          </div>

          <p className="modal-description">
            {event.description}
          </p>

          <div className="modal-tags">
            {event.tags.map((tag, index) => (
              <span key={index} className="modal-tag">
                #{tag}
              </span>
            ))}
          </div>

          <div className="modal-buttons">
            <button 
              onClick={() => {
                onDislike();
                onClose();
              }}
              className="modal-button modal-button-dislike"
            >
              Не интересно
            </button>
            <button 
              onClick={() => {
                onLike();
                onClose();
              }}
              className="modal-button modal-button-like"
            >
              Участвовать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;