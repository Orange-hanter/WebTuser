import { FC } from 'react';
import { Frown } from 'lucide-react';
import './EventCard.css';

const EmptyEventCard: FC = () => (
  <div className="event-card event-card-empty">
    <div className="event-card-empty-content">
      <Frown className="event-card-empty-icon" />
      <h2 className="event-card-empty-title">No more events</h2>
      <p className="event-card-empty-description">
        You've viewed all available events. Check back later for new ones!
      </p>
    </div>
  </div>
);

export default EmptyEventCard;
