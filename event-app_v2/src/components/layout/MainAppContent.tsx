import { FC, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Header, BottomNavigation, type NavTab } from '@components/layout';
import { EventCard, EmptyEventCard, ActionButtons, CityOverview, UpcomingEventsView } from '@components/events';
import { CreateEventWizard } from '@components/create-event';
import { 
  SettingsModal, 
  EventDetailModal
} from '@components/modals';
import { LoadingSpinner, KeyboardHints } from '@components/common';
import { useEventPreferences, useDiscoveryQueue } from '@hooks/useEventLogic';
import { useToast } from '@/contexts';
import type { Event } from '@/types';
import { ProfilePage } from '@/components/profile';
import './MainAppContent.css';
import './ViewModeToggle.css';

const MainAppContent: FC = () => {
  const { 
    currentEvent, 
    isLoading, 
    error, 
    hasNoEvents, 
    expandedCategory, 
    initialize, 
    handleAction, 
    handleBook, 
    retry 
  } = useDiscoveryQueue();

  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [viewMode, setViewMode] = useState<'card' | 'category'>('card');
  const [preferences, handleSettingsChange] = useEventPreferences();
  const { success: showSuccess } = useToast();
  
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
    initialize(category);
    setViewMode('card');
  }, [initialize]);
  
  // Removed handleLoadMore and useEventNavigation as we use useDiscoveryQueue now

  const onLike = useCallback(() => handleAction('like'), [handleAction]);
  const onDislike = useCallback(() => handleAction('dislike'), [handleAction]);
  const onSkip = useCallback(() => handleAction('neutral'), [handleAction]);

  const handleSubscribe = useCallback(async () => {
    await handleBook();
    showSuccess('Вы успешно записались!');
  }, [handleBook, showSuccess]);

  // Обработчик клавиатурных сокращений
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'KeyX':
          event.preventDefault();
          onDislike();
          break;
        case 'KeyA':
          event.preventDefault();
          onLike();
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
  }, [currentEvent, onLike, onDislike]);

  const showEmptyCard = useMemo(() => {
    return hasNoEvents && !isLoading;
  }, [hasNoEvents, isLoading]);

  // Если ошибка при загрузке
  if (error && !currentEvent && viewMode === 'card') {
    return (
      <div className="app-container">
        <Header 
          onSettingsClick={() => setShowSettings(true)} 
          onProfileClick={() => setShowProfile(true)}
        />
        <main className="app-main">
          <div className="error-message">
            <p>Ошибка при загрузке событий: {error.message}</p>
            <button onClick={retry} className="retry-button">
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
  if (!currentEvent && isLoading && viewMode === 'card') {
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
                    Подбор
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'category' ? 'active' : ''}`}
                    onClick={() => setViewMode('category')}
                  >
                    Обзор города
                  </button>
                </div>
              </div>

              {viewMode === 'category' ? (
                <CityOverview 
                  isActive={viewMode === 'category'}
                  onCategorySelect={handleCategorySelect}
                  onEventClick={(eventId) => {
                    // TODO: Load event details and show modal
                    console.log('Event clicked:', eventId);
                  }}
                />
              ) : (
                <>
                  {/* Expanded Mode Banner */}
                  {expandedCategory && (
                    <div className="expanded-mode-banner">
                      <span>Фильтр: {expandedCategory}</span>
                      <button onClick={() => initialize()} className="close-banner">×</button>
                    </div>
                  )}

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
                        creatorId={currentEvent.creator?.id ?? undefined}
                        creatorName={currentEvent.creator?.name ?? undefined}
                        creatorAvatar={currentEvent.creator?.avatar ?? undefined}
                      />
                    ) : (
                      <LoadingSpinner />
                    )}
                  </div>

                  {/* ActionButtons - на уровне приложения, независимые от обертки карточки */}
                  {currentEvent && !showEmptyCard && (
                    <ActionButtons 
                      onLike={onLike} 
                      onDislike={onDislike}
                      onSkip={onSkip}
                      disabled={isLoading}
                      eventId={currentEvent.id}
                    />
                  )}
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
        event={selectedEvent || currentEvent || undefined}
        onLike={handleSubscribe}
      />

      {/* Keyboard Hints Toggle */}
      <KeyboardHints />
    </div>
  );
};

export default MainAppContent;
