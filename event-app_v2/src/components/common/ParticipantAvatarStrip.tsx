import { FC, useState, useEffect } from 'react';
import { Participant, userService } from '@/services/userService';
import AvatarWithPopover from './AvatarWithPopover';
import './ParticipantAvatarStrip.css';

interface ParticipantAvatarStripProps {
  eventId: number;
  onSubscribeClick?: () => void;
}

const ParticipantAvatarStrip: FC<ParticipantAvatarStripProps> = ({
  eventId,
  onSubscribeClick,
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
      <div className="participant-strip empty">
        <div className="empty-content">
          <p className="empty-message">Еще никто не записался</p>
          <button className="subscribe-cta" onClick={onSubscribeClick}>
            Записаться
          </button>
        </div>
      </div>
    );
  }

  const displayParticipants = participants.slice(0, 8);
  const overflow = participants.length - displayParticipants.length;

  return (
    <div className="participant-strip">
      <div className="participant-count">
        {confirmedCount} участников
      </div>
      <div className="avatars-container">
        {displayParticipants.map((participant) => (
          <AvatarWithPopover
            key={participant.user_id}
            userId={participant.user_id}
            name={participant.public_name}
            avatarUrl={participant.avatar_url}
            size="sm"
            status={participant.status}
          />
        ))}
        {overflow > 0 && (
          <div className="avatar-overflow-badge">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantAvatarStrip;
