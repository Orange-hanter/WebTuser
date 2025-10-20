// src/components/EventDetail.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { events } from '../data/events';
import './EventDetail.css';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = events.find(e => e.id === parseInt(id));

  if (!event) {
    return <div className="event-detail">Мероприятие не найдено</div>;
  }

  const handleSubscribe = () => {
    alert(`Вы подписались на "${event.title}"!`);
  };

  return (
    <div className="event-detail">
      <button className="back-btn" onClick={() => navigate('/')}>← К списку</button>
      <h1>{event.title}</h1>
      <p className="meta">📅 {event.date} | 📍 {event.location}</p>
      <div className="full-desc">{event.fullDesc}</div>
      <button className="subscribe-btn" onClick={handleSubscribe}>
        Подписаться на мероприятие
      </button>
    </div>
  );
};

export default EventDetail;