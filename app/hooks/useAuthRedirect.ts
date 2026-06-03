import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { getCurrentUserStatus } from '../../services/auth';
import { registerPushToken } from '../../services/notificationService';

export function useAuthRedirect() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed. user:', user?.uid ?? 'null');

      if (!user) {
        console.log('Redirecting to login screen');
        setTimeout(() => {
          router.replace('/login');
          setIsReady(true);
        }, 100);
        return;
      }

      try {
        const status = await getCurrentUserStatus(user.uid);
        console.log('User status:', status);

        setTimeout(() => {
          if (status === 'verified') {
            void registerPushToken(user.uid).catch((error) => {
              console.warn('Push token registration failed during auth redirect:', error);
            });
            router.replace('/home');
          } else if (status === 'needs_id') {
            router.replace('/id-upload');
          } else {
            router.replace('/pending');
          }
          setIsReady(true);
        }, 100);
      } catch (err) {
        console.error('Error resolving auth redirect:', err);
        setTimeout(() => {
          router.replace('/login' as any);
          setIsReady(true);
        }, 100);
      }
    });

    return unsubscribe;
  }, [router]);

  return isReady;
}
