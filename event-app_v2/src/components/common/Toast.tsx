import { FC, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: FC<ToastProps> = ({ id, message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <AlertCircle />;
      case 'warning':
        return <AlertCircle />;
      case 'info':
        return <Info />;
    }
  };

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-message">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="toast-close"
      >
        <X />
      </button>
    </div>
  );
};

export default Toast;
