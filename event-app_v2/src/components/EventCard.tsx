import { FC } from 'react';
import { MapPin, Clock, Star } from 'lucide-react';
import type { Event } from '../types';
import './EventCard.css';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

const EventCard: FC<EventCardProps> = ({ event, onClick }) => (
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
            {event.time}
          </div>
        </div>
      </div>
    </div>
    
    <div className="event-card-content">
      <div className="event-card-header">
        <div className="event-card-rating">
          <div className="event-card-rating-stars">
            <Star size={16} className="star-icon" />
            <span className="event-card-rating-value">{event.rating}</span>
          </div>
          <span className="event-card-attendees">({event.attendees} участников)</span>
        </div>
        <span className="event-card-date">{event.date}</span>
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

export default EventCard;