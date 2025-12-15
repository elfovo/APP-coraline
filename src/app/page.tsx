'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { SimpleButton } from '@/components/buttons';
import WeeklySummary from '@/components/dashboard/WeeklySummary';
import DailyEntryCard from '@/components/dashboard/DailyEntryCard';
import type { DailyEntry, WeeklyTotals } from '@/types/journal';
import { listenRecentEntries, computeWeeklyTotals } from '@/lib/firestoreEntries';

const emptyEntry: DailyEntry = {
  dateISO: '',
  dayLabel: '',
  status: 'missing',
  symptoms: [],
  medications: [],
  activities: [],
  perturbateurs: [],
};

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    setEntriesLoading(true);
    setEntriesError(null);
    const unsubscribe = listenRecentEntries(user.uid, 14, (docs) => {
      setEntries(docs);
      setEntriesLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const weeklyTotals = useMemo<WeeklyTotals>(() => {
    return computeWeeklyTotals(entries);
  }, [entries]);

  const selectedEntry = entries[0] ?? emptyEntry;

  const handleEditEntry = () => {
    if (!selectedEntry.dateISO) {
      router.push('/journal');
      return;
    }
    router.push(`/journal?date=${selectedEntry.dateISO}`);
  };

  const handleAddActivity = () => {
    router.push('/journal?section=activites');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-10">

          <WeeklySummary
            totals={weeklyTotals}
            weekLabel={
              entries.length
                ? entries[0].dayLabel ?? entries[0].dateISO
                : 'Semaine en cours'
            }
          />

          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Contenu & accompagnement
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-white mt-1">
                Fiches pratiques pour toi et ton entourage
              </h2>
              <p className="text-white/70 mt-2 max-w-2xl">
                Accède aux routines quotidiennes, audios de respiration et
                checklists accompagnant pour expliquer ton rétablissement.
              </p>
            </div>
            <SimpleButton size="lg" onClick={() => router.push('/contenu')}>
              Ouvrir la bibliothèque
            </SimpleButton>
          </section>

          {entriesError && (
            <section className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-200 text-sm">
              {entriesError}
            </section>
          )}

          <DailyEntryCard
            entry={selectedEntry}
            onEdit={handleEditEntry}
            onAddActivity={handleAddActivity}
          />
        </div>
      </div>
    </div>
  );
}
