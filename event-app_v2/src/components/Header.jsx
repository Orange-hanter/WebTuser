import React from 'react';
import { Settings, Search } from 'lucide-react';

const Header = ({ onSettingsClick }) => (
  <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
    <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
      <h1 className="text-xl font-bold text-purple-800">Афиша</h1>
      <div className="flex gap-2">
        <button 
          onClick={onSettingsClick}
          className="p-2 rounded-full hover:bg-purple-100 transition-colors"
        >
          <Settings className="w-5 h-5 text-purple-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-purple-100 transition-colors">
          <Search className="w-5 h-5 text-purple-600" />
        </button>
      </div>
    </div>
  </header>
);

export default Header;