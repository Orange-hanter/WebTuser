import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import EventCard from './components/EventCard';
import ActionButtons from './components/ActionButtons';
import SettingsModal from './components/SettingsModal';
import EventDetailModal from './components/EventDetailModal';
import EmptyState from './components/EmptyState';
import { useEventPreferences, useEventNavigation } from './hooks/useEventLogic';
import { mockEvents } from './data/mockEvents';

const App = () => {
  const [events] = useState(mockEvents);
  const [likedEvents, setLikedEvents] = useState([]);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [preferences, handleSettingsChange] = useEventPreferences();
  const { currentIndex, currentEvent, goToNextEvent, resetToStart } = useEventNavigation(events);

  const handleLike = () => {
    setLikedEvents(prev => [...prev, currentEvent]);
    goToNextEvent();
  };

  const handleDislike = () => {
    goToNextEvent();
  };

  const isEventsEnd = useMemo(() => {
    return currentIndex >= events.length;
  }, [currentIndex, events.length]);

  if (isEventsEnd) {
    return <EmptyState onReset={() => setShowSettings(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Header onSettingsClick={() => setShowSettings(true)} />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="relative mb-24">
          <EventCard 
            event={currentEvent} 
            onClick={() => setShowEventDetail(true)} 
          />
          <ActionButtons 
            onLike={handleLike} 
            onDislike={handleDislike} 
          />
        </div>
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