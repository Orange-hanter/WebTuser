import type { CreateEventData } from '@/types';

export const STORAGE_KEY = 'create_event_draft';
export const DRAFT_EXPIRY_DAYS = 7;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const INITIAL_DATA: CreateEventData = {
  type: '',
  title: '',
  description: '',
  date: '',
  time: '',
  duration: 60,
  location: '',
  organizerContact: '',
  priceType: 'free',
  price: '',
  needReg: false,
  dynamicFields: {},
};

export const EVENT_TYPES = [
  'Музыка',
  'Творчество', 
  'Общение',
  'Искусство',
  'Здоровье',
  'Спорт'
];

export const TYPE_MAPPING: Record<string, string> = {
  'Музыка': 'concert',
  'Творчество': 'workshop',
  'Общение': 'networking',
  'Искусство': 'exhibition',
  'Здоровье': 'health',
  'Спорт': 'sports',
  'Театр': 'theatre',
  'Лекция': 'lecture'
};

export interface DynamicField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'checkbox';
  required?: boolean;
}

export const DYNAMIC_SCHEMAS: Record<string, DynamicField[]> = {
  'Музыка': [
    { name: 'genre', label: 'Жанр музыки', type: 'text', required: true },
    { name: 'lineup', label: 'Состав исполнителей', type: 'text', required: false },
    { name: 'ageLimit', label: 'Возрастное ограничение', type: 'number', required: true },
  ],
  'Творчество': [
    { name: 'materials', label: 'Материалы включены', type: 'checkbox' },
    { name: 'skillLevel', label: 'Уровень подготовки', type: 'text', required: true },
  ],
  'Спорт': [
    { name: 'sportType', label: 'Вид спорта', type: 'text', required: true },
    { name: 'equipmentRequired', label: 'Нужен свой инвентарь', type: 'checkbox' },
  ],
  'default': [
    { name: 'requirements', label: 'Требования к участникам', type: 'text', required: false },
    { name: 'maxParticipants', label: 'Макс. участников', type: 'number', required: true },
  ]
};

export const TOTAL_STEPS = 6;
