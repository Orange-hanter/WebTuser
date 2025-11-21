import { FC } from 'react';
import { MapPin, Star, Clock, Share2 } from 'lucide-react';
import type { Event } from '@/types';
import { AvatarWithPopover } from '@/components/common';
import { useToast } from '@/contexts';
import './EventCard.css';

interface EventCardProps {
  event: Event;
  onClick: () => void;
  creatorId?: number | string;
  creatorName?: string;
  creatorAvatar?: string;
}

const EventCard: FC<EventCardProps> = ({ 
  event, 
  onClick, 
  creatorId,
  creatorName,
  creatorAvatar 
}) => {
  const { success: showSuccess } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/e/${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('Ссылка скопирована!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div 
      className="event-card"
      onClick={onClick}
    >
      <div className="event-card-image-container">
        <img 
          src={event.image} 
          alt={event.title}
          className="event-card-image"
          loading="lazy"
        />
        <div className="event-card-type-badge">
          {event.type}
        </div>
        <button 
          className="event-card-share-button"
          onClick={handleShare}
          title="Поделиться"
        >
          <Share2 size={18} />
        </button>
        <div className="event-card-overlay">
        <h2 className="event-card-title">
          {event.title}
        </h2>
        <div className="event-card-info">
          <div className="event-card-info-item">
            <MapPin size={16} />
            {event.location}
          </div>
          <div className="event-card-info-item">
            <Clock size={16} />
            {event.date}
          </div>
        </div>
      </div>
    </div>
    
    <div className="event-card-content">
      <div className="event-card-header">
        <div className="event-card-header-left">
          <div className="event-card-rating">
            <div className="event-card-rating-stars">
              <Star size={16} className="star-icon" />
              <span className="event-card-rating-value">{event.rating}</span>
            </div>
            <span className="event-card-attendees">({event.attendees} участников)</span>
          </div>
          <span className="event-card-date">{event.date}</span>
        </div>
        {creatorId && (
          <div className="event-card-creator-avatar">
            <AvatarWithPopover 
              userId={creatorId}
              name={creatorName || ''}
              avatarUrl={creatorAvatar}
              size="sm"
            />
          </div>
        )}
      </div>
      <p className="event-card-description">
        {event.description}
      </p>
      <div className="event-card-tags">
        {event.tags.map((tag, index) => (
          <span key={index} className="event-card-tag">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  </div>
  );
};

export default EventCard;
