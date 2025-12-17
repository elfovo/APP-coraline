'use client';

import { SimpleButton } from '@/components/buttons';

const WarningIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error: string | null;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  error,
}: DeleteAccountModalProps) {
  if (!isOpen) return null;

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
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <SimpleButton
            variant="outline"
            className="flex-1 bg-transparent text-white border-white/30 hover:bg-white/10"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </SimpleButton>
          <SimpleButton
            className="flex-1 bg-red-500 hover:bg-red-600 text-white border-red-500"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
          </SimpleButton>
        </div>
      </div>
    </div>
  );
}

