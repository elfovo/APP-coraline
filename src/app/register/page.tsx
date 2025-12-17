'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/layouts';
export default function RegisterPage() {
  const { signUp, signInWithGoogle, signInWithApple, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Si déjà connecté, rediriger vers la page d'accueil
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    console.log('RegisterPage: handleSubmit appelé', { email: data.email });
    try {
      setError('');
      setIsLoading(true);
      console.log('RegisterPage: Appel à signUp...');
      await signUp(data.email, data.password);
      console.log('RegisterPage: signUp réussi, redirection...');
      router.push('/');
    } catch (err: any) {
      console.error('RegisterPage: Erreur lors de l\'inscription', err);
      // Gérer les erreurs Firebase
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible (minimum 6 caractères)';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Cette opération n\'est pas autorisée';
      } else if (err.message) {
        errorMessage = err.message;
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
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue lors de la connexion avec Google';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Connexion annulée';
      } else if (err.message) {
        errorMessage = err.message;
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
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

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

