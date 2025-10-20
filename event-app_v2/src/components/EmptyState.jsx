import React from 'react';
import { Star } from 'lucide-react';

const EmptyState = ({ onReset }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md">
        <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Все мероприятия просмотрены!</h2>
        <p className="text-gray-600 mb-6">Вы просмотрели все доступные события. Попробуйте изменить настройки фильтра.</p>
        <button 
          onClick={onReset}
          className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
        >
          Настроить фильтры
        </button>
      </div>
    </div>
  </div>
);

export default EmptyState;