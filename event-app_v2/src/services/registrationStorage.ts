export interface PersistedRegistrationData {
  email: string;
  phone: string;
  password: string;
}

const KEY = 'registration_data_v1';

export const saveRegistrationData = (data: PersistedRegistrationData) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
};

export const loadRegistrationData = (): PersistedRegistrationData | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedRegistrationData;
  } catch (e) {
    return null;
  }
};

export const clearRegistrationData = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch (e) {
    // ignore
  }
};

export default {
  saveRegistrationData,
  loadRegistrationData,
  clearRegistrationData,
};
