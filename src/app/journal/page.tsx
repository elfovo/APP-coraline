'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import DailyEntryForm, { SectionKey } from '@/components/journal/DailyEntryForm';
import { fetchDailyEntry, saveDailyEntry } from '@/lib/firestoreEntries';
import type { DailyEntry } from '@/types/journal';
import { SimpleButton } from '@/components/buttons';

const SEED_SYMPTOMS = [
  { id: 'cephalee', label: 'Céphalée' },
  { id: 'vision', label: 'Troubles visuels' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'humeur', label: 'Saut d’humeur' },
  { id: 'anxiete', label: 'Anxiété' },
  { id: 'nausees', label: 'Nausées' },
] as const;

const SEED_MEDICATIONS = [
  { id: 'analgesique', label: 'Analgésique' },
  { id: 'antiInflammatoire', label: 'Anti-inflammatoire' },
  { id: 'repos', label: 'Repos guidé' },
  { id: 'hydratation', label: 'Hydratation' },
  { id: 'vestibulaire', label: 'Thérapie vestibulaire' },
] as const;

const SEED_ACTIVITIES = [
  { id: 'marche', label: 'Marche légère' },
  { id: 'respiration', label: 'Respiration guidée' },
  { id: 'yoga', label: 'Yoga doux' },
  { id: 'lecture', label: 'Lecture' },
  { id: 'ecran', label: 'Écrans < 30 min' },
] as const;

const SEED_PERTURBATEURS = [
  'Lumière forte',
  'Bruit élevé',
  'Stress',
  'Manque de sommeil',
  'Sur-stimulation',
] as const;

const seedDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const randomInt = (max: number) => Math.floor(Math.random() * (max + 1));

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

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dateISO = dateParam ?? todayISO;

  const dateLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return formatter.format(new Date(`${dateISO}T00:00:00`));
  }, [dateISO]);

  const [entryLoading, setEntryLoading] = useState(true);
  const [initialEntry, setInitialEntry] = useState<DailyEntry | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

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

  const handleSaveEntry = async (entry: DailyEntry) => {
    if (!user) return;
    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);
    try {
      await saveDailyEntry(user.uid, entry);
      setInitialEntry(entry);
      setSubmitMessage(
        entry.status === 'draft'
          ? 'Brouillon sauvegardé'
          : 'Journée enregistrée avec succès',
      );
    } catch (error) {
      console.error(error);
      setSubmitError("Impossible d'enregistrer cette journée. Vérifie ta connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildSeedEntry = (targetDate: Date): DailyEntry => {
    const dateISOSeed = targetDate.toISOString().split('T')[0];
    const symptoms = SEED_SYMPTOMS.map((symptom) => {
      const intensity = Math.random() < 0.4 ? 0 : Math.max(1, randomInt(6));
      return { id: symptom.id, label: symptom.label, intensity };
    }).filter((item) => item.intensity > 0);
    if (!symptoms.length) {
      symptoms.push({
        id: SEED_SYMPTOMS[0].id,
        label: SEED_SYMPTOMS[0].label,
        intensity: 1,
      });
    }

    const medications = SEED_MEDICATIONS.map((med) => {
      const useMed = Math.random() < 0.45;
      return {
        id: med.id,
        label: med.label,
        intensity: useMed ? Math.max(1, randomInt(10)) : 0,
      };
    }).filter((item) => item.intensity > 0);

    const activities = SEED_ACTIVITIES.map((activity) => {
      const duration =
        Math.random() < 0.55 ? Math.max(10, randomInt(60)) : 0;
      return {
        id: activity.id,
        label: activity.label,
        duration,
        custom: false as const,
      };
    }).filter((item) => item.duration > 0);

    const perturbations = SEED_PERTURBATEURS.filter(
      () => Math.random() < 0.35,
    );

    const noteSeed =
      Math.random() < 0.4
        ? `Démo : énergie ${Math.random() < 0.5 ? 'stable' : 'fatigué'}.`
        : '';

    const entry: DailyEntry = {
      dateISO: dateISOSeed,
      dayLabel: seedDateFormatter.format(targetDate),
      status: 'complete',
      symptoms,
      medications,
      activities,
      perturbateurs: perturbations,
    };

    if (noteSeed.trim()) {
      entry.notes = noteSeed.trim();
    }

    return entry;
  };

  const handleSeedEntries = async () => {
    if (!user || seedLoading) return;
    setSeedLoading(true);
    try {
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const target = new Date(today);
        target.setDate(today.getDate() - i);
        const entry = buildSeedEntry(target);
        await saveDailyEntry(user.uid, entry);
        if (entry.dateISO === dateISO) {
          setInitialEntry(entry);
        }
      }
      setSubmitMessage('90 journées de démonstration ajoutées.');
    } catch (error) {
      console.error(error);
      setSubmitError('Impossible de générer les données démo.');
    } finally {
      setSeedLoading(false);
    }
  };

  useEffect(() => {
    if (!submitMessage && !submitError) return;
    const timer = setTimeout(() => {
      setSubmitMessage(null);
      setSubmitError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [submitMessage, submitError]);

  const toastItems = [
    submitMessage && { id: 'success', type: 'success', content: submitMessage },
    submitError && { id: 'error', type: 'error', content: submitError },
  ].filter(Boolean) as { id: string; type: 'success' | 'error'; content: string }[];

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
          {toastItems.map((toast) => (
            <motion.div
              key={`${toast.id}-${toast.content}`}
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
      <div className="container mx-auto px-4 pt-6 flex justify-end">
        <SimpleButton
          size="sm"
          className="bg-white/90 text-gray-900 border-white/60 px-4 py-2 rounded-xl"
          onClick={handleSeedEntries}
          disabled={seedLoading}
        >
          {seedLoading ? 'Génération…' : 'Ajouter 90 jours démo'}
        </SimpleButton>
      </div>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <DailyEntryForm
          dateISO={dateISO}
          dateLabel={dateLabel}
          initialEntry={initialEntry}
          initialSection={initialSection ?? undefined}
          onSave={handleSaveEntry}
          onSaveDraft={handleSaveEntry}
          isSubmitting={isSubmitting}
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

