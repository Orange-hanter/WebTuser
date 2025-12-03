import { FC, useState, useRef } from 'react';
import { User } from 'lucide-react';
import { PublicUserProfile, userService } from '@/services/userService';
import UserProfilePopover from './UserProfilePopover';
import './AvatarWithPopover.css';

interface AvatarWithPopoverProps {
  userId: string | number;
  name: string;
  avatarUrl?: string | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'confirmed' | 'waitlisted' | 'cancelled';
  tooltip?: string;
  onLoadingChange?: (loading: boolean) => void;
  useIconFallback?: boolean; // Использовать иконку User вместо инициалов
}

const AvatarWithPopover: FC<AvatarWithPopoverProps> = ({
  userId,
  name,
  avatarUrl,
  size = 'md',
  status,
  tooltip,
  onLoadingChange,
  useIconFallback = false,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleAvatarClick = async () => {
    if (isPopoverOpen) {
      setIsPopoverOpen(false);
      return;
    }

    if (userProfile) {
      setIsPopoverOpen(true);
      return;
    }

    // Fetch user profile
    setIsLoading(true);
    onLoadingChange?.(true);
    try {
      const profile = await userService.getPublicUserProfile(userId);
      setUserProfile(profile);
      setIsPopoverOpen(true);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = `avatar-${size}`;
  const statusClass = status ? `status-${status}` : '';

  return (
    <>
      <button
        ref={anchorRef}
        className={`avatar-button ${sizeClass} ${statusClass}`}
        onClick={handleAvatarClick}
        title={tooltip}
        disabled={isLoading}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="avatar-image"
          />
        ) : (
          <div className="avatar-fallback">
            {useIconFallback ? <User size={size === 'xl' ? 24 : size === 'lg' ? 20 : 16} /> : initials}
          </div>
        )}
      </button>

      {userProfile && (
        <UserProfilePopover
          user={userProfile}
          isOpen={isPopoverOpen}
          onClose={() => setIsPopoverOpen(false)}
          anchorEl={anchorRef.current}
        />
      )}
    </>
  );
};

export default AvatarWithPopover;
