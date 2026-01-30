'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ResetPasswordForm } from '@/components/layouts';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: { email: string }) => {
    try {
      setError('');
      setSuccess(false);
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      let errorMessage = t('resetPasswordError');
      
      const firebaseError = err as { code?: string; message?: string } | null;

      if (firebaseError?.code === 'auth/user-not-found') {
        errorMessage = t('resetPasswordErrorUserNotFound');
      } else if (firebaseError?.code === 'auth/invalid-email') {
        errorMessage = t('resetPasswordErrorInvalidEmail');
      } else if (firebaseError?.message) {
        errorMessage = firebaseError.message;
      }
      
      setError(errorMessage);
    }
  };

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

          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm"
            >
              <p className="text-sm text-green-400 text-center">
                {t('resetPasswordSuccess')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <ResetPasswordForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

