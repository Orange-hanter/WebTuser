import { FC, useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { userService } from '@/services/userService';
import './ProfilePage.css'; // Reuse styles

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsLoading(true);
    try {
      await userService.changePassword({ current: currentPassword, new: newPassword });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка смены пароля');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2 className="modal-title">Смена пароля</h2>
        
        {success ? (
          <div className="success-message">
            Пароль успешно изменен!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="profile-form-group">
              <label className="profile-label">Текущий пароль</label>
              <div className="password-input-wrapper" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="profile-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: '#fff' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Новый пароль</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="profile-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Подтвердите пароль</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="profile-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message" style={{ color: '#f87171', marginBottom: 16 }}>{error}</div>}

            <div className="profile-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
