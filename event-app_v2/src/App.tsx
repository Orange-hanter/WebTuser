import { useState, useMemo, useEffect, FC } from 'react';
import Header from './components/Header';
import EventCard from './components/EventCard';
import ActionButtons from './components/ActionButtons';
import SettingsModal from './components/SettingsModal';
import EventDetailModal from './components/EventDetailModal';
import EmptyState from './components/EmptyState';
import LoadingSpinner from './components/LoadingSpinner';
import { useEventPreferences, useEventNavigation, useInfiniteEventScroll } from './hooks/useEventLogic';
import type { Event } from './types';
import './App.css';

const App: FC = () => {
  const { events, isLoading, error, hasMore, loadMoreEvents } = useInfiniteEventScroll();
  
  const [_likedEvents, setLikedEvents] = useState<Event[]>([]);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [preferences, handleSettingsChange] = useEventPreferences();
  const { currentIndex, currentEvent, goToNextEvent } = useEventNavigation(events);

  // Обработчик для загрузки еще событий
  useEffect(() => {
    const handleLoadMore = () => {
      if (hasMore && !isLoading) {
        loadMoreEvents();
      }
    };

    window.addEventListener('loadMoreEvents', handleLoadMore);
    return () => window.removeEventListener('loadMoreEvents', handleLoadMore);
  }, [hasMore, isLoading, loadMoreEvents]);

  const handleLike = () => {
    if (currentEvent) {
      setLikedEvents(prev => [...prev, currentEvent]);
    }
    goToNextEvent();
  };

  const handleDislike = () => {
    goToNextEvent();
  };

  const isEventsEnd = useMemo(() => {
    return currentIndex >= events.length && !isLoading && !hasMore;
  }, [currentIndex, events.length, isLoading, hasMore]);

  // Если ошибка при загрузке
  if (error && events.length === 0) {
    return (
      <div className="app-container">
        <Header onSettingsClick={() => setShowSettings(true)} />
        <main className="app-main">
          <div className="error-message">
            <p>Ошибка при загрузке событий: {error}</p>
            <button onClick={loadMoreEvents} className="retry-button">
              Повторить попытку
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Если событий еще нет и идет загрузка
  if (events.length === 0 && isLoading) {
    return (
      <div className="app-container">
        <Header onSettingsClick={() => setShowSettings(true)} />
        <main className="app-main">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  // Если все события просмотрены
  if (isEventsEnd) {
    return <EmptyState onReset={() => setShowSettings(true)} />;
  }

  return (
    <div className="app-container">
      <Header onSettingsClick={() => setShowSettings(true)} />
      
      <main className="app-main">
        <div className="event-wrapper">
          {currentEvent ? (
            <>
              <EventCard 
                event={currentEvent} 
                onClick={() => setShowEventDetail(true)} 
              />
              <ActionButtons 
                onLike={handleLike} 
                onDislike={handleDislike} 
              />
            </>
          ) : (
            <LoadingSpinner />
          )}
        </div>

        {/* Индикатор подзагрузки */}
        {isLoading && events.length > 0 && (
          <div className="loading-indicator">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
          </div>
        )}

        {/* Информация о прогрессе */}
        {events.length > 0 && (
          <div className="events-progress">
            Событие {currentIndex + 1} из {events.length}
          </div>
        )}
      </main>

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onSettingsChange={handleSettingsChange}
      />

      <EventDetailModal 
        isOpen={showEventDetail}
        onClose={() => setShowEventDetail(false)}
        event={currentEvent}
        onLike={handleLike}
        onDislike={handleDislike}
      />
    </div>
  );
};

export default App;