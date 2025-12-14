'use client';

import { useState } from 'react';
import SectionWrapper from '@/components/SectionWrapper';
import { OutlineInput, DateSelector } from '@/components/inputs';
import { LoginForm, SignupForm, ResetPasswordForm } from '@/components/layouts';

export default function LayoutsSection() {
  const [inputValue, setInputValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [showDateValidation, setShowDateValidation] = useState(false);

  const layoutDemos = [
    {
      id: 'forms',
      name: 'OutlineInput',
      description: 'Champ de saisie avec bordure animée',
      component: (
        <div className="max-w-md mx-auto p-8">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-white">Nom</label>
            <div className={`bg-white text-black text-xs px-1 py-1 rounded-full flex items-center justify-center shadow-lg w-5 h-5 transition-opacity duration-300 ${showValidation ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <span className="text-xs">✓</span>
            </div>
          </div>
          <div className="relative">
            <OutlineInput 
              placeholder="Votre nom..." 
              variant="white" 
              size="lg" 
              className="w-full"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => {
                if (inputValue.trim() !== '') {
                  setShowValidation(true);
                } else {
                  setShowValidation(false);
                }
              }}
              onFocus={() => setShowValidation(false)}
            />
          </div>
        </div>
      )
    },
    {
      id: 'date',
      name: 'DateSelector',
      description: 'Sélecteur de date avec style moderne',
      component: (
        <div className="max-w-md mx-auto p-8">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-white">Date</label>
            <div className={`bg-white text-black text-xs px-1 py-1 rounded-full flex items-center justify-center shadow-lg w-5 h-5 transition-opacity duration-300 ${showDateValidation ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <span className="text-xs">✓</span>
            </div>
          </div>
          <div className="relative">
            <DateSelector 
              placeholder="Sélectionnez une date..."
              variant="white"
              size="lg"
              className="w-full"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              onBlur={() => {
                if (dateValue.trim() !== '') {
                  setShowDateValidation(true);
                } else {
                  setShowDateValidation(false);
                }
              }}
              onFocus={() => setShowDateValidation(false)}
            />
          </div>
        </div>
      )
    },
    {
      id: 'login',
      name: 'LoginForm',
      description: 'Formulaire de connexion moderne',
      component: (
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      )
    },
    {
      id: 'signup',
      name: 'SignupForm',
      description: 'Formulaire d\'inscription moderne',
      component: (
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <SignupForm />
          </div>
        </div>
      )
    },
    {
      id: 'reset',
      name: 'ResetPasswordForm',
      description: 'Formulaire de réinitialisation de mot de passe',
      component: (
        <div className="w-full h-full flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <ResetPasswordForm />
          </div>
        </div>
      )
    },
  ];

  return (
    <SectionWrapper
      id="layouts"
      title="Layouts & Formulaires"
      subtitle="Composants de mise en page et formulaires interactifs"
      demos={layoutDemos}
    />
  );
}
