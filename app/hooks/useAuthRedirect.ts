import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { getCurrentUserStatus } from '../../services/auth';

export function useAuthRedirect() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔔 onAuthStateChanged fired. user:', user?.uid ?? 'null');

      if (!user) {
        console.log('👉 Redirecting to /login');
        setTimeout(() => {
          router.replace('/login' as any);
          setIsReady(true);
        }, 100);
        return;
      }

      try {
        const status = await getCurrentUserStatus(user.uid);
        console.log('👤 Status:', status);
        setTimeout(() => {
          if (status === 'verified') router.replace('/home');
          else if (status === 'needs_id') router.replace('/id-upload');
          else router.replace('/pending');
          setIsReady(true);
        }, 100);
      } catch (err) {
        console.error('Error:', err);
        setTimeout(() => {
          router.replace('/login' as any);
          setIsReady(true);
        }, 100);
      }
    });

    return unsubscribe;
  }, []);

  return isReady;
}