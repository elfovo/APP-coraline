'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OutlineInput } from '@/components/inputs';
import { SimpleButton, SocialLoginButtons } from '@/components/buttons';

interface SignupFormProps {
  onSubmit?: (data: { 
    email: string; 
    password: string; 
  }) => void;
  onGoogleClick?: () => void;
  onAppleClick?: () => void;
  className?: string;
  isLoading?: boolean;
}

export default function SignupForm({
  onSubmit,
  onGoogleClick,
  onAppleClick,
  className = '',
  isLoading: externalIsLoading = false
}: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
  }>({});
  const [showValidation, setShowValidation] = useState<{ 
    email: boolean; 
    password: boolean; 
  }>({
    email: false,
    password: false
  });
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  
  const isLoading = externalIsLoading || internalIsLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SignupForm: handleSubmit appelé', { email, password: '***' });
    
    // Validation simple
    const newErrors: { 
      email?: string; 
      password?: string; 
    } = {};
    
    if (!email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }
    
    console.log('SignupForm: Erreurs de validation', newErrors);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      console.log('SignupForm: Validation OK, appel de onSubmit');
      setInternalIsLoading(true);
      try {
        await onSubmit?.({ email, password });
        console.log('SignupForm: onSubmit terminé avec succès');
      } catch (error) {
        console.error('SignupForm: Erreur dans onSubmit', error);
        throw error; // Re-lancer pour que la page parente puisse la gérer
      } finally {
        setInternalIsLoading(false);
      }
    } else {
      console.log('SignupForm: Validation échouée, pas d\'appel à onSubmit');
    }
  };

  return (
    <div className={`bg-transparent rounded-[2rem] p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md w-full ${className}`}>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Créer un compte</h2>
        <p className="text-sm sm:text-base text-white opacity-70">Rejoignez-nous dès aujourd&apos;hui</p>
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
        
        {/* Mot de passe */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Mot de passe
            </label>
            <div className={`bg-white text-black text-xs px-1 py-1 rounded-full flex items-center justify-center shadow-lg w-5 h-5 transition-opacity duration-300 ${showValidation.password ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <span className="text-xs">✓</span>
            </div>
          </div>
          <div>
            <div className="relative">
              <OutlineInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => {
                  if (password.trim() !== '' && password.length >= 6) {
                    setShowValidation(prev => ({ ...prev, password: true }));
                    setErrors(prev => ({ ...prev, password: undefined }));
                  } else {
                    setShowValidation(prev => ({ ...prev, password: false }));
                    if (password.trim() === '') {
                      setErrors(prev => ({ ...prev, password: 'Mot de passe requis' }));
                    } else if (password.length < 6) {
                      setErrors(prev => ({ ...prev, password: 'Minimum 6 caractères' }));
                    }
                  }
                }}
                onFocus={() => {
                  setShowValidation(prev => ({ ...prev, password: false }));
                  setErrors(prev => ({ ...prev, password: undefined }));
                }}
                variant="white"
                size="lg"
                autoComplete="new-password"
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <div className="mt-1 text-sm text-red-500" role="alert">
                {errors.password}
              </div>
            )}
          </div>
        </div>
        
        <SimpleButton
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin mr-2"></div>
              Création...
            </div>
          ) : (
            'Créer mon compte'
          )}
        </SimpleButton>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-transparent text-white/70">ou</span>
        </div>
      </div>

      <SocialLoginButtons
        onGoogleClick={onGoogleClick}
        onAppleClick={onAppleClick}
        isLoading={isLoading}
        className="mt-6"
      />
      
      <div className="text-center mt-4 sm:mt-6">
        <Link href="/login" className="text-white opacity-70 hover:text-white hover:opacity-100 transition-all font-medium">
          Déjà un compte ? Se connecter
        </Link>
      </div>
    </div>
  );
}
