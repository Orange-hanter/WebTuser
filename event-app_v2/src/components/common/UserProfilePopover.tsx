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

  const initials = user.displayName ? user.displayName.charAt(0).toUpperCase() : '?';
  const telegramLink = user.socialLinks?.telegram;
  const telegramUsername = telegramLink ? telegramLink.split('/').pop() : null;

  return (
    <div className="user-profile-popover-overlay">
      <div ref={popoverRef} className="user-profile-popover">
        {/* Close button */}
        <button className="popover-close-btn" onClick={onClose}>
          <X size={16} />
        </button>

        {/* Avatar */}
        <div className="popover-avatar-container">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="popover-avatar"
            />
          ) : (
            <div className="popover-avatar-fallback">{initials}</div>
          )}
        </div>

        {/* Name */}
        <h3 className="popover-name">
          {user.displayName}
          {user.isVerified && (
            <span className="verified-badge-popover" title="Подтвержденный аккаунт">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </h3>

        {/* Telegram status */}
        {telegramUsername ? (
          <div className="telegram-status active">
            ✓ Telegram: @{telegramUsername}
          </div>
        ) : (
          <div className="telegram-status inactive">
            Telegram не публичен
          </div>
        )}

        {/* CTA - Write button */}
        {telegramLink && (
          <a
            href={telegramLink}
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
