'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SimpleButton } from '@/components/buttons';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateCaregiverCode,
  getActiveCaregiverCode,
} from '@/lib/firestoreEntries';

const EXPIRATION_MINUTES = 30;

export default function CaregiverCodeCard() {
  const { user } = useAuth();
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setAccessCode(null);
      setExpiresAt(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    getActiveCaregiverCode(user.uid)
      .then((result) => {
        if (!isMounted) return;
        if (result) {
          setAccessCode(result.code);
          setExpiresAt(result.expiresAt);
        } else {
          setAccessCode(null);
          setExpiresAt(null);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Impossible de récupérer le code actuel.');
      })
      .finally(() => isMounted && setLoading(false));

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      if (expiresAt.getTime() <= Date.now()) {
        setAccessCode(null);
        setExpiresAt(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const remainingTime = useMemo(() => {
    if (!expiresAt) return '—';
    const diff = expiresAt.getTime() - Date.now();
    if (diff <= 0) return 'Expiré';
    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }, [expiresAt]);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateCaregiverCode(user.uid);
      setAccessCode(result.code);
      setExpiresAt(result.expiresAt);
      setCopied(false);
    } catch (err) {
      console.error(err);
      setError('Impossible de générer un code pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!accessCode) return;
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      setError('Copie impossible. Copie manuelle requise.');
    }
  };

  if (!user) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md text-white/70 text-sm">
        Connecte-toi pour générer un code et autoriser ton accompagnant à
        compléter le journal.
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Étape 1 · Patient
        </p>
        <h2 className="text-2xl font-semibold text-white mt-1">
          Génère un code sécurisé
        </h2>
        <p className="text-white/70 mt-2">
          Partage ce code unique pour permettre à ton accompagnant de déposer
          son observation pendant {EXPIRATION_MINUTES} minutes.
        </p>
      </div>

      <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-white/60 text-sm">Code actuel</p>
        <div className="flex items-center gap-3 text-3xl font-bold tracking-[0.4em] text-white">
          {accessCode ?? '------'}
        </div>
        <p className="text-white/60 text-sm">
          {accessCode ? `Expire dans ${remainingTime}` : 'Aucun code actif'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <SimpleButton onClick={handleGenerate} className="flex-1" disabled={loading}>
            {loading ? 'Patiente...' : accessCode ? 'Régénérer' : 'Générer un code'}
          </SimpleButton>
          <SimpleButton
            type="button"
            variant="outline"
            className="flex-1 bg-transparent text-white border-white/40"
            onClick={handleCopy}
            disabled={!accessCode || loading}
          >
            {copied ? 'Copié !' : 'Copier'}
          </SimpleButton>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-2 text-white/70 text-sm">
        <p className="font-semibold text-white">Bonnes pratiques :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Partage le code par message privé uniquement.</li>
          <li>L’accompagnant doit saisir le code avant son expiration.</li>
          <li>Chaque nouveau code désactive immédiatement le précédent.</li>
        </ul>
      </div>
    </div>
  );
}





