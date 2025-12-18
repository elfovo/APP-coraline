'use client';

import React, { useEffect, useMemo, useState } from 'react';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';
import TrendChart, {
  type TrendChartDataPoint,
} from '@/components/dashboard/TrendChart';
import type { DailyEntry } from '@/types/journal';
import { listenRecentEntries } from '@/lib/firestoreEntries';
import { getDbInstance } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

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

const SYMPTOM_OPTIONS = [
  { id: 'cephalee', label: 'Céphalée' },
  { id: 'vision', label: 'Troubles visuels' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'humeur', label: 'Saut d\'humeur' },
  { id: 'anxiete', label: 'Anxiété' },
  { id: 'nausees', label: 'Nausées' },
  { id: 'vertiges', label: 'Vertiges' },
  { id: 'etourdissements', label: 'Étourdissements' },
  { id: 'photophobie', label: 'Sensibilité à la lumière' },
  { id: 'phonophobie', label: 'Sensibilité au bruit' },
  { id: 'acouphenes', label: 'Acouphènes' },
  { id: 'raideurNuque', label: 'Raideur de la nuque' },
  { id: 'douleurOculaire', label: 'Douleur oculaire' },
  { id: 'confusion', label: 'Confusion mentale' },
  { id: 'concentration', label: 'Difficultés de concentration' },
  { id: 'irritabilite', label: 'Irritabilité' },
  { id: 'pressionTete', label: 'Sensation de pression dans la tête' },
  { id: 'douleurFaciale', label: 'Douleur faciale' },
  { id: 'equilibre', label: 'Troubles de l\'équilibre' },
  { id: 'teteLourde', label: 'Sensation de tête lourde' },
  { id: 'brouillardMental', label: 'Brouillard mental' },
  { id: 'sensibiliteMouvement', label: 'Sensibilité au mouvement' },
];

type DetailCategory = 'symptomScore' | 'medications' | 'activities' | 'gentleActivities' | 'perturbateurs';

type SummarySegment = {
  key: DetailCategory;
  label: string;
  value: number;
  helper: string;
  color: string;
  weight?: number;
};

type ComputedSummarySegment = SummarySegment & {
  percentage: number;
  start: number;
};

interface StatisticsDashboardProps {
  userId: string;
  headerTitle?: string;
}

