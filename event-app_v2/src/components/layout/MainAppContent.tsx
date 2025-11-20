import { FC, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Header, BottomNavigation, type NavTab } from '@components/layout';
import { EventCard, EmptyEventCard, ActionButtons, EventByCategory, UpcomingEventsView } from '@components/events';
import { CreateEventWizard } from '@components/create-event';
import { 
  SettingsModal, 
  EventDetailModal
} from '@components/modals';
import { LoadingSpinner, KeyboardHints } from '@components/common';
import { useEventPreferences, useEventNavigation, useInfiniteEventScroll } from '@hooks/useEventLogic';
import eventApi from '@/services/eventApi';
import { userService } from '@/services/userService';
import { useToast } from '@/contexts';
import type { Event } from '@/types';
import { ProfilePage } from '@/components/profile';
import './MainAppContent.css';
import './ViewModeToggle.css';

const MainAppContent: FC = () => {
  const { events, isLoading, error, hasMore, loadMoreEvents, setCategoryFilter } = useInfiniteEventScroll();
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [viewMode, setViewMode] = useState<'card' | 'category'>('card');
  const [preferences, handleSettingsChange] = useEventPreferences();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { error: showError, success: showSuccess } = useToast();
  
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

  const { currentIndex, currentEvent, goToNextEvent } = useEventNavigation(events, handleLoadMore);

  const handleAction = useCallback(async (action: 'like' | 'dislike' | 'neutral') => {
    if (!currentEvent || isActionLoading) return;

    setIsActionLoading(true);
    try {
      await eventApi.sendDiscoveryAction(currentEvent.id, action);
      goToNextEvent();
    } catch (err) {
      if (err instanceof Error && err.message === 'Event unavailable') {
        showError('Событие недоступно');
        goToNextEvent();
      } else {
        showError('Ошибка при выполнении действия');
        // Keep current card visible on network error
      }
    } finally {
      setIsActionLoading(false);
    }
  }, [currentEvent, isActionLoading, goToNextEvent, showError]);

  const handleLike = useCallback(() => handleAction('like'), [handleAction]);
  const handleDislike = useCallback(() => handleAction('dislike'), [handleAction]);
  const handleSkip = useCallback(() => handleAction('neutral'), [handleAction]);

  const handleSubscribe = useCallback(async () => {
    if (!currentEvent || isActionLoading) return;

    setIsActionLoading(true);
    try {
      await userService.subscribeToEvent(currentEvent.id, {
        dietary_preferences: "vegan"
      });
      showSuccess('Вы успешно записались!');
      goToNextEvent();
    } catch (err) {
      showError('Не удалось записаться на событие');
    } finally {
      setIsActionLoading(false);
    }
  }, [currentEvent, isActionLoading, goToNextEvent, showError, showSuccess]);

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
            setSelectedEvent(currentEvent);
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
        />
        <main className="app-main">
          <div className="error-message">
            <p>Ошибка при загрузке событий: {error}</p>
            <button onClick={loadMoreEvents} className="retry-button">
              Повторить попытку
            </button>
          </div>
          <BottomNavigation 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
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
        />
        <main className="app-main">
          <LoadingSpinner />
          <BottomNavigation 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
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
          />
          <main className="app-main">
            <ProfilePage onBack={() => setShowProfile(false)} />
            <BottomNavigation 
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </main>
        </>
      ) : (
        activeTab === 'discover' && (
          <>
            <Header 
              onSettingsClick={() => setShowSettings(true)} 
              onProfileClick={() => setShowProfile(true)}
            />
            
            <main 
              className="app-main"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="view-mode-toggle-container">
                <div className="view-mode-toggle">
                  <button 
                    className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                    onClick={() => setViewMode('card')}
                  >
                    По слоту
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'category' ? 'active' : ''}`}
                    onClick={() => setViewMode('category')}
                  >
                    По категориям
                  </button>
                </div>
              </div>

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
                        onClick={() => {
                          setSelectedEvent(currentEvent);
                          setShowEventDetail(true);
                        }} 
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
                      onSkip={handleSkip}
                      disabled={isActionLoading}
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
              <BottomNavigation 
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
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
      
      {activeTab === 'upcoming' && (
        <main className="app-main" style={{ overflowY: 'auto' }}>
          <UpcomingEventsView 
            onEventClick={(event) => {
              setSelectedEvent(event);
              setShowEventDetail(true);
            }}
            onGoToDiscovery={() => setActiveTab('discover')}
          />
          <BottomNavigation 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </main>
      )}

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onSettingsChange={handleSettingsChange}
      />

      <EventDetailModal 
        isOpen={showEventDetail}
        onClose={() => setShowEventDetail(false)}
        event={selectedEvent || currentEvent}
        onLike={handleSubscribe}
      />

      {/* Keyboard Hints Toggle */}
      <KeyboardHints />
    </div>
  );
};

export default MainAppContent;
