'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OutlineInput } from '@/components/inputs';
import { SimpleButton } from '@/components/buttons';

interface ResetPasswordFormProps {
  onSubmit?: (data: {
    email: string;
  }) => void;
  className?: string;
}

export default function ResetPasswordForm({
  onSubmit,
  className = ''
}: ResetPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
  }>({});
  const [showValidation, setShowValidation] = useState<{
    email: boolean;
  }>({
    email: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation simple
    const newErrors: {
      email?: string;
    } = {};

    if (!email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        await onSubmit?.({ email });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`bg-transparent rounded-[2rem] p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md w-full ${className}`}>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Réinitialiser le mot de passe</h2>
        <p className="text-sm sm:text-base text-white opacity-70">Entrez votre email pour recevoir un lien de réinitialisation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Email */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="email" className="block text-sm font-medium text-white">
              Email
            </label>
            <div className={`bg-white text-black text-xs px-1 py-1 rounded-full flex items-center justify-center shadow-lg w-5 h-5 transition-opacity duration-300 ${showValidation.email ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <span className="text-xs">✓</span>
            </div>
          </div>
          <div className="relative">
            <OutlineInput
              id="email"
              name="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email.trim() !== '' && /\S+@\S+\.\S+/.test(email)) {
                  setShowValidation(prev => ({ ...prev, email: true }));
                  setErrors(prev => ({ ...prev, email: undefined }));
                } else {
                  setShowValidation(prev => ({ ...prev, email: false }));
                  if (email.trim() === '') {
                    setErrors(prev => ({ ...prev, email: 'Email requis' }));
                  } else if (!/\S+@\S+\.\S+/.test(email)) {
                    setErrors(prev => ({ ...prev, email: 'Email invalide' }));
                  }
                }
              }}
              onFocus={() => {
                setShowValidation(prev => ({ ...prev, email: false }));
                setErrors(prev => ({ ...prev, email: undefined }));
              }}
              variant="white"
              size="lg"
              autoComplete="email"
              error={errors.email}
              className="w-full"
            />
          </div>
        </div>


        <SimpleButton
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin mr-2"></div>
              Réinitialisation...
            </div>
          ) : (
            'Réinitialiser le mot de passe'
          )}
        </SimpleButton>
      </form>

      <div className="text-center mt-4 sm:mt-6">
        <Link href="/login" className="text-white opacity-70 hover:text-white hover:opacity-100 transition-all font-medium">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}