export default function StatisticsDashboard({
  userId,
  headerTitle = 'Historique complet',
}: StatisticsDashboardProps) {
  const { user: currentUser } = useAuth();
  const isExternalUser = currentUser?.uid !== userId;
  
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [detailCategory, setDetailCategory] = useState<DetailCategory>('symptomScore');
  const [hoveredSegment, setHoveredSegment] = useState<DetailCategory | null>(null);
  const [daysSinceAccident, setDaysSinceAccident] = useState<number | null>(null);
  const [accidentDates, setAccidentDates] = useState<string[]>([]);
  const [chartPeriods, setChartPeriods] = useState({
    symptom: 7,
    activity: 7,
    medication: 7,
    perturbateur: 7,
    gentleActivity: 7,
  });

  const setChartPeriod = (key: keyof typeof chartPeriods, value: number) => {
    setChartPeriods((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setEntries([]);
    setSelectedDate('');
    setAccidentDates([]);
    setDaysSinceAccident(null);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setEntriesLoading(true);
    
    // Vérifier d'abord si des données sont préchargées dans sessionStorage
    if (isExternalUser && typeof window !== 'undefined') {
      const preloadedEntries = sessionStorage.getItem('preloadedEntries');
      if (preloadedEntries) {
        try {
          const entries = JSON.parse(preloadedEntries);
          setEntries(entries);
          setEntriesLoading(false);
          if (entries.length) {
            setSelectedDate((prev) => prev || entries[0].dateISO);
          }
          // Nettoyer les données préchargées après utilisation
          sessionStorage.removeItem('preloadedEntries');
          return;
        } catch (e) {
          console.warn('Erreur lors de la lecture des entrées préchargées:', e);
        }
      }
    }

    const maxEntries =
      daysSinceAccident && daysSinceAccident > 400
        ? Math.min(daysSinceAccident + 50, 1000)
        : 400;

    // Si c'est un utilisateur externe, utiliser l'API
    if (isExternalUser) {
      fetch(`/api/patient/entries?userId=${encodeURIComponent(userId)}&limit=${maxEntries}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Erreur HTTP ${res.status}`);
          }
          const data = await res.json();
          setEntries(data.entries || []);
          setEntriesLoading(false);
          if (data.entries?.length) {
            setSelectedDate((prev) => prev || data.entries[0].dateISO);
          }
        })
        .catch((error) => {
          console.error('Erreur lors du chargement des entrées via API:', error);
          setEntries([]);
          setEntriesLoading(false);
        });
      return;
    }

    // Sinon, utiliser Firestore direct (pour l'utilisateur connecté)
    const unsubscribe = listenRecentEntries(userId, maxEntries, (docs) => {
      setEntries(docs);
      setEntriesLoading(false);
      if (docs.length) {
        setSelectedDate((prev) => prev || docs[0].dateISO);
      }
    });
    return () => unsubscribe();
  }, [userId, daysSinceAccident, isExternalUser]);

  useEffect(() => {
    const loadAccidentDate = async () => {
      if (!userId) return;
      try {
        // Vérifier d'abord si des données sont préchargées dans sessionStorage
        if (isExternalUser && typeof window !== 'undefined') {
          const preloadedAccidentDates = sessionStorage.getItem('preloadedAccidentDates');
          if (preloadedAccidentDates) {
            try {
              const accidentDates = JSON.parse(preloadedAccidentDates);
              if (accidentDates && Array.isArray(accidentDates) && accidentDates.length > 0) {
                const validDates = accidentDates.filter((date: string) => date && date.trim() !== '');
                setAccidentDates(validDates);
                const sortedDates = validDates.sort(
                  (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime(),
                );
                if (sortedDates.length > 0) {
                  const oldestDate = new Date(sortedDates[0]);
                  const today = new Date();
                  const diffTime = today.getTime() - oldestDate.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  setDaysSinceAccident(Math.max(diffDays, 1));
                }
              }
              // Nettoyer les données préchargées après utilisation
              sessionStorage.removeItem('preloadedAccidentDates');
              return;
            } catch (e) {
              console.warn('Erreur lors de la lecture des dates d\'accident préchargées:', e);
            }
          }
        }

        // Si c'est un utilisateur externe, utiliser l'API
        if (isExternalUser) {
          const res = await fetch(`/api/patient/user?userId=${encodeURIComponent(userId)}`);
          if (!res.ok) {
            throw new Error(`Erreur HTTP ${res.status}`);
          }
          const data = await res.json();
          if (data.accidentDates && Array.isArray(data.accidentDates) && data.accidentDates.length > 0) {
            const validDates = data.accidentDates.filter((date: string) => date && date.trim() !== '');
            setAccidentDates(validDates);
            const sortedDates = validDates.sort(
              (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime(),
            );
            if (sortedDates.length > 0) {
              const oldestDate = new Date(sortedDates[0]);
              const today = new Date();
              const diffTime = today.getTime() - oldestDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setDaysSinceAccident(Math.max(diffDays, 1));
            }
          }
          return;
        }

        // Sinon, utiliser Firestore direct
        const db = getDbInstance();
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.accidentDates && Array.isArray(data.accidentDates) && data.accidentDates.length > 0) {
            const validDates = data.accidentDates.filter((date: string) => date && date.trim() !== '');
            setAccidentDates(validDates);
            const sortedDates = validDates.sort(
              (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime(),
            );
            if (sortedDates.length > 0) {
              const oldestDate = new Date(sortedDates[0]);
              const today = new Date();
              const diffTime = today.getTime() - oldestDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setDaysSinceAccident(Math.max(diffDays, 1));
            }
          }
        }
      } catch (error) {
        console.warn('Impossible de charger la date d\'accident:', error);
      }
    };
    loadAccidentDate();
  }, [userId, isExternalUser]);

  useEffect(() => {
    if (!selectedDate && entries.length > 0) {
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
          summary: String(entry.symptoms.reduce((intensity, item) => intensity + item.intensity, 0)),
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
      entry.medications?.reduce((acc, med) => acc + (med.intensity ?? 0), 0) ?? 0;
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

  const getDateLabel = (date: Date, period: number): string => {
    if (period <= 7) {
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(date);
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  const generateChartData = (
    period: number,
    valueExtractor: (entry: DailyEntry | undefined) => number,
  ): TrendChartDataPoint[] => {
    const today = new Date();
    const data: TrendChartDataPoint[] = [];
    const daysCount = period - 1;

    for (let i = daysCount; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateISO = date.toISOString().split('T')[0];
      const entry = entries.find((e) => e.dateISO === dateISO);

      data.push({
        dateISO,
        label: getDateLabel(date, period),
        value: valueExtractor(entry),
      });
    }

    return data;
  };

  const symptomChartData = useMemo<TrendChartDataPoint[]>(
    () => generateChartData(chartPeriods.symptom, (entry) =>
      entry?.symptoms?.reduce((sum, s) => sum + (s.intensity ?? 0), 0) ?? 0,
    ),
    [entries, chartPeriods.symptom],
  );

  const activityChartData = useMemo<TrendChartDataPoint[]>(
    () => generateChartData(chartPeriods.activity, (entry) =>
      entry?.activities?.reduce((sum, a) => sum + (a.duration ?? 0), 0) ?? 0,
    ),
    [entries, chartPeriods.activity],
  );

  const medicationChartData = useMemo<TrendChartDataPoint[]>(
    () => generateChartData(chartPeriods.medication, (entry) =>
      entry?.medications?.reduce((sum, m) => sum + (m.intensity ?? 0), 0) ?? 0,
    ),
    [entries, chartPeriods.medication],
  );

  const perturbateurChartData = useMemo<TrendChartDataPoint[]>(
    () => generateChartData(chartPeriods.perturbateur, (entry) => entry?.perturbateurs?.length ?? 0),
    [entries, chartPeriods.perturbateur],
  );

  const gentleActivityChartData = useMemo<TrendChartDataPoint[]>(
    () => generateChartData(chartPeriods.gentleActivity, (entry) =>
      entry?.activities
        ?.filter((a) => isGentleActivityId(a.id))
        .reduce((sum, a) => sum + (a.duration ?? 0), 0) ?? 0,
    ),
    [entries, chartPeriods.gentleActivity],
  );

  const SymptomDetailSection = () => {
    if (!selectedEntry) return <p className="text-white/60 text-sm">Aucune donnée pour cette journée.</p>;
    const symptoms = selectedEntry.symptoms ?? [];
    if (!symptoms.length) return <p className="text-white/60 text-sm">Aucun symptôme enregistré.</p>;

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {symptoms.map((symptom) => {
            const option = SYMPTOM_OPTIONS.find((opt) => opt.id === symptom.id);
            const label = option?.label ?? symptom.label ?? symptom.id;
            const intensity = symptom.intensity ?? 0;
            return (
              <div key={symptom.id} className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-white font-medium text-sm">{label}</p>
                  <span className="text-white/70 text-sm font-medium">{intensity}/6</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(intensity / 6, 1) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-white/70 text-sm">
          Total du jour : <span className="text-white">{daySummary.symptomScore}/132</span>
        </p>
      </>
    );
  };

  const MedicationDetailSection = () => {
    if (!selectedEntry) return <p className="text-white/60 text-sm">Aucune donnée pour cette journée.</p>;
    const meds = selectedEntry.medications?.filter((med) => (med.intensity ?? 0) > 0) ?? [];
    if (!meds.length) return <p className="text-white/60 text-sm">Aucune prise enregistrée.</p>;

    return (
      <div className="space-y-3">
        {meds.map((med) => (
          <div key={med.id} className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">{med.label}</p>
              {med.dosage && <p className="text-white/60 text-xs">{med.dosage}</p>}
            </div>
            <span className="text-white text-lg font-semibold">{med.intensity}</span>
          </div>
        ))}
      </div>
    );
  };

  const ActivityDetailSection = ({ isGentle = false }: { isGentle?: boolean }) => {
    if (!selectedEntry) return <p className="text-white/60 text-sm">Aucune donnée pour cette journée.</p>;
    const activities =
      selectedEntry.activities?.filter((activity) => {
        const normalizedId = activity.id.replace(/^gentle_/, '');
        return isGentle ? isGentleActivityId(normalizedId) : !isGentleActivityId(normalizedId);
      }) ?? [];
    if (!activities.length) {
      return <p className="text-white/60 text-sm">{isGentle ? 'Aucune activité douce enregistrée.' : 'Aucune activité enregistrée.'}</p>;
    }

    return (
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <p className="text-white font-medium text-sm">{activity.label}</p>
            <span className="text-white text-lg font-semibold">{activity.duration ?? 0} min</span>
          </div>
        ))}
      </div>
    );
  };

  const PerturbateurDetailSection = () => {
    if (!selectedEntry) return <p className="text-white/60 text-sm">Aucune donnée pour cette journée.</p>;
    const perturbateurs = selectedEntry.perturbateurs ?? [];
    if (!perturbateurs.length) return <p className="text-white/60 text-sm">Aucun élément perturbateur enregistré.</p>;

    return (
      <div className="flex flex-wrap gap-3">
        {perturbateurs.map((item) => (
          <span key={item} className="px-4 py-2 rounded-full border border-white/20 text-white/80 bg-black/30 text-sm">
            {item}
          </span>
        ))}
      </div>
    );
  };

  const renderDetailSection = () => {
    switch (detailCategory) {
      case 'symptomScore':
        return <SymptomDetailSection />;
      case 'medications':
        return <MedicationDetailSection />;
      case 'activities':
        return <ActivityDetailSection />;
      case 'gentleActivities':
        return <ActivityDetailSection isGentle />;
      case 'perturbateurs':
        return <PerturbateurDetailSection />;
      default:
        return <p className="text-white/60 text-sm">Aucune donnée pour cette journée.</p>;
    }
  };

  const summaryChart = useMemo(() => {
    const baseSegments: SummarySegment[] = [
      {
        key: 'symptomScore',
        label: 'Symptômes',
        value: daySummary.symptomScore,
        helper: 'Score total /132',
        color: '#C084FC',
      },
      {
        key: 'medications',
        label: 'Médicaments',
        value: daySummary.medicationTakes,
        helper: 'Prises validées',
        color: '#38BDF8',
        weight: 5,
      },
      {
        key: 'activities',
        label: 'Activités',
        value: daySummary.activityMinutes,
        helper: 'Minutes actives',
        color: '#F97316',
        weight: 0.1,
      },
      {
        key: 'gentleActivities',
        label: 'Activités douces / thérapies',
        value: daySummary.gentleMinutes,
        helper: 'Minutes apaisantes',
        color: '#34D399',
        weight: 0.1,
      },
      {
        key: 'perturbateurs',
        label: 'Perturbateurs',
        value: daySummary.perturbateurs,
        helper: 'Éléments déclenchants',
        color: '#F43F5E',
        weight: 5,
      },
    ];

    const total = baseSegments.reduce((sum, segment) => {
      const weightedValue = segment.weight ? segment.value * segment.weight : segment.value;
      return sum + weightedValue;
    }, 0);

    const segmentsWithPercentage = baseSegments.map((segment) => {
      const weightedValue = segment.weight ? segment.value * segment.weight : segment.value;
      const percentage = total > 0 ? (weightedValue / total) * 100 : 0;
      return { ...segment, percentage };
    });

    const sortedSegments = [...segmentsWithPercentage].sort((a, b) => b.percentage - a.percentage);

    let cumulative = 0;
    const segments: ComputedSummarySegment[] = sortedSegments.map((segment) => {
      const data: ComputedSummarySegment = { ...segment, start: cumulative };
      cumulative += segment.percentage;
      return data;
    });

    return { total, segments };
  }, [daySummary]);

  const activeSummarySegment = useMemo(() => {
    if (!summaryChart.segments.length) {
      return null;
    }
    const targetKey = hoveredSegment ?? detailCategory;
    return summaryChart.segments.find((segment) => segment.key === targetKey) ?? summaryChart.segments[0];
  }, [summaryChart, hoveredSegment, detailCategory]);

  const segmentConfig: Record<DetailCategory, {
    gradientId: string;
    filterId: string;
    gradientColors: { offset: string; color: string }[];
    glowColor: string;
  }> = {
    symptomScore: {
      gradientId: 'symptomGradient',
      filterId: 'glow-symptom',
      gradientColors: [
        { offset: '0%', color: '#C084FC' },
        { offset: '50%', color: '#A855F7' },
        { offset: '100%', color: '#9333EA' },
      ],
      glowColor: '#A855F7',
    },
    medications: {
      gradientId: 'medicationGradient',
      filterId: 'glow-medication',
      gradientColors: [
        { offset: '0%', color: '#60CDF5' },
        { offset: '50%', color: '#0EA5E9' },
        { offset: '100%', color: '#38BDF8' },
      ],
      glowColor: '#0EA5E9',
    },
    activities: {
      gradientId: 'activityGradient',
      filterId: 'glow-activity',
      gradientColors: [
        { offset: '0%', color: '#FF8C69' },
        { offset: '50%', color: '#FF6B35' },
        { offset: '100%', color: '#F97316' },
      ],
      glowColor: '#FF6B35',
    },
    gentleActivities: {
      gradientId: 'gentleGradient',
      filterId: 'glow-gentle',
      gradientColors: [
        { offset: '0%', color: '#4ADE80' },
        { offset: '50%', color: '#10B981' },
        { offset: '100%', color: '#34D399' },
      ],
      glowColor: '#10B981',
    },
    perturbateurs: {
      gradientId: 'perturbateurGradient',
      filterId: 'glow-perturbateur',
      gradientColors: [
        { offset: '0%', color: '#F87171' },
        { offset: '50%', color: '#EF4444' },
        { offset: '100%', color: '#F43F5E' },
      ],
      glowColor: '#EF4444',
    },
  };

  const getChartDescription = (period: number, sinceAccident: number | null, baseLabel: string): string => {
    if (sinceAccident && period === sinceAccident) {
      return baseLabel.replace('sur les X derniers jours', 'depuis l\'accident');
    }
    return baseLabel.replace('X', period.toString());
  };

  const chartRadius = 90;
  const chartCircumference = 2 * Math.PI * chartRadius;

  if (entriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/70">
        ID patient introuvable.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Calendrier</p>
            <h1 className="text-4xl font-bold text-white">{headerTitle}</h1>
            <p className="text-white/70 max-w-2xl">
              Visualise rapidement tes journées passées, repère les jours complétés,
              brouillons ou à remplir et ouvre le journal associé en un clic.
            </p>
          </header>

          <section className="space-y-4 w-full">
            <MonthlyCalendar
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              entriesMap={calendarEntriesMap}
              isLoading={entriesLoading}
              accidentDates={accidentDates}
            />
          </section>

          <section className="bg-transparent rounded-3xl p-6">
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
              <div className="flex flex-col lg:flex-row gap-10 lg:items-stretch w-full">
                <div className="order-2 lg:order-1 flex-1 space-y-3">
                  {summaryChart.segments.map((segment) => {
                    const isActive = detailCategory === segment.key;
                    return (
                      <div
                        key={segment.key}
                        role="button"
                        tabIndex={0}
                        onClick={() => setDetailCategory(segment.key as DetailCategory)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setDetailCategory(segment.key as DetailCategory);
                          }
                        }}
                        className={`flex items-center justify-between gap-3 bg-black/30 border rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
                          isActive ? 'border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-white/10'
                        }`}
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
                            {summaryChart.total > 0 ? segment.percentage.toFixed(0) : '0'}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="order-1 lg:order-2 flex justify-center flex-1">
                  <div className="relative w-full max-w-[420px] group">
                    <svg
                      viewBox="0 0 240 240"
                      className="w-full h-auto drop-shadow-2xl"
                    >
                      <defs>
                        {Object.entries(segmentConfig).map(([key, config]) => (
                          <React.Fragment key={key}>
                            <filter id={config.filterId} x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                              <feOffset in="coloredBlur" dx="0" dy="0" result="offsetBlur"/>
                              <feFlood floodColor={config.glowColor} floodOpacity="0.6"/>
                              <feComposite in2="offsetBlur" operator="in"/>
                              <feMerge>
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                            <radialGradient id={config.gradientId} cx="50%" cy="50%">
                              {config.gradientColors.map((stop, idx) => (
                                <stop key={idx} offset={stop.offset} stopColor={stop.color} stopOpacity="1" />
                              ))}
                            </radialGradient>
                          </React.Fragment>
                        ))}
                      </defs>
                      <circle
                        cx="120"
                        cy="120"
                        r={chartRadius}
                        fill="transparent"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="22"
                        className="transition-all duration-500"
                      />
                      {summaryChart.segments.map((segment) => {
                        if (segment.percentage <= 0) return null;
                        const dash = (segment.percentage / 100) * chartCircumference;
                        const gap = chartCircumference - dash;
                        const offset = chartCircumference * (1 - segment.start / 100);
                        const { gradientId, filterId } = segmentConfig[segment.key];
                        const isHovered = hoveredSegment === segment.key;
                        return (
                          <g key={segment.key}>
                            <circle
                              cx="120"
                              cy="120"
                              r={chartRadius}
                              fill="transparent"
                              stroke={`url(#${gradientId})`}
                              strokeWidth={isHovered ? 26 : 22}
                              strokeDasharray={`${dash} ${gap}`}
                              strokeDashoffset={offset}
                              strokeLinecap="butt"
                              transform="rotate(-90 120 120)"
                              filter={`url(#${filterId})`}
                              className="transition-all duration-300 ease-out"
                              style={{ opacity: 1 }}
                              pointerEvents="none"
                            />
                            <circle
                              cx="120"
                              cy="120"
                              r={chartRadius}
                              fill="transparent"
                              stroke="transparent"
                              strokeWidth={32}
                              strokeDasharray={`${dash} ${gap}`}
                              strokeDashoffset={offset}
                              strokeLinecap="butt"
                              transform="rotate(-90 120 120)"
                              className="cursor-pointer"
                              style={{ opacity: 1 }}
                              onMouseEnter={() => setHoveredSegment(segment.key)}
                              onMouseLeave={() => setHoveredSegment(null)}
                              onFocus={() => setHoveredSegment(segment.key)}
                              onBlur={() => setHoveredSegment(null)}
                              onClick={() => setDetailCategory(segment.key)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setDetailCategory(segment.key);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`${segment.label} - ${segment.value} (${segment.percentage.toFixed(0)}%)`}
                              pointerEvents="stroke"
                            />
                          </g>
                        );
                      })}
                    </svg>
                    {activeSummarySegment && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-1">
                          {activeSummarySegment.label}
                        </p>
                        <p
                          className="text-4xl font-semibold"
                          style={{ color: activeSummarySegment.color }}
                        >
                          {activeSummarySegment.value}
                        </p>
                        <p className="text-sm text-white/60">
                          {activeSummarySegment.helper}
                        </p>
                        <p className="mt-2 text-white/80 text-sm">
                          {summaryChart.total > 0 ? `${activeSummarySegment.percentage.toFixed(0)}% de la journée` : 'Aucune donnée'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-white/50">
                <p>Sélectionne un jour dans le calendrier pour voir le résumé.</p>
              </div>
            )}
          </section>

          {selectedDate && (
            <section className="bg-transparent rounded-3xl p-6 space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-1">
                  {detailCategory === 'symptomScore' && 'Symptômes (1-6)'}
                  {detailCategory === 'medications' && 'Médicaments / thérapies'}
                  {detailCategory === 'activities' && 'Activités & temps effectué'}
                  {detailCategory === 'gentleActivities' && 'Activités douces & thérapies'}
                  {detailCategory === 'perturbateurs' && 'Éléments perturbateurs'}
                </p>
                <p className="text-white/80 text-sm">
                  {detailCategory === 'symptomScore' && 'Intensité ressentie pour chaque symptôme (0 = non ressenti)'}
                  {detailCategory === 'medications' && 'Nombre total de prises pour chaque médicament'}
                  {detailCategory === 'activities' && 'Durée (min) pour les activités actives'}
                  {detailCategory === 'gentleActivities' && 'Durée (min) pour les activités douces et thérapies'}
                  {detailCategory === 'perturbateurs' && 'Facteurs déclencheurs enregistrés'}
                </p>
              </div>
              {renderDetailSection()}
            </section>
          )}

          {selectedDate && (
            <section className="bg-transparent rounded-3xl p-6">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-1">
                  Notes complémentaires
                </p>
                <p className="text-white/80 text-sm">
                  Informations supplémentaires pour cette journée
                </p>
              </div>
              {selectedEntry?.notes ? (
                <div className="bg-black/30 border border-white/10 rounded-2xl p-5">
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                    {selectedEntry.notes}
                  </p>
                </div>
              ) : (
                <div className="bg-black/30 border border-white/10 rounded-2xl p-5">
                  <p className="text-white/60 text-sm italic">
                    Aucune note complémentaire pour ce jour
                  </p>
                </div>
              )}
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="w-full min-w-0 flex">
              <TrendChart
                title="Évolution des symptômes"
                description={getChartDescription(chartPeriods.symptom, daysSinceAccident, 'Nombre total de symptômes sur les X derniers jours')}
                data={symptomChartData}
                period={chartPeriods.symptom}
                onPeriodChange={(period) => setChartPeriod('symptom', period)}
                lineColor="#C084FC"
                valueFormatter={(value) => `Symptômes: ${value}/132`}
                daysSinceAccident={daysSinceAccident}
                customPeriodLabel={daysSinceAccident ? "Depuis l'accident" : undefined}
              />
            </div>

            <div className="w-full min-w-0 flex">
              <TrendChart
                title="Évolution des activités"
                description={getChartDescription(chartPeriods.activity, daysSinceAccident, 'Temps total d\'activités sur les X derniers jours')}
                data={activityChartData}
                period={chartPeriods.activity}
                onPeriodChange={(period) => setChartPeriod('activity', period)}
                lineColor="#F97316"
                valueFormatter={(value) => `${value} min`}
                daysSinceAccident={daysSinceAccident}
                customPeriodLabel={daysSinceAccident ? "Depuis l'accident" : undefined}
              />
            </div>

            <div className="w-full min-w-0 flex">
              <TrendChart
                title="Évolution des médicaments"
                description={getChartDescription(chartPeriods.medication, daysSinceAccident, 'Nombre total de prises sur les X derniers jours')}
                data={medicationChartData}
                period={chartPeriods.medication}
                onPeriodChange={(period) => setChartPeriod('medication', period)}
                lineColor="#38BDF8"
                valueFormatter={(value) => `${value} prise${value > 1 ? 's' : ''}`}
                daysSinceAccident={daysSinceAccident}
                customPeriodLabel={daysSinceAccident ? "Depuis l'accident" : undefined}
              />
            </div>

            <div className="w-full min-w-0 flex">
              <TrendChart
                title="Évolution des éléments perturbateurs"
                description={getChartDescription(chartPeriods.perturbateur, daysSinceAccident, 'Nombre d\'éléments perturbateurs sur les X derniers jours')}
                data={perturbateurChartData}
                period={chartPeriods.perturbateur}
                onPeriodChange={(period) => setChartPeriod('perturbateur', period)}
                lineColor="#F43F5E"
                valueFormatter={(value) => `${value} élément${value > 1 ? 's' : ''}`}
                daysSinceAccident={daysSinceAccident}
                customPeriodLabel={daysSinceAccident ? "Depuis l'accident" : undefined}
              />
            </div>

            <div className="w-full min-w-0 flex">
              <TrendChart
                title="Évolution des activités douces & thérapies"
                description={getChartDescription(chartPeriods.gentleActivity, daysSinceAccident, 'Temps total d\'activités douces sur les X derniers jours')}
                data={gentleActivityChartData}
                period={chartPeriods.gentleActivity}
                onPeriodChange={(period) => setChartPeriod('gentleActivity', period)}
                lineColor="#34D399"
                valueFormatter={(value) => `${value} min`}
                daysSinceAccident={daysSinceAccident}
                customPeriodLabel={daysSinceAccident ? "Depuis l'accident" : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isGentleActivityId(id: string) {
  return id.startsWith('gentle_') || GENTLE_ACTIVITY_IDS.has(id);
}

