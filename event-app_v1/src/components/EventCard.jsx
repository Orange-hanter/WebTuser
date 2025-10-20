// src/components/EventCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event, onDislike }) => {
  const navigate = useNavigate();

  const handleLike = () => {
    // При лайке — сразу на детали
    navigate(`/event/${event.id}`);
  };

  const handleDislike = () => {
    onDislike();
  };

  const handleCardClick = () => {
    navigate(`/event/${event.id}`);
  };

  return (
    <div className="tinder-container">
      <div className="tinder-card" onClick={handleCardClick}>
        <h2>{event.title}</h2>
        <p className="date">{event.date}</p>
        <p className="location">📍 {event.location}</p>
        <p className="desc">{event.shortDesc}</p>
      </div>

      <div className="tinder-actions">
        <button className="dislike-btn" onClick={handleDislike} aria-label="Не интересно">
          👎
        </button>
        <button className="like-btn" onClick={handleLike} aria-label="Нравится">
          👍
        </button>
      </div>
    </div>
  );
};

export default EventCard;