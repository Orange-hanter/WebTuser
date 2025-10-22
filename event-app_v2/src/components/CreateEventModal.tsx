import { FC } from 'react';
import '@components/CreateEventModal.css';

interface CreateEventModalProps {
  isVisible: boolean;
}

const CreateEventModal: FC<CreateEventModalProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h2>Создать новое событие</h2>
      </div>

      <div className="create-event-content">
        <iframe
          title="Форма создания события"
          className="create-event-iframe"
          src="https://docs.google.com/forms/d/e/1FAIpQLSfZ1qZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ/viewform?embedded=true"
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
        >
          Загрузка...
        </iframe>

        <div className="create-event-placeholder">
          <p>📋 Здесь будет форма создания события</p>
          <p>Вы можете подключить Google Form, Typeform или любую другую форму</p>
          
          <div className="placeholder-form">
            <div className="form-group">
              <label htmlFor="eventName">Название события</label>
              <input type="text" id="eventName" placeholder="Введите название события" />
            </div>

            <div className="form-group">
              <label htmlFor="eventType">Тип события</label>
              <select id="eventType">
                <option>Музыка</option>
                <option>Творчество</option>
                <option>Общение</option>
                <option>Искусство</option>
                <option>Здоровье</option>
                <option>Спорт</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="eventLocation">Место проведения</label>
              <input type="text" id="eventLocation" placeholder="Адрес или название места" />
            </div>

            <div className="form-group">
              <label htmlFor="eventDate">Дата</label>
              <input type="date" id="eventDate" />
            </div>

            <div className="form-group">
              <label htmlFor="eventTime">Время</label>
              <input type="time" id="eventTime" />
            </div>

            <div className="form-group">
              <label htmlFor="eventDescription">Описание</label>
              <textarea id="eventDescription" placeholder="Опишите ваше событие" rows={4}></textarea>
            </div>

            <button className="form-submit-btn">Создать событие</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;
