'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SimpleButton } from '@/components/buttons';
import OutlineInput from '@/components/inputs/OutlineInput';
import ElasticSlider from '@/components/ElasticSlider';
import type { DailyEntry, SymptomEntry, MedicationEntry } from '@/types/journal';

export type SectionKey = 'symptomes' | 'medicaments' | 'activites' | 'perturbateurs';

interface DailyEntryFormProps {
  dateISO: string;
  dateLabel: string;
  initialEntry?: DailyEntry | null;
  initialSection?: SectionKey;
  isSubmitting?: boolean;
  onSave?: (entry: DailyEntry) => void | Promise<void>;
  onSaveDraft?: (entry: DailyEntry) => void | Promise<void>;
}

const SYMPTOM_OPTIONS = [
  { id: 'cephalee', label: 'Céphalée' },
  { id: 'vision', label: 'Troubles visuels' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'humeur', label: 'Saut d’humeur' },
  { id: 'anxiete', label: 'Anxiété' },
  { id: 'nausees', label: 'Nausées' },
];

const MEDICATION_OPTIONS = [
  { id: 'analgesique', label: 'Analgésique' },
  { id: 'antiInflammatoire', label: 'Anti-inflammatoire' },
  { id: 'repos', label: 'Repos guidé' },
  { id: 'hydratation', label: 'Hydratation' },
  { id: 'vestibulaire', label: 'Thérapie vestibulaire' },
];

const ACTIVITY_OPTIONS = [
  { id: 'marche', label: 'Marche légère' },
  { id: 'respiration', label: 'Respiration guidée' },
  { id: 'yoga', label: 'Yoga doux' },
  { id: 'lecture', label: 'Lecture' },
  { id: 'ecran', label: 'Ecrans < 30 min' },
];

const PERTURBATEUR_OPTIONS = [
  'Lumière forte',
  'Bruit élevé',
  'Stress',
  'Manque de sommeil',
  'Sur-stimulation',
];

const formatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const SectionCard = ({
  title,
  description,
  id,
  highlight,
  children,
}: {
  title: string;
  description: string;
  id: SectionKey;
  highlight?: boolean;
  children: React.ReactNode;
}) => (
  <div
    id={id}
    className={[
      'bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md scroll-mt-28',
      highlight ? 'ring-2 ring-white/50' : '',
    ].join(' ')}
  >
    <div className="flex flex-col gap-1 mb-4">
      <p className="text-sm uppercase tracking-[0.3em] text-white/60">{title}</p>
      <p className="text-white/80 text-sm">{description}</p>
    </div>
    {children}
  </div>
);

const buildBaseState = (options: { id: string }[], defaultValue = 0) =>
  Object.fromEntries(options.map((option) => [option.id, defaultValue]));

