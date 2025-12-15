'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';
import type { DailyEntry } from '@/types/journal';
import { listenRecentEntries } from '@/lib/firestoreEntries';

const GENTLE_ACTIVITY_IDS = new Set([
  'meditation',
  'relaxation',
  'respiration',
  'musique',
  'bain',
  'massage',
  'aromatherapie',
  'acupuncture',
  'osteopathie',
  'physiotherapie',
  'sophrologie',
]);

export default function StatistiquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setEntriesLoading(true);
    const unsubscribe = listenRecentEntries(user.uid, 60, (docs) => {
      setEntries(docs);
      setEntriesLoading(false);
      if (docs.length) {
        setSelectedDate((prev) => prev || docs[0].dateISO);
      }
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

  const calendarEntriesMap = useMemo(() => {
    if (!entries.length) {
      const todayISO = new Date().toISOString().split('T')[0];
      return {
        [todayISO]: { status: 'missing' as DailyEntry['status'], summary: '0' },
      };
    }
    return entries.reduce<Record<string, { status: DailyEntry['status']; summary: string }>>(
      (acc, entry) => {
        acc[entry.dateISO] = {
          status: entry.status,
          summary: String(
            entry.symptoms.reduce((intensity, item) => intensity + item.intensity, 0),
          ),
        };
        return acc;
      },
      {},
    );
  }, [entries]);

  const selectedEntry = entries.find((entry) => entry.dateISO === selectedDate);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return '';
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return formatter.format(new Date(`${selectedDate}T00:00:00`));
  }, [selectedDate]);

  const daySummary = useMemo(() => {
    const entry = selectedEntry;
    if (!entry) {
      return {
        symptomScore: 0,
        medicationTakes: 0,
        activityMinutes: 0,
        gentleMinutes: 0,
        perturbateurs: 0,
      };
    }

    const symptomScore = entry.symptoms?.reduce((acc, item) => acc + (item.intensity ?? 0), 0) ?? 0;
    const medicationTakes =
      entry.medications?.filter((med) => (med.intensity ?? 0) > 0).length ?? 0;
    const activityMinutes =
      entry.activities
        ?.filter((activity) => !isGentleActivityId(activity.id))
        .reduce((acc, activity) => acc + (activity.duration ?? 0), 0) ?? 0;
    const gentleMinutes =
      entry.activities
        ?.filter((activity) => isGentleActivityId(activity.id))
        .reduce((acc, activity) => acc + (activity.duration ?? 0), 0) ?? 0;
    const perturbateurs = entry.perturbateurs?.length ?? 0;

    return {
      symptomScore,
      medicationTakes,
      activityMinutes,
      gentleMinutes,
      perturbateurs,
    };
  }, [selectedEntry]);

  const summaryChart = useMemo(() => {
    const baseSegments = [
      {
        key: 'symptomScore',
        label: 'Symptômes',
        value: daySummary.symptomScore,
        helper: 'Score total /132',
        color: '#F97316',
      },
      {
        key: 'medications',
        label: 'Médicaments',
        value: daySummary.medicationTakes,
        helper: 'Prises validées',
        color: '#34D399',
      },
      {
        key: 'activities',
        label: 'Activités',
        value: daySummary.activityMinutes,
        helper: 'Minutes actives',
        color: '#38BDF8',
      },
      {
        key: 'gentleActivities',
        label: 'Activités douces / thérapies',
        value: daySummary.gentleMinutes,
        helper: 'Minutes apaisantes',
        color: '#C084FC',
      },
      {
        key: 'perturbateurs',
        label: 'Perturbateurs',
        value: daySummary.perturbateurs,
        helper: 'Éléments déclenchants',
        color: '#F43F5E',
      },
    ];

    const total = baseSegments.reduce((sum, segment) => sum + segment.value, 0);
    let cumulative = 0;

    const segments = baseSegments.map((segment) => {
      const percentage = total > 0 ? (segment.value / total) * 100 : 0;
      const data = { ...segment, percentage, start: cumulative };
      cumulative += percentage;
      return data;
    });

    return { total, segments };
  }, [daySummary]);

  const chartRadius = 90;
  const chartCircumference = 2 * Math.PI * chartRadius;
  if (loading || entriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Calendrier</p>
            <h1 className="text-4xl font-bold text-white">Historique complet</h1>
            <p className="text-white/70 max-w-2xl">
              Visualise rapidement tes journées passées, repère les jours complétés,
              brouillons ou à remplir et ouvre le journal associé en un clic.
            </p>
          </header>

          <section className="space-y-4">
            <MonthlyCalendar
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              entriesMap={calendarEntriesMap}
              isLoading={entriesLoading}
            />
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-1">
                Résumé de la journée
              </p>
              {selectedDate && (
                <p className="text-lg font-semibold text-white">
                  {selectedDateLabel}
                </p>
              )}
              {!selectedDate && (
                <p className="text-white/50 text-sm">
                  Sélectionne un jour dans le calendrier pour voir le résumé
                </p>
              )}
            </div>
            {selectedDate ? (
              summaryChart.total > 0 ? (
                <div className="flex flex-col lg:flex-row gap-10 lg:items-stretch w-full">
                  <div className="order-2 lg:order-1 flex-1 space-y-3">
                    {summaryChart.segments.map((segment) => (
                      <div
                        key={segment.key}
                        className="flex items-center justify-between gap-3 bg-black/30 border border-white/10 rounded-2xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: segment.color }}
                          />
                          <div>
                            <p className="text-xs font-semibold text-white">{segment.label}</p>
                            <p className="text-[11px] text-white/60">{segment.helper}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">{segment.value}</p>
                          <p className="text-[11px] text-white/50">
                            {segment.percentage.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="order-1 lg:order-2 flex justify-center flex-1">
                    <div className="relative w-full max-w-[420px]">
                      <svg
                        viewBox="0 0 240 240"
                        className="w-full h-auto"
                      >
                        <defs>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <linearGradient id="symptomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
                            <stop offset="100%" stopColor="#F97316" stopOpacity="1" />
                          </linearGradient>
                          <linearGradient id="medicationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                            <stop offset="100%" stopColor="#34D399" stopOpacity="1" />
                          </linearGradient>
                          <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="1" />
                            <stop offset="100%" stopColor="#38BDF8" stopOpacity="1" />
                          </linearGradient>
                          <linearGradient id="gentleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
                            <stop offset="100%" stopColor="#C084FC" stopOpacity="1" />
                          </linearGradient>
                          <linearGradient id="perturbateurGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
                            <stop offset="100%" stopColor="#F43F5E" stopOpacity="1" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="120"
                          cy="120"
                          r={chartRadius}
                          fill="transparent"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="20"
                          className="transition-all duration-300"
                        />
                        {summaryChart.segments.map((segment) => {
                          if (segment.percentage <= 0) return null;
                          const dash = (segment.percentage / 100) * chartCircumference;
                          const gap = chartCircumference - dash;
                          const offset = chartCircumference * (1 - segment.start / 100);
                          const gradientId = 
                            segment.key === 'symptomScore' ? 'symptomGradient' :
                            segment.key === 'medications' ? 'medicationGradient' :
                            segment.key === 'activities' ? 'activityGradient' :
                            segment.key === 'gentleActivities' ? 'gentleGradient' :
                            'perturbateurGradient';
                          return (
                            <circle
                              key={segment.key}
                              cx="120"
                              cy="120"
                              r={chartRadius}
                              fill="transparent"
                              stroke={`url(#${gradientId})`}
                              strokeWidth="20"
                              strokeDasharray={`${dash} ${gap}`}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              transform="rotate(-90 120 120)"
                              filter="url(#glow)"
                              className="transition-all duration-500 ease-out"
                              style={{ opacity: 0.95 }}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-white/50">
                  <p>Aucune donnée enregistrée pour cette journée.</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-white/50">
                <p>Sélectionne un jour dans le calendrier pour voir le résumé.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function isGentleActivityId(id: string) {
  return id.startsWith('gentle_') || GENTLE_ACTIVITY_IDS.has(id);
}
