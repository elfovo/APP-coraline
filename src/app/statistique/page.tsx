'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import WeeklySummary from '@/components/dashboard/WeeklySummary';
import CategoryTrendCard from '@/components/dashboard/CategoryTrendCard';
import { SimpleButton } from '@/components/buttons';
import type { DailyEntry, WeeklyTotals } from '@/types/journal';
import { generateWeeklyReportPdf } from '@/lib/export';
import {
  listenRecentEntries,
  computeWeeklyTotals,
} from '@/lib/firestoreEntries';

export default function StatistiquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setEntriesLoading(true);
    const unsubscribe = listenRecentEntries(user.uid, 42, (docs) => {
      setEntries(docs);
      setEntriesLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const weeksMap = useMemo(() => {
    return entries.reduce((acc, entry) => {
      const label = getWeekLabel(entry.dateISO);
      if (!acc[label]) acc[label] = [];
      acc[label].push(entry);
      return acc;
    }, {} as Record<string, DailyEntry[]>);
  }, [entries]);

  const orderedWeekLabels = useMemo(() => {
    return Object.keys(weeksMap).sort((a, b) => {
      const latestA = weeksMap[a]?.[0]?.dateISO ?? '';
      const latestB = weeksMap[b]?.[0]?.dateISO ?? '';
      return latestB.localeCompare(latestA);
    });
  }, [weeksMap]);

  const currentWeekLabel = orderedWeekLabels[0] ?? 'Semaine en cours';
  const currentWeekEntries = weeksMap[currentWeekLabel] ?? [];
  const currentWeekTotals = useMemo(
    () => computeWeeklyTotals(currentWeekEntries),
    [currentWeekEntries],
  );

  const seriesData = useMemo(() => {
    const result = orderedWeekLabels.slice(0, 6).map((label) => {
      const totals = computeWeeklyTotals(weeksMap[label] ?? []);
      return { weekLabel: label, totals };
    });
    if (!result.length) {
      return [{ weekLabel: currentWeekLabel, totals: currentWeekTotals }];
    }
    return result;
  }, [orderedWeekLabels, weeksMap, currentWeekLabel, currentWeekTotals]);

  const categorySeries = {
    symptoms: seriesData.map((item) => ({
      weekLabel: item.weekLabel,
      value: item.totals.symptoms,
    })),
    medications: seriesData.map((item) => ({
      weekLabel: item.weekLabel,
      value: item.totals.medications,
    })),
    activities: seriesData.map((item) => ({
      weekLabel: item.weekLabel,
      value: item.totals.activities,
    })),
    perturbateurs: seriesData.map((item) => ({
      weekLabel: item.weekLabel,
      value: item.totals.perturbateurs,
    })),
  };

  if (loading || entriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Chargement des statistiques...</p>
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
        <div className="flex flex-col gap-10">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Analyses
              </p>
              <h1 className="text-4xl font-bold text-white mt-1">
                Statistiques détaillées
              </h1>
              <p className="text-white/70 mt-2 max-w-2xl">
                Compare chaque catégorie par semaine et exporte des rapports PDF
                prêts à envoyer à ton thérapeute.
              </p>
            </div>
          </header>

          <WeeklySummary totals={currentWeekTotals} weekLabel={currentWeekLabel} />

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CategoryTrendCard
              title="Symptômes"
              description="Somme des intensités ressenties (max 132)."
              data={categorySeries.symptoms}
              max={132}
              accentGradient="from-rose-500 via-fuchsia-500 to-purple-500"
            />
            <CategoryTrendCard
              title="Médicaments / Thérapies"
              description="Score hebdomadaire sur l’observance (1-10 par élément)."
              data={categorySeries.medications}
              max={100}
              accentGradient="from-blue-500 via-cyan-500 to-emerald-400"
            />
            <CategoryTrendCard
              title="Activités (minutes)"
              description="Temps actif par semaine + impact post-activité."
              data={categorySeries.activities}
              max={600}
              unit=" min"
              accentGradient="from-amber-400 via-orange-500 to-red-500"
            />
            <CategoryTrendCard
              title="Éléments perturbateurs"
              description="Nombre d’éléments déclenchants signalés."
              data={categorySeries.perturbateurs}
              max={10}
              accentGradient="from-slate-200 via-slate-400 to-slate-600"
            />
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                  Export rapide
                </p>
                <h2 className="text-2xl text-white font-semibold">
                  Partager avec ton équipe médicale
                </h2>
                <p className="text-white/70 mt-2 max-w-3xl">
                  Les exports regroupent les données journalières, les totaux
                  hebdos et un résumé rédigé prêt à être envoyé.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-xl">
                <SimpleButton
                  size="lg"
                  className="w-full"
                  onClick={() => setPreviewOpen(true)}
                  disabled={!currentWeekEntries.length}
                >
                  Exporter la semaine courante (PDF)
                </SimpleButton>
                <SimpleButton
                  size="lg"
                  variant="outline"
                  className="w-full bg-white text-gray-900 border-white/30 disabled:opacity-80"
                  disabled
                >
                  Export CSV brut
                </SimpleButton>
              </div>
            </div>
          </section>

          <ExportPreviewModal
            open={previewOpen}
            weekLabel={currentWeekLabel}
            totals={currentWeekTotals}
            entries={currentWeekEntries}
            onClose={() => setPreviewOpen(false)}
            onConfirm={async () => {
              if (!currentWeekEntries.length) return;
              try {
                setExportError(null);
                setIsGenerating(true);
                await generateWeeklyReportPdf({
                  weekLabel: currentWeekLabel,
                  totals: currentWeekTotals,
                  entries: currentWeekEntries,
                  userEmail: user?.email ?? undefined,
                });
                setPreviewOpen(false);
              } catch (error) {
                console.error(error);
                setExportError(
                  'Impossible de générer le PDF pour le moment. Veuillez réessayer.',
                );
              } finally {
                setIsGenerating(false);
              }
            }}
            isLoading={isGenerating}
            error={exportError}
          />
        </div>
      </div>
    </div>
  );
}

interface ExportPreviewModalProps {
  open: boolean;
  weekLabel: string;
  totals: WeeklyTotals;
  entries: DailyEntry[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

function ExportPreviewModal({
  open,
  weekLabel,
  totals,
  entries,
  onClose,
  onConfirm,
  isLoading,
  error,
}: ExportPreviewModalProps) {
  if (!open) return null;

  const summaryItems = [
    { label: 'Symptômes', value: `${totals.symptoms}/132` },
    { label: 'Médicaments / Thérapies', value: totals.medications },
    { label: 'Activités (min)', value: totals.activities },
    { label: 'Perturbateurs', value: totals.perturbateurs },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl bg-black/70 border border-white/20 rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">
              Prévisualisation PDF
            </p>
            <h2 className="text-2xl text-white font-semibold">
              Rapport hebdo {weekLabel}
            </h2>
            <p className="text-white/70 mt-2">
              Totaux, analyses et résumé quotidien seront inclus dans le
              document exporté.
            </p>
          </div>
          <button
            className="text-white/60 hover:text-white text-2xl"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {item.label}
              </p>
              <p className="text-xl font-semibold mt-2">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 h-48 overflow-y-auto">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-2">
            Extrait du journal
          </p>
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.dateISO}
                className="flex items-center justify-between text-white/80 text-sm"
              >
                <span>
                  {entry.dayLabel || entry.dateISO} ·{' '}
                  {entry.status === 'complete'
                    ? 'Complet'
                    : entry.status === 'draft'
                    ? 'Brouillon'
                    : 'À compléter'}
                </span>
                <span>
                  Sympt.{' '}
                  {entry.symptoms.reduce(
                    (acc, symptom) => acc + symptom.intensity,
                    0,
                  )}
                  /132
                </span>
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <SimpleButton
            variant="outline"
            className="flex-1 bg-transparent text-white border-white/30"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </SimpleButton>
          <SimpleButton
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Génération en cours...' : 'Créer le PDF'}
          </SimpleButton>
        </div>
      </div>
    </div>
  );
}

function getWeekLabel(dateISO: string) {
  const date = new Date(`${dateISO}T00:00:00`);
  const target = new Date(date.valueOf());
  const dayNumber = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(target.getUTCFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7,
    );
  return `Semaine ${weekNumber.toString().padStart(2, '0')}`;
}
