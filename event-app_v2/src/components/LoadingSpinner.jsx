import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p className="loading-text">Загрузка событий...</p>
  </div>
);

export default LoadingSpinner;
