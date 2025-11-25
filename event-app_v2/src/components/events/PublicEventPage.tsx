import { FC, useEffect, useState } from 'react';
import { MapPin, Clock, Users, Star } from 'lucide-react';
import type { Event } from '@/types';
import eventApi from '@/services/eventApi';
import { LoadingSpinner } from '@/components/common';
import { useAuthContext, useToast } from '@/contexts';
import './PublicEventPage.css';

interface PublicEventPageProps {
  eventId: string;
}

const PublicEventPage: FC<PublicEventPageProps> = ({ eventId }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuthContext();
  const [subscribing, setSubscribing] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await eventApi.fetchEventDetails(eventId);
        setEvent(response.data);
      } catch (err) {
        console.error(err);
        setError('Событие не найдено или недоступно');
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId]);

  const handleSubscribe = async () => {
    if (!event) return;

    if (isAuthenticated) {
      setSubscribing(true);
      try {
        await eventApi.subscribeToEvent(event.id);
        showSuccess('Вы успешно записались!');
        // Optional: Redirect to upcoming events or show confirmation
      } catch (err) {
        console.error(err);
        showError('Ошибка при записи на событие');
      } finally {
        setSubscribing(false);
      }
    } else {
      const next = `/e/${event.id}`;
      const intent = 'subscribe';
      window.location.href = `/login?next=${encodeURIComponent(next)}&intent=${intent}`;
    }
  };

  // Check for intent after login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get('intent');
    if (isAuthenticated && intent === 'subscribe' && event) {
        handleSubscribe();
        // Clear intent from URL to prevent double subscription on refresh
        window.history.replaceState({}, '', `/e/${eventId}`);
    }
  }, [isAuthenticated, event]);

  if (loading) return <LoadingSpinner />;
  if (error || !event) return <div className="public-event-error">{error}</div>;

  return (
    <div className="public-event-container">
      <div className="public-event-image-wrapper">
        <img 
          src={event.image} 
          alt={event.title}
          className="public-event-image"
        />
      </div>
      
      <div className="public-event-content">
        <div className="public-event-header">
          <h1 className="public-event-title">{event.title}</h1>
          <span className="public-event-type">{event.type}</span>
        </div>

        <div className="public-event-info-grid">
          <div className="public-event-info-item">
            <MapPin size={20} />
            {event.location}
          </div>
          <div className="public-event-info-item">
            <Clock size={20} />
            {event.time}
          </div>
          <div className="public-event-info-item">
            <Users size={20} />
            {event.attendees} участников
          </div>
           <div className="public-event-info-item">
            <Star size={20} />
            {event.rating}
          </div>
        </div>

        <p className="public-event-description">
          {event.description}
        </p>

        <div className="public-event-tags">
          {event.tags.map((tag, index) => (
            <span key={index} className="public-event-tag">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="public-event-footer">
        <button 
          className="public-event-subscribe-btn"
          onClick={handleSubscribe}
          disabled={subscribing}
        >
          {subscribing ? 'Запись...' : 'Записаться'}
        </button>
      </div>
    </div>
  );
};

export default PublicEventPage;
