'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ResetPasswordForm } from '@/components/layouts';
export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: { email: string }) => {
    try {
      setError('');
      setSuccess(false);
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent">
      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm">
            <p className="text-sm text-green-400 text-center">
              Email de réinitialisation envoyé ! Vérifiez votre boîte mail.
            </p>
          </div>
        )}

        <ResetPasswordForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

