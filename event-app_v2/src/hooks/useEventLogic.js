import { useState, useCallback } from 'react';

export const useEventPreferences = () => {
  const [preferences, setPreferences] = useState({
    types: ['Музыка', 'Творчество', 'Общение', 'Искусство', 'Здоровье'],
    distance: 5,
    timeOfDay: 'any'
  });

  const handleSettingsChange = useCallback((key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  return [preferences, handleSettingsChange];
};

export const useEventNavigation = (events) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const goToNextEvent = useCallback(() => {
    setCurrentIndex(prev => (prev < events.length - 1 ? prev + 1 : 0));
  }, [events.length]);

  const resetToStart = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  return { 
    currentIndex, 
    currentEvent: events[currentIndex], 
    goToNextEvent, 
    resetToStart 
  };
};