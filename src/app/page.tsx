'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { SimpleButton } from '@/components/buttons';
import WeeklySummary from '@/components/dashboard/WeeklySummary';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';
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
  const [selectedDate, setSelectedDate] = useState('');

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

  useEffect(() => {
    if (!entries.length) {
      setSelectedDate('');
    } else if (!entries.some((entry) => entry.dateISO === selectedDate)) {
      setSelectedDate(entries[0].dateISO);
    }
  }, [entries, selectedDate]);

  const weeklyTotals = useMemo<WeeklyTotals>(() => {
    return computeWeeklyTotals(entries);
  }, [entries]);

  const calendarDays = useMemo(() => {
    if (!entries.length) {
      const today = new Date().toISOString().split('T')[0];
      return [
        {
          dateISO: today,
          label: 'Aujourd’hui',
          status: 'missing' as const,
          summary: '0',
        },
      ];
    }

    return entries.map((entry) => ({
      dateISO: entry.dateISO,
      label: entry.dayLabel || entry.dateISO,
      status: entry.status,
      summary: String(entry.symptoms.reduce(
        (acc, item) => acc + item.intensity,
        0,
      )),
    }));
  }, [entries]);

  const calendarDayMap = useMemo(() => {
    return calendarDays.reduce<Record<string, { status: DailyEntry['status']; summary: string }>>(
      (acc, day) => {
        acc[day.dateISO] = { status: day.status, summary: day.summary };
        return acc;
      },
      {},
    );
  }, [calendarDays]);

  const selectedEntry =
    entries.find((entry) => entry.dateISO === selectedDate) ?? emptyEntry;

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

          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                  Journal quotidien
                </p>
                <h2 className="text-3xl font-semibold text-white">
                  Timeline & calendrier glissant
                </h2>
              </div>
              <span className="text-white/60 text-sm">
                Modifie n’importe quel jour passé pour affiner ton suivi.
              </span>
            </div>
            <MonthlyCalendar
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              entriesMap={calendarDayMap}
              isLoading={entriesLoading}
            />
            {entriesError && (
              <p className="text-red-400 text-sm">{entriesError}</p>
            )}
          </section>

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
