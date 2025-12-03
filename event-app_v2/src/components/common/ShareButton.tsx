import { FC, useState } from 'react';
import { Share2 } from 'lucide-react';
import './ShareButton.css';

interface ShareButtonProps {
  url: string;
  className?: string;
  size?: number;
  iconSize?: number;
}

const ShareButton: FC<ShareButtonProps> = ({ 
  url, 
  className = '', 
  size = 36,
  iconSize = 18 
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(url);
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button 
      className={`share-button ${isClicked ? 'clicked' : ''} ${className}`}
      onClick={handleShare}
      title="Поделиться"
      style={{ width: size, height: size }}
    >
      <Share2 size={iconSize} />
    </button>
  );
};

export default ShareButton;
