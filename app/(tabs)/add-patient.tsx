import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AddPatientScreen() {
  const router = useRouter();

  useEffect(() => {
    // This screen should never be shown, redirect to patients
    router.replace('/(tabs)/patients');
  }, []);

  return null;
}
