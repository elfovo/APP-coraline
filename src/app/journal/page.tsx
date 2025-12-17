'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import DailyEntryForm, { SectionKey } from '@/components/journal/DailyEntryForm';
import { fetchDailyEntry, saveDailyEntry, deleteAllEntries } from '@/lib/firestoreEntries';
import type { DailyEntry } from '@/types/journal';
import { SimpleButton } from '@/components/buttons';
import { getDbInstance } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { buildSeedEntry } from '@/lib/seedEntries';
import { shiftDate, formatDateLabel, getTodayISO } from '@/lib/dateUtils';
import { useToast } from '@/hooks/useToast';

function JournalContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParamsStore = useSearchParams();
  const searchParams = useMemo(
    () => new URLSearchParams(searchParamsStore.toString()),
    [searchParamsStore],
  );
  const dateParam = searchParams.get('date');
  const initialSection = searchParams.get('section') as SectionKey | null;

  const todayISO = useMemo(() => getTodayISO(), []);
  const dateISO = dateParam ?? todayISO;

  const dateLabel = useMemo(() => formatDateLabel(dateISO), [dateISO]);

  const [entryLoading, setEntryLoading] = useState(true);
  const [initialEntry, setInitialEntry] = useState<DailyEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const { toasts, showToast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setEntryLoading(true);
    fetchDailyEntry(user.uid, dateISO)
      .then((entry) => {
        setInitialEntry(entry);
      })
      .finally(() => setEntryLoading(false));
  }, [user, dateISO]);

  const navigateToDate = (targetISO: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', targetISO);
    const query = params.toString();
    router.push(query ? `/journal?${query}` : '/journal');
  };

  const goToPreviousDay = () => navigateToDate(shiftDate(dateISO, -1));
  const goToNextDay = () => navigateToDate(shiftDate(dateISO, 1));

  const handleSaveEntry = async (entry: DailyEntry) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await saveDailyEntry(user.uid, entry);
      setInitialEntry(entry);
      showToast(
        entry.status === 'draft'
          ? 'Brouillon sauvegardé'
          : 'Journée enregistrée avec succès',
        'success',
      );
    } catch (error) {
      console.error(error);
      showToast("Impossible d'enregistrer cette journée. Vérifie ta connexion.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedEntries = async () => {
    if (!user || seedLoading) return;
    setSeedLoading(true);
    try {
      const today = new Date();
      
      // Créer les entrées pour 120 jours
      let oldestDateISO = '';
      for (let i = 0; i < 120; i++) {
        const target = new Date(today);
        target.setDate(today.getDate() - i);
        const entry = buildSeedEntry(target, i);
        await saveDailyEntry(user.uid, entry);
        if (entry.dateISO === dateISO) {
          setInitialEntry(entry);
        }
        // Garder la date la plus ancienne (dernière itération)
        if (i === 119) {
          oldestDateISO = entry.dateISO;
        }
      }
      
      // Sauvegarder la date d'accident dans Firestore (date de la première donnée)
      const db = getDbInstance();
      await setDoc(doc(db, 'users', user.uid), {
        accidentDates: [oldestDateISO],
      }, { merge: true });
      
      showToast('4 mois de données de démonstration ajoutées avec progression réaliste.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Impossible de générer les données démo.', 'error');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleClearEntries = async () => {
    if (!user || clearLoading) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Cela supprimera définitivement toutes tes entrées. Continuer ?',
      );
      if (!confirmed) {
        return;
      }
    }
    setClearLoading(true);
    try {
      await deleteAllEntries(user.uid);
      setInitialEntry(null);
      showToast('Toutes les données ont été supprimées.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Impossible de supprimer les données.', 'error');
    } finally {
      setClearLoading(false);
    }
  };

  if (loading || entryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Chargement du journal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-24">
      <div className="pointer-events-none fixed top-4 right-4 z-[60] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm shadow-lg backdrop-blur-md min-w-[240px] border ${
                toast.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-50'
                  : 'bg-red-500/15 border-red-500/40 text-red-50'
              }`}
            >
              {toast.content}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="container mx-auto px-4 pt-6 flex flex-wrap gap-3 justify-end">
        <SimpleButton
          size="sm"
          className="bg-white/90 text-gray-900 border-white/60 px-4 py-2 rounded-xl"
          onClick={handleSeedEntries}
          disabled={seedLoading || clearLoading}
        >
          {seedLoading ? 'Génération…' : 'Créer des données de démo'}
        </SimpleButton>
        <SimpleButton
          size="sm"
          variant="outline"
          className="text-white border-red-300/60 hover:bg-red-500/10 px-4 py-2 rounded-xl"
          onClick={handleClearEntries}
          disabled={clearLoading || seedLoading}
        >
          {clearLoading ? 'Suppression…' : 'Supprimer toutes les données'}
        </SimpleButton>
      </div>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <DailyEntryForm
          dateISO={dateISO}
          dateLabel={dateLabel}
          initialEntry={initialEntry}
          initialSection={initialSection ?? undefined}
          onSave={handleSaveEntry}
          isSubmitting={isSubmitting}
          onError={(msg) => showToast(msg, 'error')}
          onSuccess={(msg) => showToast(msg, 'success')}
          onGoPreviousDay={goToPreviousDay}
          onGoNextDay={goToNextDay}
        />
      </div>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-transparent">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/70">Chargement du journal...</p>
          </div>
        </div>
      }
    >
      <JournalContent />
    </Suspense>
  );
}
