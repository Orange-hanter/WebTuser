import { FC, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { PublicUserProfile } from '@/services/userService';
import './UserProfilePopover.css';

interface UserProfilePopoverProps {
  user: PublicUserProfile;
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

const UserProfilePopover: FC<UserProfilePopoverProps> = ({
  user,
  isOpen,
  onClose,
  anchorEl,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorEl &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen || !user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const hasTelegramPublic = user.telegram_public && user.telegram_username;

  return (
    <div className="user-profile-popover-overlay">
      <div ref={popoverRef} className="user-profile-popover">
        {/* Close button */}
        <button className="popover-close-btn" onClick={onClose}>
          <X size={16} />
        </button>

        {/* Avatar */}
        <div className="popover-avatar-container">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={`${user.firstName} ${user.lastName}`}
              className="popover-avatar"
            />
          ) : (
            <div className="popover-avatar-fallback">{initials}</div>
          )}
        </div>

        {/* Name */}
        <h3 className="popover-name">
          {user.firstName} {user.lastName}
        </h3>

        {/* Role badge */}
        {user.role && (
          <div className="role-badge">
            {user.role === 'creator' ? '👤 Организатор' : '👥 Участник'}
          </div>
        )}

        {/* Telegram status */}
        {hasTelegramPublic ? (
          <div className="telegram-status active">
            ✓ Telegram: @{user.telegram_username}
          </div>
        ) : (
          <div className="telegram-status inactive">
            Telegram не публичен
          </div>
        )}

        {/* CTA - Write button */}
        {hasTelegramPublic && (
          <a
            href={`https://t.me/${user.telegram_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="write-btn"
          >
            <Send size={16} />
            Написать
          </a>
        )}
      </div>
    </div>
  );
};

export default UserProfilePopover;
