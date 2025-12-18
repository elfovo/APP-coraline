'use client';

import { useState } from 'react';
import { TransparentButton } from '@/components/buttons';
import { OutlineInput } from '@/components/inputs';

const WarningIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => void;
  isDeleting: boolean;
  error: string | null;
  requiresPassword?: boolean;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  error,
  requiresPassword = false,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresPassword && !password.trim()) {
      return;
    }
    onConfirm(requiresPassword ? password : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-md bg-gradient-to-br from-black/95 via-black/90 to-black/95 border border-red-500/30 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <WarningIcon className="w-8 h-8 text-red-400" />
            <h2 className="text-2xl font-semibold text-white">
              Confirmer la suppression
            </h2>
          </div>
          <p className="text-white/70">
            Cette action est irréversible. Toutes tes données seront définitivement supprimées :
          </p>
          <ul className="text-white/60 text-sm space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Ton journal et toutes tes entrées</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Tes statistiques et rapports</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Les codes accompagnants</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Ton compte et tes préférences</span>
            </li>
          </ul>
        </div>
        {requiresPassword && (
          <div className="space-y-2">
            <label htmlFor="delete-password" className="block text-sm font-medium text-white/90">
              Confirme ton mot de passe pour continuer
            </label>
            <div className="relative">
              <OutlineInput
                id="delete-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ton mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="white"
                size="lg"
                className="w-full pr-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10"
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
          </div>
        )}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <TransparentButton
            className="flex-1 text-white border-white/30 hover:bg-white/10"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </TransparentButton>
          <TransparentButton
            className="flex-1 bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg hover:shadow-xl"
            onClick={handleConfirm}
            disabled={isDeleting || (requiresPassword && !password.trim())}
          >
            {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
          </TransparentButton>
        </div>
      </div>
    </div>
  );
}



