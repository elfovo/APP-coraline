'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/layouts';
export default function LoginPage() {
  const { signIn, signInWithGoogle, signInWithApple, user } = useAuth();
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
    try {
      setError('');
      setIsLoading(true);
      await signIn(data.email, data.password);
      router.push('/');
    } catch (err: any) {
      // Gérer les erreurs Firebase
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'Ce compte a été désactivé';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
      } else if (err.message) {
        errorMessage = err.message;
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

