// API Service для работы с событиями
// Для демонстрации используем JSONPlaceholder API и mock данные

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';
const EVENTS_BATCH_SIZE = 5; // Количество событий для загрузки за раз

// Mock данные для демонстрации
const mockEventTemplates = [
  {
    title: "Джаз на закате",
    type: "Музыка",
    location: "Парк Горького",
    time: "19:00",
    attendees: 24,
    rating: 4.8,
    description: "Живая джазовая музыка в уютном уголке парка. Приходите насладиться атмосферой и хорошей компанией.",
    image: "https://placehold.co/400x600/4F46E5/FFFFFF?text=Jazz",
    tags: ["музыка", "вечер", "расслабление"]
  },
  {
    title: "Арт-завтрак",
    type: "Творчество",
    location: "Кафе 'Богема'",
    time: "10:00",
    attendees: 12,
    rating: 4.6,
    description: "Начните день с творчества! Рисуйте за завтраком под руководством профессионального художника.",
    image: "https://placehold.co/400x600/EC4899/FFFFFF?text=Art",
    tags: ["творчество", "утро", "еда"]
  },
  {
    title: "Разговорный клуб",
    type: "Общение",
    location: "Библиотека им. Ленина",
    time: "18:30",
    attendees: 18,
    rating: 4.7,
    description: "Практикуйте английский язык в дружелюбной атмосфере. Все уровни приветствуются!",
    image: "https://placehold.co/400x600/10B981/FFFFFF?text=Club",
    tags: ["язык", "общение", "образование"]
  },
  {
    title: "Уличный перформанс",
    type: "Искусство",
    location: "Арбат",
    time: "16:00",
    attendees: 45,
    rating: 4.9,
    description: "Интерактивный перформанс современных танцоров. Присоединяйтесь к импровизации!",
    image: "https://placehold.co/400x600/F59E0B/FFFFFF?text=Perf",
    tags: ["танец", "искусство", "вечер"]
  },
  {
    title: "Йога на восходе",
    type: "Здоровье",
    location: "Пляж 'Сочи'",
    time: "07:00",
    attendees: 15,
    rating: 4.5,
    description: "Начните день с энергичной йога-практики на берегу моря. Инструктор международного класса.",
    image: "https://placehold.co/400x600/06B6D4/FFFFFF?text=Yoga",
    tags: ["здоровье", "утро", "спорт"]
  },
  {
    title: "Кино-марафон",
    type: "Развлечение",
    location: "Кинотеатр 'Октябрь'",
    time: "17:00",
    attendees: 35,
    rating: 4.7,
    description: "Марафон лучших фильмов года с закусками и напитками. Билеты включают весь день просмотра.",
    image: "https://placehold.co/400x600/8B5CF6/FFFFFF?text=Cinema",
    tags: ["кино", "развлечение", "день"]
  },
  {
    title: "Кулинарный мастер-класс",
    type: "Еда",
    location: "Кулинарная школа 'Вкус'",
    time: "14:00",
    attendees: 20,
    rating: 4.8,
    description: "Научитесь готовить итальянскую пасту от шефа Микеле. Включен обед и напитки.",
    image: "https://placehold.co/400x600/F97316/FFFFFF?text=Cook",
    tags: ["еда", "кулинария", "мастер-класс"]
  },
  {
    title: "Встреча стартап-сообщества",
    type: "Образование",
    location: "TechHub",
    time: "19:30",
    attendees: 50,
    rating: 4.6,
    description: "Нетворкинг и презентации новых проектов от молодых предпринимателей. Пиццу угощаем мы!",
    image: "https://placehold.co/400x600/06B6D4/FFFFFF?text=Startup",
    tags: ["бизнес", "технология", "сеть"]
  }
];

/**
 * Эндпоинт 1: Получение списка событий с пагинацией
 * Имитирует реальный API с параметрами limit и offset
 * @param {number} offset - Смещение от начала (для пагинации)
 * @param {number} limit - Количество событий для загрузки
 * @returns {Promise<Object>} Объект с массивом событий и метаданными
 */
export const fetchEventsBatch = async (offset = 0, limit = EVENTS_BATCH_SIZE) => {
  try {
    // Симуляция задержки сети
    await new Promise(resolve => setTimeout(resolve, 800));

    // Генерируем события с учетом offset
    const events = [];
    const totalEvents = 50; // Всего событий в "базе"

    for (let i = offset; i < offset + limit && i < totalEvents; i++) {
      const template = mockEventTemplates[i % mockEventTemplates.length];
      const date = new Date();
      date.setDate(date.getDate() + Math.floor(i / 2));

      events.push({
        id: i + 1,
        ...template,
        date: date.toLocaleDateString('ru-RU', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        }).charAt(0).toUpperCase() + date.toLocaleDateString('ru-RU', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        }).slice(1),
        attendees: template.attendees + Math.floor(Math.random() * 30),
        rating: (parseFloat(template.rating) + (Math.random() - 0.5) * 0.4).toFixed(1)
      });
    }

    return {
      success: true,
      data: events,
      pagination: {
        offset,
        limit,
        total: totalEvents,
        hasMore: offset + limit < totalEvents
      }
    };
  } catch (error) {
    console.error('Error fetching events batch:', error);
    throw new Error('Ошибка при загрузке событий');
  }
};

/**
 * Эндпоинт 2: Получение деталей одного события
 * @param {number} eventId - ID события
 * @returns {Promise<Object>} Полная информация о событии
 */
export const fetchEventDetails = async (eventId) => {
  try {
    // Симуляция задержки сети
    await new Promise(resolve => setTimeout(resolve, 400));

    const template = mockEventTemplates[(eventId - 1) % mockEventTemplates.length];
    
    return {
      success: true,
      data: {
        id: eventId,
        ...template,
        fullDescription: `${template.description} Это расширенное описание события с дополнительными деталями. Организаторы: команда профессионалов с опытом более 10 лет.`,
        organizer: {
          name: "ООО 'Культурные события'",
          rating: 4.8,
          reviews: 342
        }
      }
    };
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw new Error('Ошибка при загрузке деталей события');
  }
};

/**
 * Утилита для получения данных с реального API (пример)
 * Используется JSONPlaceholder как демонстрация
 */
export const fetchFromExternalAPI = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from external API:', error);
    throw error;
  }
};

export default {
  fetchEventsBatch,
  fetchEventDetails,
  fetchFromExternalAPI
};
