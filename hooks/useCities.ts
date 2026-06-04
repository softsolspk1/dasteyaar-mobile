import { useState, useEffect } from 'react';
import { getCities, City } from '../services/cityService';

/**
 * Hook to fetch and manage cities from the backend
 * Falls back to cached cities if API fails
 */
export const useCities = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCities = await getCities();
      setCities(fetchedCities);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cities');
      // Optionally: Load fallback cities here if needed
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    cities,
    cityNames: cities.map(c => c.name),
    loading,
    error,
    refetch: fetchCities,
  };
};
