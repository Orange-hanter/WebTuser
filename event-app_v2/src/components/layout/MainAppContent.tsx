import { FC, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Header, BottomNavigation, type NavTab } from '@components/layout';
import { EventCard, EmptyEventCard, ActionButtons, EventByCategory } from '@components/events';
import { CreateEventWizard } from '@components/create-event';
import { 
  SettingsModal, 
  EventDetailModal, 
  SubscribedEventsModal 
} from '@components/modals';
import { LoadingSpinner, KeyboardHints } from '@components/common';
import { useEventPreferences, useEventNavigation, useInfiniteEventScroll } from '@hooks/useEventLogic';
import type { Event } from '@/types';
import { ProfilePage } from '@/components/profile';
import './MainAppContent.css';

const MainAppContent: FC = () => {
  const { events, isLoading, error, hasMore, loadMoreEvents, setCategoryFilter } = useInfiniteEventScroll();
  const [likedEvents, setLikedEvents] = useState<Event[]>([]);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [viewMode, setViewMode] = useState<'card' | 'category'>('card');
  const [preferences, handleSettingsChange] = useEventPreferences();
  
  // Swipe handling
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      touchEnd.current = null;
      touchStart.current = touch.clientX;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      touchEnd.current = touch.clientX;
    }
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && viewMode === 'card') {
      setViewMode('category');
    }
    if (isRightSwipe && viewMode === 'category') {
      setViewMode('card');
    }
  };

  const handleCategorySelect = useCallback((category: string) => {
    setCategoryFilter(category);
    setViewMode('card');
  }, [setCategoryFilter]);
  
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMoreEvents();
    }
  }, [hasMore, isLoading, loadMoreEvents]);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    setShowProfile(false);
  };

  const { currentIndex, currentEvent, goToNextEvent } = useEventNavigation(events, handleLoadMore);

  const handleLike = useCallback(() => {
    if (currentEvent) {
      setLikedEvents(prev => [...prev, currentEvent]);
    }
    goToNextEvent();
  }, [currentEvent]);

  const handleDislike = useCallback(() => {
    goToNextEvent();
  }, [currentEvent]);

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
    // Show empty card if:
    // 1. We have no current event (either finished list or empty list)
    // 2. We are not loading
    // 3. We have no more events to load
    const shouldShow = !currentEvent && !isLoading && !hasMore;
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
  if (error && events.length === 0 && viewMode === 'card') {
    return (
      <div className="app-container">
        <Header 
          onSettingsClick={() => setShowSettings(true)} 
          onProfileClick={() => setShowProfile(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
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
  if (events.length === 0 && isLoading && viewMode === 'card') {
    return (
      <div className="app-container">
        <Header 
          onSettingsClick={() => setShowSettings(true)} 
          onProfileClick={() => setShowProfile(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <main className="app-main">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {showProfile ? (
        <>
          <Header 
            onSettingsClick={() => setShowSettings(true)} 
            onProfileClick={() => setShowProfile(true)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <main className="app-main">
            <ProfilePage onBack={() => setShowProfile(false)} />
          </main>
        </>
      ) : (
        activeTab === 'discover' && (
          <>
            <Header 
              onSettingsClick={() => setShowSettings(true)} 
              onProfileClick={() => setShowProfile(true)}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            
            <main 
              className="app-main"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {viewMode === 'category' ? (
                <EventByCategory 
                  isActive={viewMode === 'category'}
                  onCategorySelect={handleCategorySelect}
                />
              ) : (
                <>
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
                </>
              )}
            </main>
          </>
        )
      )}

      {/* Модали */}
      {activeTab === 'create' && (
        <CreateEventWizard 
          isVisible={true} 
          onClose={() => setActiveTab('discover')} 
        />
      )}
      
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
