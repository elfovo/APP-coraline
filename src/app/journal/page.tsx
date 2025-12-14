'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import DailyEntryForm, { SectionKey } from '@/components/journal/DailyEntryForm';
import { fetchDailyEntry, saveDailyEntry } from '@/lib/firestoreEntries';
import type { DailyEntry } from '@/types/journal';

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
      <div className="container mx-auto px-4 py-8 space-y-6">
        {submitMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 rounded-2xl p-4 text-sm">
            {submitMessage}
          </div>
        )}
        {submitError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl p-4 text-sm">
            {submitError}
          </div>
        )}

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

