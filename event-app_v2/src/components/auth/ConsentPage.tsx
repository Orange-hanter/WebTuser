import { FC, useState } from 'react';
import { CheckCircle, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import './ConsentPage.css';

interface ConsentPageProps {
  onAccept: () => void;
  onDecline: () => void;
}

const ConsentPage: FC<ConsentPageProps> = ({ onAccept, onDecline }) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleAccept = () => {
    if (isAgreed) {
      onAccept();
    }
  };

  return (
    <div className="consent-container">
      {/* Анимированный фон */}
      <div className="consent-background">
        <div className="consent-gradient-blob blob-1" />
        <div className="consent-gradient-blob blob-2" />
      </div>

      <div className="consent-content">
        <div className="consent-card">
          {/* Заголовок */}
          <div className="consent-header">
            <div className="consent-icon">
              <Shield size={32} />
            </div>
            <h1 className="consent-title">Согласие на обработку данных</h1>
            <p className="consent-subtitle">
              Пожалуйста, ознакомьтесь с условиями использования сервиса перед регистрацией
            </p>
          </div>

          {/* Текст оферты */}
          <div className="consent-body">
            <div className="consent-section">
              <div 
                className="consent-section-header"
                onClick={() => toggleSection('general')}
              >
                <FileText size={20} />
                <span>Общие положения</span>
                {expandedSection === 'general' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSection === 'general' && (
                <div className="consent-section-content">
                  <p>
                    Настоящим я, действуя свободно, своей волей и в своём интересе, даю согласие 
                    администрации сервиса (далее — «Оператор») на обработку моих персональных данных 
                    в соответствии с Законом Республики Беларусь от 7 мая 2021 г. №99-З «О защите персональных данных».
                  </p>
                </div>
              )}
            </div>

            <div className="consent-section">
              <div 
                className="consent-section-header"
                onClick={() => toggleSection('data')}
              >
                <FileText size={20} />
                <span>Какие данные обрабатываются</span>
                {expandedSection === 'data' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSection === 'data' && (
                <div className="consent-section-content">
                  <p>Перечень персональных данных, на обработку которых даётся согласие:</p>
                  <ul>
                    <li>Фамилия, имя, отчество</li>
                    <li>Адрес электронной почты</li>
                    <li>Номер телефона</li>
                    <li>Фотография (аватар) профиля</li>
                    <li>Данные о местоположении (при использовании функций геолокации)</li>
                    <li>Данные об участии в мероприятиях</li>
                    <li>Данные аккаунта Telegram (при привязке)</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="consent-section">
              <div 
                className="consent-section-header"
                onClick={() => toggleSection('purpose')}
              >
                <FileText size={20} />
                <span>Цели обработки</span>
                {expandedSection === 'purpose' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSection === 'purpose' && (
                <div className="consent-section-content">
                  <p>Персональные данные обрабатываются в следующих целях:</p>
                  <ul>
                    <li>Регистрация и идентификация пользователя в сервисе</li>
                    <li>Обеспечение работы личного кабинета и функционала приложения</li>
                    <li>Организация и проведение мероприятий</li>
                    <li>Связь с пользователем для уведомлений о мероприятиях</li>
                    <li>Улучшение качества сервиса и пользовательского опыта</li>
                    <li>Выполнение требований законодательства РБ</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="consent-section">
              <div 
                className="consent-section-header"
                onClick={() => toggleSection('actions')}
              >
                <FileText size={20} />
                <span>Действия с данными</span>
                {expandedSection === 'actions' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSection === 'actions' && (
                <div className="consent-section-content">
                  <p>
                    Согласие даётся на совершение следующих действий: сбор, запись, систематизация, 
                    накопление, хранение, уточнение (обновление, изменение), извлечение, использование, 
                    передача (предоставление, доступ), обезличивание, блокирование, удаление, 
                    уничтожение персональных данных.
                  </p>
                  <p>
                    Обработка осуществляется как с использованием средств автоматизации, 
                    так и без использования таких средств.
                  </p>
                </div>
              )}
            </div>

            <div className="consent-section">
              <div 
                className="consent-section-header"
                onClick={() => toggleSection('rights')}
              >
                <FileText size={20} />
                <span>Ваши права</span>
                {expandedSection === 'rights' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSection === 'rights' && (
                <div className="consent-section-content">
                  <p>Вы имеете право:</p>
                  <ul>
                    <li>Получить информацию об обработке ваших персональных данных</li>
                    <li>Требовать уточнения, блокирования или уничтожения данных</li>
                    <li>Отозвать данное согласие в любое время, направив запрос через электронную почту поддержки или связавшись с администрацией напрямую</li>
                  </ul>
                  <p>
                    Согласие действует до момента его отзыва. В случае отзыва согласия 
                    ваш аккаунт и связанные с ним данные будут удалены.
                  </p>
                </div>
              )}
            </div>

            {/* Краткое резюме */}
            <div className="consent-summary">
              <h3>Кратко</h3>
              <p>
                Мы собираем ваши данные (email, телефон, имя) только для работы сервиса: 
                регистрации, организации мероприятий и связи с вами. Ваши данные защищены 
                и не передаются третьим лицам без вашего согласия. Вы можете удалить свой 
                аккаунт и все данные в любое время.
              </p>
            </div>
          </div>

          {/* Чекбокс согласия */}
          <div className="consent-checkbox-wrapper">
            <label className="consent-checkbox-label">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="consent-checkbox"
              />
              <span className="consent-checkbox-custom">
                {isAgreed && <CheckCircle size={18} />}
              </span>
              <span className="consent-checkbox-text">
                Я прочитал(а) и принимаю условия обработки персональных данных
              </span>
            </label>
          </div>

          {/* Кнопки */}
          <div className="consent-actions">
            <button
              type="button"
              className="consent-btn consent-btn-decline"
              onClick={onDecline}
            >
              Отказаться
            </button>
            <button
              type="button"
              className={`consent-btn consent-btn-accept ${!isAgreed ? 'disabled' : ''}`}
              onClick={handleAccept}
              disabled={!isAgreed}
            >
              <CheckCircle size={20} />
              Принять и продолжить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentPage;
