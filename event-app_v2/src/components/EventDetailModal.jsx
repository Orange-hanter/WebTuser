import React from 'react';
import { X, MapPin, Clock, Users, Star } from 'lucide-react';

const EventDetailModal = ({ isOpen, onClose, event, onLike, onDislike }) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="relative">
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-64 object-cover rounded-t-3xl"
            loading="lazy"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{event.title}</h2>
              <span className="text-purple-600 font-medium">{event.type}</span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-semibold">{event.rating}</span>
              </div>
              <span className="text-sm text-gray-500">{event.date}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4 text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {event.time}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {event.attendees}
            </div>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">
            {event.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {event.tags.map((tag, index) => (
              <span key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => {
                onDislike();
                onClose();
              }}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Не интересно
            </button>
            <button 
              onClick={() => {
                onLike();
                onClose();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              Участвовать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;