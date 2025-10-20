import React from 'react';
import { MapPin, Clock, Star } from 'lucide-react';

const EventCard = ({ event, onClick }) => (
  <div 
    className="bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
    onClick={onClick}
  >
    <div className="relative h-96">
      <img 
        src={event.image} 
        alt={event.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute top-4 left-4">
        <span className="bg-white/90 backdrop-blur-sm text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
          {event.type}
        </span>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
          {event.title}
        </h2>
        <div className="flex items-center gap-4 text-white/90 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {event.location}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {event.time}
          </div>
        </div>
      </div>
    </div>
    
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-semibold">{event.rating}</span>
          <span className="text-gray-500">({event.attendees} участников)</span>
        </div>
        <span className="text-sm text-gray-500">{event.date}</span>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
        {event.description}
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        {event.tags.map((tag, index) => (
          <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  </div>
);

export default EventCard;