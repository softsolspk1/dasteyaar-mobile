import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import api from '../services/api';

interface Banner {
  _id: string;
  title: string;
  description?: string;
  image_url: string;
  cloudinary_id: string;
  order: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BannersResponse {
  success: boolean;
  data: {
    banners: Banner[];
    total: number;
  };
}

interface UseBannersReturn {
  banners: Banner[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBanners(): UseBannersReturn {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Add timeout to prevent hanging
      const response = await Promise.race([
        api.get<BannersResponse>('/banners/active'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]) as any;
      
      if (response.data.success) {
        const activeBanners = response.data.data.banners
          .filter(banner => banner.is_active)
          .sort((a, b) => a.order - b.order);
        
        setBanners(activeBanners);
      } else {
        throw new Error('Failed to fetch banners');
      }
    } catch (err: any) {
      setBanners([]);
      setError(err.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return {
    banners,
    loading,
    error,
    refresh,
  };
}
