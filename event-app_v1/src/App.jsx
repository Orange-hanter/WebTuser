// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EventCard from './components/EventCard';
import EventDetail from './components/EventDetail';
import { events as initialEvents } from './data/events';
import './App.css';

function App() {
  const [events] = useState(initialEvents);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleLike = (id) => {
    // Переход на детали при лайке
    // (в EventCard мы вызовем navigate(`/event/${id}`))
  };

  const handleDislike = () => {
    // Просто переходим к следующей карточке
    if (currentIndex < events.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentEvent = events[currentIndex];

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Мероприятия</h1>
        </header>
        <main>
          <Routes>
            <Route
              path="/"
              element={
                currentEvent ? (
                  <EventCard
                    event={currentEvent}
                    onLike={() => {}} // переход обрабатывается внутри через navigate
                    onDislike={handleDislike}
                  />
                ) : (
                  <div className="no-more">
                    <h2>Больше нет мероприятий 😢</h2>
                    <button onClick={() => setCurrentIndex(0)}>Начать сначала</button>
                  </div>
                )
              }
            />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;