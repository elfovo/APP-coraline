'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/layouts';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RegisterPage() {
  const { signUp, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, décider où le rediriger
    if (user) {
      const isNewAccount =
        typeof window !== 'undefined' && sessionStorage.getItem('newAccount') === 'true';
      router.push(isNewAccount ? '/onboarding' : '/');
    }
  }, [user, router]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    console.log('RegisterPage: handleSubmit appelé', { email: data.email });
    try {
      setError('');
      setIsLoading(true);
      console.log('RegisterPage: Appel à signUp...');
      // IMPORTANT: poser le flag AVANT l'inscription pour éviter une redirection prématurée
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('newAccount', 'true');
      }
      await signUp(data.email, data.password);
      console.log('RegisterPage: signUp réussi, redirection vers onboarding...');
      router.push('/onboarding');
    } catch (err: unknown) {
      console.error("RegisterPage: Erreur lors de l'inscription", err);
      // Si l'inscription échoue, retirer le flag
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('newAccount');
      }
      // Gérer les erreurs Firebase
      let errorMessage = t('signupError');
      
      const firebaseError = err as { code?: string; message?: string } | null;

      if (firebaseError?.code === 'auth/email-already-in-use') {
        errorMessage = t('signupErrorEmailInUse');
      } else if (firebaseError?.code === 'auth/invalid-email') {
        errorMessage = t('signupErrorInvalidEmail');
      } else if (firebaseError?.code === 'auth/weak-password') {
        errorMessage = t('signupErrorWeakPassword');
      } else if (firebaseError?.code === 'auth/operation-not-allowed') {
        errorMessage = t('signupErrorOperationNotAllowed');
      } else if (firebaseError?.message) {
        errorMessage = firebaseError.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('RegisterPage: handleSubmit terminé');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsLoading(true);
      // IMPORTANT: poser le flag AVANT la connexion pour éviter une redirection prématurée
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('newAccount', 'true');
      }
      await signInWithGoogle();
      router.push('/onboarding');
    } catch (err: unknown) {
      // Si la connexion échoue, retirer le flag
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('newAccount');
      }
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
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t('backToHome')}
      </Link>
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

        <SignupForm 
          onSubmit={handleSubmit}
          onGoogleClick={handleGoogleSignIn}
          onAppleClick={handleAppleSignIn}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

