import React from 'react';
import { Heart, X } from 'lucide-react';

const ActionButtons = ({ onLike, onDislike }) => (
  <div className="flex justify-center gap-6 mt-6">
    <button 
      onClick={onDislike}
      className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all transform hover:scale-110"
    >
      <X className="w-8 h-8 text-red-500" />
    </button>
    <button 
      onClick={onLike}
      className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all transform hover:scale-110"
    >
      <Heart className="w-8 h-8 text-white fill-current" />
    </button>
  </div>
);

export default ActionButtons;