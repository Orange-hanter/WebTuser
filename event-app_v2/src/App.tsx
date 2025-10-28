import { useState, useMemo, useEffect, FC, useCallback } from 'react';
import Header from '@components/Header';
import EventCard from '@components/EventCard';
import ActionButtons from '@components/ActionButtons';
import SettingsModal from '@components/SettingsModal';
import EventDetailModal from '@components/EventDetailModal';
import EmptyState from '@components/EmptyState';
import LoadingSpinner from '@components/LoadingSpinner';
import BottomNavigation, { type NavTab } from '@components/BottomNavigation';
import CreateEventModal from '@components/CreateEventModal';
import SubscribedEventsModal from '@components/SubscribedEventsModal';
import KeyboardHints from '@components/KeyboardHints';
import AuthFlow from '@components/AuthFlow';
import { useAuth } from '@hooks/useAuth';
import { useEventPreferences, useEventNavigation, useInfiniteEventScroll } from '@hooks/useEventLogic';
import type { Event } from '@/types';
import './App.css';

const App: FC = () => {
  const { isAuthenticated } = useAuth();
  const [showApp, setShowApp] = useState(isAuthenticated);

  const handleAuthSuccess = useCallback(() => {
    setShowApp(true);
  }, []);

  // Отслеживаем выход пользователя
  useEffect(() => {
    if (!isAuthenticated && showApp) {
      setShowApp(false);
    }
  }, [isAuthenticated, showApp]);
  
  // Если пользователь не авторизован - показываем AuthFlow
  if (!showApp || !isAuthenticated) {
    return <AuthFlow onAuthSuccess={handleAuthSuccess} />;
  }

  const { events, isLoading, error, hasMore, loadMoreEvents } = useInfiniteEventScroll();
  
  const [_likedEvents, setLikedEvents] = useState<Event[]>([]);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  
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

  // Обработчик клавиатурных сокращений
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Не реагируем на клавиши, если пользователь печатает в input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Используем .code для работы с любыми раскладками клавиатуры
      // .code возвращает физическую позицию клавиши, независимо от языка
      switch (event.code) {
        case 'KeyX':
          // X - не нравится (дизлайк)
          event.preventDefault();
          handleDislike();
          break;
        case 'KeyA':
          // A - принять (лайк)
          event.preventDefault();
          handleLike();
          break;
        case 'KeyD':
          // D - открыть детали карточки
          event.preventDefault();
          if (currentEvent) {
            setShowEventDetail(true);
          }
          break;
        case 'KeyQ':
          // Q - открыть настройки
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
      {/* Основной контент - показываем в зависимости от activeTab */}
      {activeTab === 'discover' && (
        <>
          <Header onSettingsClick={() => setShowSettings(true)} />
          
          <main className="app-main">
            {/* Контент события */}
            <div className="event-content">
              {currentEvent ? (
                <EventCard 
                  event={currentEvent} 
                  onClick={() => setShowEventDetail(true)} 
                />
              ) : (
                <LoadingSpinner />
              )}
            </div>

{/* ActionButtons - на уровне приложения, независимые от обертки карточки */}
            {currentEvent && (
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
        likedEvents={_likedEvents}
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

export default App;