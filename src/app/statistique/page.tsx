'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';
import TrendChart, {
  type TrendChartDataPoint,
} from '@/components/dashboard/TrendChart';
import type { DailyEntry } from '@/types/journal';
import { listenRecentEntries } from '@/lib/firestoreEntries';
import { getDbInstance } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

export default function StatistiquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [detailCategory, setDetailCategory] = useState<DetailCategory>('symptomScore');
  const [daysSinceAccident, setDaysSinceAccident] = useState<number | null>(null);
  const [symptomChartPeriod, setSymptomChartPeriod] = useState<number>(7);
  const [activityChartPeriod, setActivityChartPeriod] = useState<number>(7);
  const [medicationChartPeriod, setMedicationChartPeriod] = useState<number>(7);
  const [perturbateurChartPeriod, setPerturbateurChartPeriod] = useState<number>(7);
  const [gentleActivityChartPeriod, setGentleActivityChartPeriod] = useState<number>(7);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setEntriesLoading(true);
    // Charger plus d'entrées si nécessaire (jusqu'à 1000 pour couvrir les cas d'accidents anciens)
    const maxEntries = daysSinceAccident && daysSinceAccident > 400 
      ? Math.min(daysSinceAccident + 50, 1000) 
      : 400;
    const unsubscribe = listenRecentEntries(user.uid, maxEntries, (docs) => {
      setEntries(docs);
      setEntriesLoading(false);
      if (docs.length) {
        setSelectedDate((prev) => prev || docs[0].dateISO);
      }
    });
    return () => unsubscribe();
  }, [user, daysSinceAccident]);

  useEffect(() => {
    const loadAccidentDate = async () => {
      if (!user) return;
      try {
        const db = getDbInstance();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.accidentDates && Array.isArray(data.accidentDates) && data.accidentDates.length > 0) {
            // Trouver la date la plus ancienne
            const sortedDates = data.accidentDates
              .filter((date: string) => date && date.trim() !== '')
              .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());
            
            if (sortedDates.length > 0) {
              const oldestDate = new Date(sortedDates[0]);
              const today = new Date();
              const diffTime = today.getTime() - oldestDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setDaysSinceAccident(Math.max(diffDays, 1)); // Au minimum 1 jour
            }
          }
        }
      } catch (error) {
        console.warn('Impossible de charger la date d\'accident:', error);
      }
    };
    loadAccidentDate();
  }, [user]);

  useEffect(() => {
    // Permettre la sélection de n'importe quel jour, même vide
    // Ne réinitialiser que si aucune date n'est sélectionnée et qu'il y a des entrées
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

  // Helper function pour générer les labels de dates
  const getDateLabel = (date: Date, period: number): string => {
    if (period <= 7) {
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(date);
    } else if (period <= 30) {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
      }).format(date);
    } else {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
      }).format(date);
    }
  };

  const symptomChartData = useMemo<TrendChartDataPoint[]>(() => {
    const today = new Date();
    const data = [];
    const daysCount = symptomChartPeriod - 1;
    
    for (let i = daysCount; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateISO = date.toISOString().split('T')[0];
      const entry = entries.find((e) => e.dateISO === dateISO);
      
      const symptomCount = entry?.symptoms?.reduce((sum, s) => sum + (s.intensity ?? 0), 0) ?? 0;
      
      data.push({
        dateISO,
        label: getDateLabel(date, symptomChartPeriod),
        value: symptomCount,
      });
    }
    
    return data;
  }, [entries, symptomChartPeriod]);

  const activityChartData = useMemo<TrendChartDataPoint[]>(() => {
    const today = new Date();
    const data = [];
    const daysCount = activityChartPeriod - 1;
    
    for (let i = daysCount; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateISO = date.toISOString().split('T')[0];
      const entry = entries.find((e) => e.dateISO === dateISO);
      
      const totalMinutes = entry?.activities?.reduce((sum, a) => sum + (a.duration ?? 0), 0) ?? 0;
      
      data.push({
        dateISO,
        label: getDateLabel(date, activityChartPeriod),
        value: totalMinutes,
      });
    }
    
    return data;
  }, [entries, activityChartPeriod]);

  const medicationChartData = useMemo<TrendChartDataPoint[]>(() => {
    const today = new Date();
    const data = [];
    const daysCount = medicationChartPeriod - 1;
    
    for (let i = daysCount; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateISO = date.toISOString().split('T')[0];
      const entry = entries.find((e) => e.dateISO === dateISO);
      
      // Somme des intensités des médicaments (comme dans daySummary)
      const medicationTakes = entry?.medications?.reduce((sum, m) => sum + (m.intensity ?? 0), 0) ?? 0;
      
      data.push({
        dateISO,
        label: getDateLabel(date, medicationChartPeriod),
        value: medicationTakes,
      });
    }
    
    return data;
  }, [entries, medicationChartPeriod]);

  const perturbateurChartData = useMemo<TrendChartDataPoint[]>(() => {
    const today = new Date();
    const data = [];
    const daysCount = perturbateurChartPeriod - 1;
    
    for (let i = daysCount; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateISO = date.toISOString().split('T')[0];
      const entry = entries.find((e) => e.dateISO === dateISO);
      
      // Nombre de perturbateurs (comme dans daySummary)
      const perturbateurCount = entry?.perturbateurs?.length ?? 0;
      
      data.push({
        dateISO,
        label: getDateLabel(date, perturbateurChartPeriod),
        value: perturbateurCount,
      });
    }
    
    return data;
  }, [entries, perturbateurChartPeriod]);

  const gentleActivityChartData = useMemo<TrendChartDataPoint[]>(() => {
    const today = new Date();
    const data = [];
    const daysCount = gentleActivityChartPeriod - 1;
    
    for (let i = daysCount; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateISO = date.toISOString().split('T')[0];
      const entry = entries.find((e) => e.dateISO === dateISO);
      
      // Minutes d'activités douces
      const gentleMinutes = entry?.activities
        ?.filter((a) => isGentleActivityId(a.id))
        .reduce((sum, a) => sum + (a.duration ?? 0), 0) ?? 0;
      
      data.push({
        dateISO,
        label: getDateLabel(date, gentleActivityChartPeriod),
        value: gentleMinutes,
      });
    }
    
    return data;
  }, [entries, gentleActivityChartPeriod]);


  const renderDetailSection = () => {
    if (!selectedEntry) {
      return (
        <p className="text-white/60 text-sm">Aucune donnée pour cette journée.</p>
      );
    }

    if (detailCategory === 'symptomScore') {
      const symptoms = selectedEntry.symptoms ?? [];
      if (!symptoms.length) {
        return <p className="text-white/60 text-sm">Aucun symptôme enregistré.</p>;
      }
      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {symptoms.map((symptom) => {
              const option = SYMPTOM_OPTIONS.find((opt) => opt.id === symptom.id);
              const label = option?.label ?? symptom.label ?? symptom.id;
              const intensity = symptom.intensity ?? 0;
              return (
                <div
                  key={symptom.id}
                  className="bg-black/30 border border-white/5 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-white font-medium text-sm">{label}</p>
                    <span className="text-white/70 text-sm font-medium">
                      {intensity}/6
                    </span>
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
    }

    if (detailCategory === 'medications') {
      const meds =
        selectedEntry.medications?.filter((med) => (med.intensity ?? 0) > 0) ?? [];
      if (!meds.length) {
        return <p className="text-white/60 text-sm">Aucune prise enregistrée.</p>;
      }
      return (
        <div className="space-y-3">
          {meds.map((med) => (
            <div
              key={med.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-white font-medium text-sm">{med.label}</p>
                {med.dosage && (
                  <p className="text-white/60 text-xs">{med.dosage}</p>
                )}
              </div>
              <span className="text-white text-lg font-semibold">{med.intensity}</span>
            </div>
          ))}
        </div>
      );
    }

    if (detailCategory === 'activities') {
      const activities =
        selectedEntry.activities?.filter((activity) => {
          const normalizedId = activity.id.replace(/^gentle_/, '');
          return !isGentleActivityId(normalizedId);
        }) ?? [];
      if (!activities.length) {
        return <p className="text-white/60 text-sm">Aucune activité enregistrée.</p>;
      }
      return (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between"
            >
              <p className="text-white font-medium text-sm">{activity.label}</p>
              <span className="text-white text-lg font-semibold">
                {activity.duration ?? 0} min
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (detailCategory === 'gentleActivities') {
      const gentleActivities =
        selectedEntry.activities?.filter((activity) => {
          const normalizedId = activity.id.replace(/^gentle_/, '');
          return isGentleActivityId(normalizedId);
        }) ?? [];
      if (!gentleActivities.length) {
        return <p className="text-white/60 text-sm">Aucune activité douce enregistrée.</p>;
      }
      return (
        <div className="space-y-3">
          {gentleActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between"
            >
              <p className="text-white font-medium text-sm">{activity.label}</p>
              <span className="text-white text-lg font-semibold">
                {activity.duration ?? 0} min
              </span>
            </div>
          ))}
        </div>
      );
    }

    const perturbateurs = selectedEntry.perturbateurs ?? [];
    if (!perturbateurs.length) {
      return <p className="text-white/60 text-sm">Aucun élément perturbateur enregistré.</p>;
    }
    return (
      <div className="flex flex-wrap gap-3">
        {perturbateurs.map((item) => (
          <span
            key={item}
            className="px-4 py-2 rounded-full border border-white/20 text-white/80 bg-black/30 text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };
  const summaryChart = useMemo(() => {
    const baseSegments = [
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
        weight: 5, // 5 fois plus d'impact
      },
      {
        key: 'activities',
        label: 'Activités',
        value: daySummary.activityMinutes,
        helper: 'Minutes actives',
        color: '#F97316',
        weight: 0.1, // 10 fois moins d'impact
      },
      {
        key: 'gentleActivities',
        label: 'Activités douces / thérapies',
        value: daySummary.gentleMinutes,
        helper: 'Minutes apaisantes',
        color: '#34D399',
        weight: 0.1, // 10 fois moins d'impact
      },
      {
        key: 'perturbateurs',
        label: 'Perturbateurs',
        value: daySummary.perturbateurs,
        helper: 'Éléments déclenchants',
        color: '#F43F5E',
        weight: 5, // 5 fois plus d'impact
      },
    ];

    // Calculer le total avec les poids ajustés pour les activités
    const total = baseSegments.reduce((sum, segment) => {
      const weightedValue = segment.weight ? segment.value * segment.weight : segment.value;
      return sum + weightedValue;
    }, 0);

    // Calculer les pourcentages avec les valeurs pondérées et trier par ordre décroissant
    const segmentsWithPercentage = baseSegments.map((segment) => {
      const weightedValue = segment.weight ? segment.value * segment.weight : segment.value;
      const percentage = total > 0 ? (weightedValue / total) * 100 : 0;
      return { ...segment, percentage };
    });

    // Trier par pourcentage décroissant (le plus grand en premier)
    const sortedSegments = [...segmentsWithPercentage].sort((a, b) => b.percentage - a.percentage);

    // Recalculer les positions cumulatives pour le rendu SVG
    let cumulative = 0;
    const segments = sortedSegments.map((segment) => {
      const data = { ...segment, start: cumulative };
      cumulative += segment.percentage;
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
                          <filter id="glow-symptom" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="0" dy="0" result="offsetBlur"/>
                            <feFlood floodColor="#A855F7" floodOpacity="0.6"/>
                            <feComposite in2="offsetBlur" operator="in"/>
                            <feMerge>
                              <feMergeNode/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="glow-medication" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="0" dy="0" result="offsetBlur"/>
                            <feFlood floodColor="#0EA5E9" floodOpacity="0.6"/>
                            <feComposite in2="offsetBlur" operator="in"/>
                            <feMerge>
                              <feMergeNode/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="glow-activity" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="0" dy="0" result="offsetBlur"/>
                            <feFlood floodColor="#FF6B35" floodOpacity="0.6"/>
                            <feComposite in2="offsetBlur" operator="in"/>
                            <feMerge>
                              <feMergeNode/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="glow-gentle" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="0" dy="0" result="offsetBlur"/>
                            <feFlood floodColor="#10B981" floodOpacity="0.6"/>
                            <feComposite in2="offsetBlur" operator="in"/>
                            <feMerge>
                              <feMergeNode/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="glow-perturbateur" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="0" dy="0" result="offsetBlur"/>
                            <feFlood floodColor="#EF4444" floodOpacity="0.6"/>
                            <feComposite in2="offsetBlur" operator="in"/>
                            <feMerge>
                              <feMergeNode/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <radialGradient id="symptomGradient" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#C084FC" stopOpacity="1" />
                            <stop offset="50%" stopColor="#A855F7" stopOpacity="1" />
                            <stop offset="100%" stopColor="#9333EA" stopOpacity="1" />
                          </radialGradient>
                          <radialGradient id="medicationGradient" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#60CDF5" stopOpacity="1" />
                            <stop offset="50%" stopColor="#0EA5E9" stopOpacity="1" />
                            <stop offset="100%" stopColor="#38BDF8" stopOpacity="1" />
                          </radialGradient>
                          <radialGradient id="activityGradient" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#FF8C69" stopOpacity="1" />
                            <stop offset="50%" stopColor="#FF6B35" stopOpacity="1" />
                            <stop offset="100%" stopColor="#F97316" stopOpacity="1" />
                          </radialGradient>
                          <radialGradient id="gentleGradient" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#4ADE80" stopOpacity="1" />
                            <stop offset="50%" stopColor="#10B981" stopOpacity="1" />
                            <stop offset="100%" stopColor="#34D399" stopOpacity="1" />
                          </radialGradient>
                          <radialGradient id="perturbateurGradient" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#F87171" stopOpacity="1" />
                            <stop offset="50%" stopColor="#EF4444" stopOpacity="1" />
                            <stop offset="100%" stopColor="#F43F5E" stopOpacity="1" />
                          </radialGradient>
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
                          const gradientId = 
                            segment.key === 'symptomScore' ? 'symptomGradient' :
                            segment.key === 'medications' ? 'medicationGradient' :
                            segment.key === 'activities' ? 'activityGradient' :
                            segment.key === 'gentleActivities' ? 'gentleGradient' :
                            'perturbateurGradient';
                          const filterId = 
                            segment.key === 'symptomScore' ? 'glow-symptom' :
                            segment.key === 'medications' ? 'glow-medication' :
                            segment.key === 'activities' ? 'glow-activity' :
                            segment.key === 'gentleActivities' ? 'glow-gentle' :
                            'glow-perturbateur';
                          return (
                            <circle
                              key={segment.key}
                              cx="120"
                              cy="120"
                              r={chartRadius}
                              fill="transparent"
                              stroke={`url(#${gradientId})`}
                              strokeWidth="22"
                              strokeDasharray={`${dash} ${gap}`}
                              strokeDashoffset={offset}
                              strokeLinecap="butt"
                              transform="rotate(-90 120 120)"
                              filter={`url(#${filterId})`}
                              className="transition-all duration-700 ease-out group-hover:opacity-100"
                              style={{ opacity: 1 }}
                            />
                          );
                        })}
                      </svg>
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
            <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-6">
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
            <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
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
                description={
                  daysSinceAccident && symptomChartPeriod === daysSinceAccident
                    ? `Nombre total de symptômes depuis l'accident`
                    : `Nombre total de symptômes sur les ${symptomChartPeriod} derniers jours`
                }
                data={symptomChartData}
                period={symptomChartPeriod}
                onPeriodChange={setSymptomChartPeriod}
                lineColor="#C084FC"
                valueFormatter={(value) => `Symptômes: ${value}/132`}
                daysSinceAccident={daysSinceAccident}
                customPeriodLabel={daysSinceAccident ? "Depuis l'accident" : undefined}
              />
            </div>

            <div className="w-full min-w-0 flex">
              <TrendChart
                title="Évolution des activités"
                description={
                  daysSinceAccident && activityChartPeriod === daysSinceAccident
                    ? `Temps total d'activités depuis l'accident`
                    : `Temps total d'activités sur les ${activityChartPeriod} derniers jours`
                }
                data={activityChartData}
                period={activityChartPeriod}
                onPeriodChange={setActivityChartPeriod}
                lineColor="#F97316"
                valueFormatter={(value) => `${value} min`}
                daysSinceAccident={daysSinceAccident}
                customPeriodLabel={daysSinceAccident ? "Depuis l'accident" : undefined}
              />
            </div>

            <div className="w-full min-w-0 flex">
              <TrendChart
                title="Évolution des médicaments"
                description={
                  daysSinceAccident && medicationChartPeriod === daysSinceAccident
                    ? `Nombre total de prises depuis l'accident`
                    : `Nombre total de prises sur les ${medicationChartPeriod} derniers jours`
                }
                data={medicationChartData}
                period={medicationChartPeriod}
                onPeriodChange={setMedicationChartPeriod}
                lineColor="#38BDF8"
                valueFormatter={(value) => `${value} prise${value > 1 ? 's' : ''}`}
                daysSinceAccident={daysSinceAccident}
                customPeriodLabel={daysSinceAccident ? "Depuis l'accident" : undefined}
              />
            </div>

            <div className="w-full min-w-0 flex">
              <TrendChart
                title="Évolution des éléments perturbateurs"
                description={
                  daysSinceAccident && perturbateurChartPeriod === daysSinceAccident
                    ? `Nombre d'éléments perturbateurs depuis l'accident`
                    : `Nombre d'éléments perturbateurs sur les ${perturbateurChartPeriod} derniers jours`
                }
                data={perturbateurChartData}
                period={perturbateurChartPeriod}
                onPeriodChange={setPerturbateurChartPeriod}
                lineColor="#F43F5E"
                valueFormatter={(value) => `${value} élément${value > 1 ? 's' : ''}`}
                daysSinceAccident={daysSinceAccident}
                customPeriodLabel={daysSinceAccident ? "Depuis l'accident" : undefined}
              />
            </div>

            <div className="w-full min-w-0 flex">
              <TrendChart
                title="Évolution des activités douces & thérapies"
                description={
                  daysSinceAccident && gentleActivityChartPeriod === daysSinceAccident
                    ? `Temps total d'activités douces depuis l'accident`
                    : `Temps total d'activités douces sur les ${gentleActivityChartPeriod} derniers jours`
                }
                data={gentleActivityChartData}
                period={gentleActivityChartPeriod}
                onPeriodChange={setGentleActivityChartPeriod}
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
