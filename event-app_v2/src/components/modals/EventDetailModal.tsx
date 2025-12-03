import { FC, useEffect } from 'react';
import { X, MapPin, Clock, Users, Star } from 'lucide-react';
import type { Event } from '@/types';
import { ParticipantAvatarStrip, AvatarWithPopover, ShareButton } from '@/components/common';
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

        <ShareButton 
          url={`${window.location.origin}/e/${event.id}`}
          className="modal-share-button"
          size={44}
          iconSize={20}
        />

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
              <div className="modal-rating-section">
                <div className="modal-rating">
                  <Star className="modal-rating-star" />
                  <span className="modal-rating-value">{event.rating}</span>
                </div>
                <span className="modal-date">{event.date}</span>
              </div>
            </div>
          </div>

          <div className="modal-organizer-section">
            {event.creator && (
              <div className="organizer-info">
                <span className="section-label">Организатор</span>
                <div className="organizer-row">
                  <AvatarWithPopover
                    userId={event.creator.id}
                    name={event.creator.name}
                    avatarUrl={event.creator.avatar}
                    size="md"
                  />
                  <span className="organizer-name">{event.creator.name}</span>
                </div>
              </div>
            )}
            <div className="event-key-details">
              <div className="detail-item">
                <span className="detail-label">Стоимость</span>
                <span className="detail-value">Бесплатно</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Формат</span>
                <span className="detail-value">Офлайн</span>
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
              {event.attendees} участников
            </div>
          </div>

          <div className="modal-description-section">
            <h3>О событии</h3>
            <p className="modal-description">
              {event.description}
            </p>
          </div>

          <div className="modal-tags">
            {event.tags.map((tag, index) => (
              <span key={index} className="modal-tag">
                #{tag}
              </span>
            ))}
          </div>

          <div className="modal-participants-section">
            <h3>Участники</h3>
            <ParticipantAvatarStrip 
              eventId={event.id}
              variant="expanded"
            />
          </div>

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