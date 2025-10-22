import { FC } from 'react';
import '@components/LoadingSpinner.css';

const LoadingSpinner: FC = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p className="loading-text">Загрузка событий...</p>
  </div>
);

export default LoadingSpinner;
