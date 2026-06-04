import api from './api';

export interface City {
  _id: string;
  name: string;
  distributor_channel: 'pillbox' | 'other';
  status: 'active' | 'inactive';
}

/**
 * Fetch active cities from the backend
 */
export const getCities = async (): Promise<City[]> => {
  try {
    const response = await api.get('/cities/public');
    return response.data.data || [];
  } catch (error) {
    throw error;
  }
};
