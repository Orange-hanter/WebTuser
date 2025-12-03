import { FC, useState, useEffect } from 'react';
import { Participant, userService } from '@/services/userService';
import AvatarWithPopover from './AvatarWithPopover';
import './ParticipantAvatarStrip.css';

interface ParticipantAvatarStripProps {
  eventId: string;
  variant?: 'compact' | 'expanded'; // compact - на карточке, expanded - в модальном окне
}

const ParticipantAvatarStrip: FC<ParticipantAvatarStripProps> = ({
  eventId,
  variant = 'compact',
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadParticipants();
  }, [eventId]);

  const loadParticipants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getEventParticipants(eventId);
      setParticipants(data);
    } catch (err) {
      console.error('Failed to load participants:', err);
      setError('Не удалось загрузить участников');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmedCount = participants.filter(
    (p) => p.status === 'confirmed'
  ).length;

  if (isLoading) {
    return (
      <div className="participant-strip">
        <div className="loading-skeleton"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="participant-strip error">
        <p>{error}</p>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className={`participant-strip empty ${variant}`}>
        <div className="empty-content">
          <p className="empty-message">Еще никто не записался</p>
        </div>
      </div>
    );
  }

  const displayParticipants = participants.slice(0, variant === 'expanded' ? 12 : 8);
  const overflow = participants.length - displayParticipants.length;

  return (
    <div className={`participant-strip ${variant}`}>
      {variant === 'compact' && (
        <div className="participant-count">
          {confirmedCount} участников
        </div>
      )}
      <div className={`avatars-container ${variant}`}>
        {displayParticipants.map((participant) => (
          <div key={participant.user_id} className={`participant-item ${variant}`}>
            <AvatarWithPopover
              userId={participant.user_id}
              name={participant.public_name}
              avatarUrl={participant.avatar_url}
              size={variant === 'expanded' ? 'xl' : 'sm'}
              status={participant.status}
              useIconFallback={variant === 'expanded'}
            />
            {variant === 'expanded' && (
              <span className="participant-name">{participant.public_name.split(' ')[0]}</span>
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div className={`avatar-overflow-badge ${variant}`}>
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantAvatarStrip;
