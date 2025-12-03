import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, MapPin, AlertCircle, XCircle } from 'lucide-react';
import { userService, EventWithSubscription } from '@/services/userService';
import { LoadingSpinner } from '@/components/common';
import './UpcomingEventsView.css';

interface UpcomingEventsViewProps {
  onEventClick: (event: EventWithSubscription) => void;
  onGoToDiscovery: () => void;
}

// Глобальный флаг для предотвращения двойных запросов в Strict Mode
let globalUpcomingFetchInProgress = false;

export const UpcomingEventsView: FC<UpcomingEventsViewProps> = ({ onEventClick, onGoToDiscovery }) => {
  const [events, setEvents] = useState<EventWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);
  const isMounted = useRef(false);

  const loadEvents = useCallback(async (force = false) => {
    // Предотвращаем параллельные запросы
    if (!force && globalUpcomingFetchInProgress) return;
    
    globalUpcomingFetchInProgress = true;
    setIsLoading(true);
    try {
      const data = await userService.getUpcomingEvents();
      // Filter only confirmed or waitlisted
      const filtered = data.filter(e => 
        e.subscriptionStatus === 'confirmed' || e.subscriptionStatus === 'waitlisted'
      );
      if (isMounted.current) {
        setEvents(filtered);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError('Не удалось загрузить события');
      }
    } finally {
      globalUpcomingFetchInProgress = false;
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadEvents();
    return () => {
      isMounted.current = false;
    };
  }, [loadEvents]);

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
        loadEvents(true);
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
          <button className="btn-discovery" onClick={() => loadEvents(true)}>
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
            <img 
              src={event.image || '/placeholder-event.jpg'} 
              alt={event.title}
              className="upcoming-card-image"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            
            <div className="upcoming-card-body">
              <div className="upcoming-card-header">
                <h4 className="upcoming-card-title">{event.title}</h4>
                <span className="upcoming-card-type">{event.type}</span>
              </div>
              <div className="upcoming-card-author" aria-label="Автор события">
                <span className="author-avatar">
                  {/* Reuse simple img to keep preview light */}
                  {event.creator?.avatar ? (
                    <img src={event.creator.avatar} alt={event.creator?.name || 'Автор неизвестен'} className="author-avatar-img" />
                  ) : (
                    <img src={'/placeholder-avatar.svg'} alt={'Автор неизвестен'} className="author-avatar-img" />
                  )}
                </span>
                <span className="author-name">{event.creator?.name || 'Автор неизвестен'}</span>
              </div>

              <div className="upcoming-card-meta">
                <div className="meta-row">
                  <Calendar size={16} />
                  <span>{new Date(event.date).toLocaleDateString('ru-RU', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })}</span>
                  <div className="meta-divider" />
                  <Clock size={16} />
                  <span>{event.time}</span>
                </div>
                <div className="meta-row">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
              </div>

              <div className={`status-badge status-${event.subscriptionStatus}`}>
                {event.subscriptionStatus === 'confirmed' && 'Подтверждено'}
                {event.subscriptionStatus === 'waitlisted' && 'В листе ожидания'}
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
          </div>
        ))}
      </div>
    </div>
  );
};
