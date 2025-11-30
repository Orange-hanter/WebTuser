import { FC } from 'react';
import { Frown } from 'lucide-react';
import './EventCard.css';

const EmptyEventCard: FC = () => (
  <div className="event-card event-card-empty">
    <div className="event-card-empty-content">
      <Frown className="event-card-empty-icon" />
      <h2 className="event-card-empty-title">Событий больше нет</h2>
      <p className="event-card-empty-description">
        Вы просмотрели все доступные события. Загляните позже — появятся новые.
      </p>
    </div>
  </div>
);

export default EmptyEventCard;