export default function DailyEntryForm({
  dateISO,
  dateLabel,
  initialEntry,
  initialSection,
  isSubmitting,
  onSave,
  onSaveDraft,
}: DailyEntryFormProps) {
  const [symptoms, setSymptoms] = useState<Record<string, number>>(() =>
    buildBaseState(SYMPTOM_OPTIONS),
  );
  const [medications, setMedications] = useState<Record<string, number>>(() =>
    buildBaseState(MEDICATION_OPTIONS),
  );
  const [activityMinutes, setActivityMinutes] = useState<Record<string, number>>(
    () => buildBaseState(ACTIVITY_OPTIONS),
  );
  const [customActivities, setCustomActivities] = useState<
    { id: string; label: string; duration: number }[]
  >([]);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDuration, setNewActivityDuration] = useState('');
  const [perturbateurs, setPerturbateurs] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!initialEntry) {
      setSymptoms(buildBaseState(SYMPTOM_OPTIONS));
      setMedications(buildBaseState(MEDICATION_OPTIONS));
      setActivityMinutes(buildBaseState(ACTIVITY_OPTIONS));
      setCustomActivities([]);
      setPerturbateurs(new Set());
      setNotes('');
      return;
    }

    const symptomState = buildBaseState(SYMPTOM_OPTIONS);
    initialEntry.symptoms.forEach((item) => {
      symptomState[item.id] = item.intensity;
    });
    setSymptoms(symptomState);

    const medicationState = buildBaseState(MEDICATION_OPTIONS);
    initialEntry.medications.forEach((item) => {
      medicationState[item.id] = item.intensity;
    });
    setMedications(medicationState);

    const activityState = buildBaseState(ACTIVITY_OPTIONS);
    initialEntry.activities
      .filter((activity) => !activity.custom)
      .forEach((activity) => {
        activityState[activity.id] = activity.duration;
      });
    setActivityMinutes(activityState);

    setCustomActivities(
      initialEntry.activities
        .filter((activity) => activity.custom)
        .map((activity) => ({
          id: activity.id,
          label: activity.label,
          duration: activity.duration,
        })),
    );

    setPerturbateurs(new Set(initialEntry.perturbateurs));
    setNotes(initialEntry.notes ?? '');
  }, [initialEntry]);

  const symptomTotal = useMemo(
    () => Object.values(symptoms).reduce((acc, value) => acc + value, 0),
    [symptoms],
  );

  const activityTotal = useMemo(() => {
    const base = Object.values(activityMinutes).reduce(
      (acc, value) => acc + value,
      0,
    );
    const custom = customActivities.reduce((acc, item) => acc + item.duration, 0);
    return base + custom;
  }, [activityMinutes, customActivities]);

  const handleAddCustomActivity = () => {
    const name = newActivityName.trim();
    const duration = Number(newActivityDuration);
    if (!name || Number.isNaN(duration) || duration <= 0) return;

    setCustomActivities((prev) => [
      ...prev,
      { id: `${Date.now()}-${name}`, label: name, duration },
    ]);
    setNewActivityName('');
    setNewActivityDuration('');
  };

  const togglePerturbateur = (item: string) => {
    setPerturbateurs((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const buildEntryPayload = (status: DailyEntry['status']): DailyEntry => {
    const buildSymptoms = (): SymptomEntry[] =>
      SYMPTOM_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        intensity: symptoms[option.id] ?? 0,
      })).filter((item) => item.intensity > 0);

    const buildMedications = (): MedicationEntry[] =>
      MEDICATION_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        intensity: medications[option.id] ?? 0,
      })).filter((item) => item.intensity > 0);

    const buildActivities = () => {
      const baseActivities = ACTIVITY_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        duration: activityMinutes[option.id] ?? 0,
        custom: false as const,
      })).filter((item) => item.duration > 0);

      const custom = customActivities.map((activity) => ({
        id: activity.id,
        label: activity.label,
        duration: activity.duration,
        custom: true as const,
      }));

      return [...baseActivities, ...custom];
    };

    const baseEntry: DailyEntry = {
      dateISO,
      dayLabel: formatter.format(new Date(`${dateISO}T00:00:00`)),
      status,
      symptoms: buildSymptoms(),
      medications: buildMedications(),
      activities: buildActivities(),
      perturbateurs: Array.from(perturbateurs),
    };

    const cleanedNotes = notes.trim();
    return cleanedNotes ? { ...baseEntry, notes: cleanedNotes } : baseEntry;
  };

  const handleSubmit = async (
    event: React.FormEvent,
    status: DailyEntry['status'],
  ) => {
    event.preventDefault();
    const entry = buildEntryPayload(status);
    if (status === 'draft') {
      await onSaveDraft?.(entry);
    } else {
      await onSave?.(entry);
    }
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => handleSubmit(event, 'complete')}
    >
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">
          Journal du jour
        </p>
        <h1 className="text-3xl font-semibold text-white">{dateLabel}</h1>
        <p className="text-white/70">
          Sélectionne les éléments qui te concernent aujourd’hui. Les curseurs
          non modifiés restent à 0 (aucun symptôme / aucune prise).
        </p>
      </div>

      <SectionCard
        id="symptomes"
        title="Symptômes (1-6)"
        description="Indique l’intensité ressentie pour chaque symptôme (0 = non ressenti)."
        highlight={initialSection === 'symptomes'}
      >
        <div className="space-y-4">
          {SYMPTOM_OPTIONS.map((option) => (
            <div
              key={option.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{option.label}</p>
              </div>
              <ElasticSlider
                min={0}
                max={6}
                step={1}
                value={symptoms[option.id]}
                onChange={(newValue: number) =>
                  setSymptoms((prev) => ({
                    ...prev,
                    [option.id]: Math.round(newValue),
                  }))
                }
                className="mt-4"
                trackColor="rgba(236,72,153,0.25)"
                rangeColor="linear-gradient(90deg, rgba(236,72,153,1) 0%, rgba(168,85,247,1) 100%)"
                labelFormatter={(val: number) => `${Math.round(val)}/6`}
                leftIcon={<span className="text-white/60 text-xs">0</span>}
                rightIcon={<span className="text-white/60 text-xs">6</span>}
              />
            </div>
          ))}
        </div>
        <p className="text-white/70 text-sm mt-4">
          Total du jour : <span className="text-white">{symptomTotal}/132</span>
        </p>
      </SectionCard>

      <SectionCard
        id="medicaments"
        title="Médicaments / Thérapies (1-10)"
        description="Valide ce que tu as pris / réalisé et ajuste l’intensité (observance)."
        highlight={initialSection === 'medicaments'}
      >
        <div className="space-y-4">
          {MEDICATION_OPTIONS.map((option) => (
            <div
              key={option.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{option.label}</p>
              </div>
              <ElasticSlider
                min={0}
                max={10}
                step={1}
                value={medications[option.id]}
                onChange={(newValue: number) =>
                  setMedications((prev) => ({
                    ...prev,
                    [option.id]: Math.round(newValue),
                  }))
                }
                className="mt-4"
                trackColor="rgba(59,130,246,0.25)"
                rangeColor="linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(14,165,233,1) 100%)"
                labelFormatter={(val: number) => `${Math.round(val)}/10`}
                leftIcon={<span className="text-white/60 text-xs">0</span>}
                rightIcon={<span className="text-white/60 text-xs">10</span>}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="activites"
        title="Activités & temps effectué"
        description="Note la durée (en minutes) pour chaque activité."
        highlight={initialSection === 'activites'}
      >
        <div className="space-y-4">
          {ACTIVITY_OPTIONS.map((option) => (
            <div
              key={option.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{option.label}</p>
                <span className="text-white/70 text-sm">
                  {activityMinutes[option.id]} min
                </span>
              </div>
              <OutlineInput
                type="number"
                min={0}
                placeholder="Durée en minutes"
                value={activityMinutes[option.id] ? String(activityMinutes[option.id]) : ''}
                onChange={(event) =>
                  setActivityMinutes((prev) => ({
                    ...prev,
                    [option.id]: Number(event.target.value),
                  }))
                }
                variant="white"
                size="md"
              />
            </div>
          ))}

          <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 space-y-3">
            <p className="text-white font-medium">Ajouter une activité perso</p>
            <div className="flex flex-col md:flex-row gap-3">
              <OutlineInput
                placeholder="Nom de l’activité"
                value={newActivityName}
                onChange={(event) => setNewActivityName(event.target.value)}
                variant="white"
                size="md"
                className="flex-1"
              />
              <OutlineInput
                placeholder="Durée (min)"
                type="number"
                value={newActivityDuration}
                onChange={(event) => setNewActivityDuration(event.target.value)}
                variant="white"
                size="md"
                className="flex-1"
              />
              <SimpleButton type="button" onClick={handleAddCustomActivity}>
                Ajouter
              </SimpleButton>
            </div>
            {customActivities.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {customActivities.map((activity) => (
                  <span
                    key={activity.id}
                    className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm"
                  >
                    {activity.label} · {activity.duration} min
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-white/70 text-sm mt-4">
          Total temps actif :{' '}
          <span className="text-white font-semibold">{activityTotal} min</span>
        </p>
      </SectionCard>

      <SectionCard
        id="perturbateurs"
        title="Éléments perturbateurs"
        description="Sélectionne les facteurs déclencheurs identifiés."
        highlight={initialSection === 'perturbateurs'}
      >
        <div className="flex flex-wrap gap-3">
          {PERTURBATEUR_OPTIONS.map((item) => {
            const isActive = perturbateurs.has(item);
            return (
              <button
                type="button"
                key={item}
                onClick={() => togglePerturbateur(item)}
                className={[
                  'px-4 py-2 rounded-full border transition-all duration-200 text-sm',
                  isActive
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-transparent border-white/30 text-white/70 hover:text-white',
                ].join(' ')}
              >
                {item}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div>
        <label className="text-white font-medium block mb-2">
          Notes complémentaires
        </label>
        <textarea
          className="w-full min-h-[120px] rounded-2xl bg-black/40 border border-white/10 text-white p-4 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          placeholder="Ex : bon début de journée mais fatigue après l’activité."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <SimpleButton
          type="button"
          size="lg"
          variant="outline"
          className="flex-1 bg-white text-gray-900 border-white/30"
          onClick={(event) => handleSubmit(event, 'draft')}
          disabled={isSubmitting}
        >
          Sauvegarder en brouillon
        </SimpleButton>
        <SimpleButton type="submit" size="lg" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer la journée'}
        </SimpleButton>
      </div>
    </form>
  );
}

