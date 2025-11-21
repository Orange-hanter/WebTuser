import { FC, useEffect } from 'react';
import { X, MapPin, Clock, Users, Star } from 'lucide-react';
import type { Event } from '@/types';
import { ParticipantAvatarStrip, AvatarWithPopover } from '@/components/common';
import './EventDetailModal.css';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | undefined;
  onLike: () => void;
}

const EventDetailModal: FC<EventDetailModalProps> = ({ isOpen, onClose, event, onLike }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button 
          onClick={onClose}
          className="modal-close-button"
          aria-label="Close"
        >
          <X className="modal-close-icon" />
        </button>

        <div className="modal-image-wrapper">
          <img 
            src={event.image} 
            alt={event.title}
            className="modal-image"
            loading="lazy"
          />
        </div>
        
        <div className="modal-body">
          <div className="modal-header">
            <div className="modal-title-section">
              <h2>{event.title}</h2>
              <span className="modal-type">{event.type}</span>
            </div>
            <div className="modal-header-right">
              {event.creator && (
                <div className="modal-creator">
                  <AvatarWithPopover
                    userId={event.creator.id}
                    name={event.creator.name}
                    avatarUrl={event.creator.avatar}
                    size="md"
                  />
                </div>
              )}
              <div className="modal-rating-section">
                <div className="modal-rating">
                  <Star className="modal-rating-star" />
                  <span className="modal-rating-value">{event.rating}</span>
                </div>
                <span className="modal-date">{event.date}</span>
              </div>
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

          {typeof event.id === 'number' && (
            <ParticipantAvatarStrip 
              eventId={event.id} 
              onSubscribeClick={() => {
                onLike();
                onClose();
              }}
            />
          )}

          <div className="modal-buttons">
            <button 
              onClick={() => {
                onLike();
                onClose();
              }}
              className="modal-button modal-button-like"
              style={{ width: '100%' }}
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