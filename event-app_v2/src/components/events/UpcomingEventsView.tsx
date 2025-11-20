import { FC, useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
import { userService, EventWithSubscription } from '@/services/userService';
import { LoadingSpinner } from '@/components/common';
import './UpcomingEventsView.css';

interface UpcomingEventsViewProps {
  onEventClick: (event: EventWithSubscription) => void;
  onGoToDiscovery: () => void;
}

export const UpcomingEventsView: FC<UpcomingEventsViewProps> = ({ onEventClick, onGoToDiscovery }) => {
  const [events, setEvents] = useState<EventWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribingId, setUnsubscribingId] = useState<number | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUpcomingEvents();
      // Filter only confirmed or waitlisted
      const filtered = data.filter(e => 
        e.subscriptionStatus === 'confirmed' || e.subscriptionStatus === 'waitlisted'
      );
      setEvents(filtered);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить события');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async (e: React.MouseEvent, event: EventWithSubscription) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm(`Отписаться от "${event.title}"? Место освободится для других участников.`)) {
      return;
    }

    setUnsubscribingId(event.id);
    try {
      await userService.cancelParticipation(event.id);
      // Optimistic update
      setEvents(prev => prev.filter(item => item.id !== event.id));
    } catch (err) {
      if (err instanceof Error && err.message.includes('409')) {
        alert('Нельзя отписаться после начала события');
      } else {
        alert('Не удалось отписаться. Попробуйте позже.');
        // Revert or reload? Reloading is safer to sync state
        loadEvents();
      }
    } finally {
      setUnsubscribingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="upcoming-events-view">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="upcoming-events-view">
        <div className="empty-state">
          <AlertCircle size={48} className="empty-state-icon" color="#f87171" />
          <h3>Ошибка</h3>
          <p>{error}</p>
          <button className="btn-discovery" onClick={loadEvents}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="upcoming-events-view">
        <div className="empty-state">
          <Calendar size={48} className="empty-state-icon" />
          <h3>Нет запланированных событий</h3>
          <p>Вы пока не записаны ни на одно событие</p>
          <button className="btn-discovery" onClick={onGoToDiscovery}>
            Найти события
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="upcoming-events-view">
      <div className="upcoming-header">
        <h2 className="upcoming-title">Мои события</h2>
      </div>

      <div className="upcoming-list">
        {events.map(event => (
          <div 
            key={event.id} 
            className="upcoming-card"
            onClick={() => onEventClick(event)}
          >
            <div className="upcoming-card-header">
              <div>
                <h4 className="upcoming-card-title">{event.title}</h4>
                <div className={`status-badge status-${event.subscriptionStatus}`} style={{ marginTop: 8 }}>
                  {event.subscriptionStatus === 'confirmed' && 'Подтверждено'}
                  {event.subscriptionStatus === 'waitlisted' && 'В листе ожидания'}
                </div>
              </div>
            </div>

            <div className="upcoming-card-meta">
              <div className="meta-row">
                <Calendar size={14} />
                {new Date(event.date).toLocaleDateString()}
                <span style={{ margin: '0 4px' }}>•</span>
                <Clock size={14} />
                {event.time}
              </div>
              <div className="meta-row">
                <MapPin size={14} />
                {event.location}
              </div>
            </div>

            <div className="upcoming-card-actions">
              <button 
                className="btn-unsubscribe"
                onClick={(e) => handleUnsubscribe(e, event)}
                disabled={unsubscribingId === event.id}
              >
                {unsubscribingId === event.id ? '...' : (
                  <>
                    <XCircle size={16} />
                    Отписаться
                  </>
                )}
              </button>
              <button className="btn-details">
                Подробнее
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
