import { FC } from 'react';
import { Heart, Trash2, Calendar, MapPin, Clock } from 'lucide-react';
import type { Event } from '@/types';
import './SubscribedEventsModal.css';

interface SubscribedEventsModalProps {
  isVisible: boolean;
  likedEvents: Event[];
  onRemove: (eventId: string | number) => void;
}

const SubscribedEventsModal: FC<SubscribedEventsModalProps> = ({ 
  isVisible, 
  likedEvents, 
  onRemove 
}) => {
  if (!isVisible) return null;

  return (
    <div className="subscribed-container">
      <div className="subscribed-header">
        <h2>Избранные события</h2>
        <span className="subscribed-count">{likedEvents.length}</span>
      </div>

      <div className="subscribed-content">
        {likedEvents.length === 0 ? (
          <div className="empty-subscribed">
            <Heart size={48} className="empty-icon" />
            <p>Вы еще не добавили события в избранное</p>
            <p className="empty-hint">Нажимайте сердечко, чтобы добавлять события сюда</p>
          </div>
        ) : (
          <div className="subscribed-list">
            {likedEvents.map((event) => (
              <div key={event.id} className="subscribed-item">
                <div className="subscribed-item-image">
                  <img src={event.image} alt={event.title} />
                </div>

                <div className="subscribed-item-info">
                  <h3 className="subscribed-item-title">{event.title}</h3>
                  
                  <div className="subscribed-item-details">
                    <div className="detail-badge">{event.type}</div>
                  </div>

                  <div className="subscribed-item-meta">
                    <div className="meta-item">
                      <Calendar size={16} />
                      <span>{event.date}</span>
                    </div>
                    <div className="meta-item">
                      <Clock size={16} />
                      <span>{event.time}</span>
                    </div>
                  </div>

                  <div className="subscribed-item-location">
                    <MapPin size={16} />
                    <span>{event.location}</span>
                  </div>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => onRemove(event.id)}
                  aria-label="Удалить из избранного"
                  title="Удалить из избранного"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribedEventsModal;
