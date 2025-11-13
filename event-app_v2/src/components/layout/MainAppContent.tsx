import { FC, useState, useMemo, useEffect, useCallback } from 'react';
import { Header, BottomNavigation, type NavTab } from '@components/layout';
import { EventCard, EmptyEventCard, ActionButtons } from '@components/events';
import { 
  SettingsModal, 
  EventDetailModal, 
  CreateEventModal, 
  SubscribedEventsModal 
} from '@components/modals';
import { LoadingSpinner, KeyboardHints } from '@components/common';
import { useEventPreferences, useEventNavigation, useInfiniteEventScroll } from '@hooks/useEventLogic';
import type { Event } from '@/types';
import './MainAppContent.css';

const MainAppContent: FC = () => {
  const { events, isLoading, error, hasMore, loadMoreEvents } = useInfiniteEventScroll();
  const [likedEvents, setLikedEvents] = useState<Event[]>([]);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [preferences, handleSettingsChange] = useEventPreferences();
  const { currentIndex, currentEvent, goToNextEvent } = useEventNavigation(events);

  const handleLike = useCallback(() => {
    if (currentEvent) {
      setLikedEvents(prev => [...prev, currentEvent]);
    }
    goToNextEvent();
  }, [currentEvent]);

  const handleDislike = useCallback(() => {
    goToNextEvent();
  }, [currentEvent]);

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

  // Обработчик клавиатурных сокращений
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'KeyX':
          event.preventDefault();
          handleDislike();
          break;
        case 'KeyA':
          event.preventDefault();
          handleLike();
          break;
        case 'KeyD':
          event.preventDefault();
          if (currentEvent) {
            setShowEventDetail(true);
          }
          break;
        case 'KeyQ':
          event.preventDefault();
          setShowSettings(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEvent, handleLike, handleDislike]);

  const showEmptyCard = useMemo(() => {
    const shouldShow = !currentEvent && !isLoading && !hasMore && events.length > 0;
    console.debug('[MainAppContent] showEmptyCard debug', {
      hasCurrentEvent: Boolean(currentEvent),
      isLoading,
      hasMore,
      eventsLength: events.length,
      shouldShow,
    });
    return shouldShow;
  }, [currentEvent, isLoading, hasMore]);

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

  return (
    <div className="app-container">
      {/* Основной контент - показываем в зависимости от activeTab */}
      {activeTab === 'discover' && (
        <>
          <Header onSettingsClick={() => setShowSettings(true)} />
          
          <main className="app-main">
            {/* Контент события */}
            <div className="event-content">
              {showEmptyCard ? (
                <EmptyEventCard />
              ) : currentEvent ? (
                <EventCard 
                  event={currentEvent} 
                  onClick={() => setShowEventDetail(true)} 
                />
              ) : (
                <LoadingSpinner />
              )}
            </div>

            {/* ActionButtons - на уровне приложения, независимые от обертки карточки */}
            {currentEvent && !showEmptyCard && (
              <ActionButtons 
                onLike={handleLike} 
                onDislike={handleDislike} 
              />
            )}

            {/* Информация о прогрессе */}
            <div className="events-footer">
              {isLoading && events.length > 0 && (
                <div className="loading-indicator">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </div>
              )}

              {events.length > 0 && (
                <div className="events-progress">
                  Событие {currentIndex + 1} из {events.length}
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* Модали */}
      <CreateEventModal isVisible={activeTab === 'create'} />
      
      <SubscribedEventsModal 
        isVisible={activeTab === 'subscribed'} 
        likedEvents={likedEvents}
        onRemove={(eventId) => setLikedEvents(prev => prev.filter(e => e.id !== eventId))}
      />

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

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Keyboard Hints Toggle */}
      <KeyboardHints />
    </div>
  );
};

export default MainAppContent;
