'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/layouts';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const { signIn, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Si déjà connecté, rediriger vers la page d'accueil
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      setError('');
      setIsLoading(true);
      await signIn(data.email, data.password);
      router.push('/');
    } catch (err: unknown) {
      // Gérer les erreurs Firebase
      let errorMessage = t('loginError');
      
      const firebaseError = err as { code?: string; message?: string } | null;

      if (firebaseError?.code === 'auth/user-not-found') {
        errorMessage = t('loginErrorUserNotFound');
      } else if (firebaseError?.code === 'auth/wrong-password') {
        errorMessage = t('loginErrorWrongPassword');
      } else if (firebaseError?.code === 'auth/invalid-email') {
        errorMessage = t('loginErrorInvalidEmail');
      } else if (firebaseError?.code === 'auth/user-disabled') {
        errorMessage = t('loginErrorUserDisabled');
      } else if (firebaseError?.code === 'auth/too-many-requests') {
        errorMessage = t('loginErrorTooManyRequests');
      } else if (firebaseError?.message) {
        errorMessage = firebaseError.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsLoading(true);
      await signInWithGoogle();
      router.push('/');
    } catch (err: unknown) {
      let errorMessage = t('loginErrorGoogle');
      const firebaseError = err as { code?: string; message?: string } | null;
      if (firebaseError?.code === 'auth/popup-closed-by-user') {
        errorMessage = t('loginCancelled');
      } else if (firebaseError?.message) {
        errorMessage = firebaseError.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Temporairement désactivé
  // const handleAppleSignIn = async () => {
  //   try {
  //     setError('');
  //     setIsLoading(true);
  //     await signInWithApple();
  //     router.push('/');
  //   } catch (err: any) {
  //     let errorMessage = 'Une erreur est survenue lors de la connexion avec Apple';
  //     if (err.code === 'auth/popup-closed-by-user') {
  //       errorMessage = 'Connexion annulée';
  //     } else if (err.code === 'auth/operation-not-allowed') {
  //       errorMessage = 'La connexion avec Apple n\'est pas activée. Veuillez contacter le support.';
  //     } else if (err.message) {
  //       errorMessage = err.message;
  //     }
  //     setError(errorMessage);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleAppleSignIn = () => {}; // Temporairement désactivé

  if (user) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent">
      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm"
            >
              <p className="text-sm text-red-400 text-center">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <LoginForm 
          onSubmit={handleSubmit}
          onGoogleClick={handleGoogleSignIn}
          onAppleClick={handleAppleSignIn}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

