import { FC, useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import '@components/KeyboardHints.css';

const KeyboardHints: FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Используем физические коды клавиш вместо .key для работы с любыми раскладками
      // Shift + ? = Slash (физическая позиция)
      if (event.code === 'Slash' && event.shiftKey) {
        event.preventDefault();
        setIsVisible(!isVisible);
      }

      // Escape для закрытия
      if (event.code === 'Escape') {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button 
        className="keyboard-hints-toggle"
        onClick={() => setIsVisible(true)}
        title="Нажми Shift+? для подсказок"
      >
        <Keyboard size={20} />
      </button>
    );
  }

  return (
    <div className="keyboard-hints-overlay" onClick={() => setIsVisible(false)}>
      <div className="keyboard-hints-modal" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-hints-header">
          <h2>Сочетания клавиш</h2>
          <button 
            className="keyboard-hints-close"
            onClick={() => setIsVisible(false)}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        <div className="keyboard-hints-content">
          <div className="hint-group">
            <div className="hint-row">
              <kbd className="hint-key">A</kbd>
              <span className="hint-description">Принять (лайк)</span>
            </div>
            <div className="hint-row">
              <kbd className="hint-key">X</kbd>
              <span className="hint-description">Не нравится (дизлайк)</span>
            </div>
            <div className="hint-row">
              <kbd className="hint-key">D</kbd>
              <span className="hint-description">Открыть детали</span>
            </div>
            <div className="hint-row">
              <kbd className="hint-key">Q</kbd>
              <span className="hint-description">Открыть настройки</span>
            </div>
            <div className="hint-row">
              <kbd className="hint-key">Shift + ?</kbd>
              <span className="hint-description">Показать эту подсказку</span>
            </div>
            <div className="hint-row">
              <kbd className="hint-key">Esc</kbd>
              <span className="hint-description">Закрыть подсказку</span>
            </div>
          </div>
        </div>

        <div className="keyboard-hints-footer">
          <p>Нажми Esc или кликни снаружи, чтобы закрыть</p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardHints;
