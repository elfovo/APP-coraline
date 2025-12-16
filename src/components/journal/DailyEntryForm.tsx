'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SimpleButton } from '@/components/buttons';
import OutlineInput from '@/components/inputs/OutlineInput';
import ElasticSlider from '@/components/ElasticSlider';
import type { DailyEntry, SymptomEntry, MedicationEntry } from '@/types/journal';
import { useAuth } from '@/contexts/AuthContext';
import {
  saveJournalPreferences,
  loadJournalPreferences,
  type JournalPreferences,
} from '@/lib/firestoreEntries';

export type SectionKey = 'symptomes' | 'medicaments' | 'activites' | 'activitesDouces' | 'perturbateurs';
type SliderGroup = 'symptomes' | 'medicaments';
type ActivityGroup = 'activites' | 'activitesDouces';

const SLIDER_VISIBILITY_STORAGE = 'journal-slider-visibility';
const ACTIVITY_VISIBILITY_STORAGE = 'journal-activity-visibility';
const PERTURBATEUR_VISIBILITY_STORAGE = 'journal-perturbateur-visibility';
const CUSTOM_ACTIVITIES_STORAGE = 'journal-custom-activities';
const CUSTOM_GENTLE_ACTIVITIES_STORAGE = 'journal-custom-gentle-activities';
const CUSTOM_PERTURBATEURS_STORAGE = 'journal-custom-perturbateurs';

interface DailyEntryFormProps {
  dateISO: string;
  dateLabel: string;
  initialEntry?: DailyEntry | null;
  initialSection?: SectionKey;
  isSubmitting?: boolean;
  onSave?: (entry: DailyEntry) => void | Promise<void>;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onGoPreviousDay?: () => void;
  onGoNextDay?: () => void;
}

const SYMPTOM_OPTIONS = [
  { id: 'cephalee', label: 'Céphalée' },
  { id: 'vision', label: 'Troubles visuels' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'humeur', label: 'Saut d’humeur' },
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

const DEFAULT_VISIBLE_SYMPTOMS = new Set<string>([
  'cephalee',
  'fatigue',
  'nausees',
  'vertiges',
  'photophobie',
  'phonophobie',
  'concentration',
  'brouillardMental',
  'equilibre',
]);

const MEDICATION_OPTIONS = [
  { id: 'analgesique', label: 'Analgésique' },
  { id: 'antiInflammatoire', label: 'Anti-inflammatoire' },
  { id: 'triptan', label: 'Triptan' },
  { id: 'antinauseeux', label: 'Antinauséeux' },
  { id: 'betaBloquant', label: 'Bêta-bloquant' },
  { id: 'antidepresseur', label: 'Antidépresseur' },
  { id: 'anticonvulsivant', label: 'Anticonvulsivant' },
  { id: 'antihistaminique', label: 'Antihistaminique' },
  { id: 'benzodiazepine', label: 'Benzodiazépine' },
  { id: 'magnesium', label: 'Magnésium' },
  { id: 'vitamineB2', label: 'Vitamine B2' },
  { id: 'coenzymeQ10', label: 'Coenzyme Q10' },
];

const DEFAULT_VISIBLE_MEDICATIONS = new Set<string>([
  'analgesique',
  'antiInflammatoire',
  'antinauseeux',
  'betaBloquant',
  'magnesium',
  'vitamineB2',
]);

const MEDICATION_INFO: Record<string, string> = {
  analgesique: 'Médicament qui soulage la douleur (ex: paracétamol, aspirine).',
  antiInflammatoire: 'Médicament qui réduit l\'inflammation et la douleur (ex: ibuprofène, naproxène).',
  triptan: 'Médicament spécifique pour traiter les migraines aiguës (ex: sumatriptan, rizatriptan).',
  antinauseeux: 'Médicament qui prévient ou traite les nausées et vomissements (ex: métoclopramide, dompéridone).',
  betaBloquant: 'Médicament utilisé en prévention des migraines (ex: propranolol, métoprolol).',
  antidepresseur: 'Médicament parfois prescrit en prévention des migraines chroniques (ex: amitriptyline).',
  anticonvulsivant: 'Médicament utilisé en prévention des migraines (ex: topiramate, valproate).',
  antihistaminique: 'Médicament utilisé pour les vertiges et troubles vestibulaires (ex: méclizine, dimenhydrinate).',
  benzodiazepine: 'Médicament anxiolytique parfois utilisé pour l\'anxiété liée aux vertiges (ex: diazépam, lorazépam).',
  magnesium: 'Supplément minéral qui peut aider à prévenir les migraines.',
  vitamineB2: 'Vitamine (riboflavine) utilisée en prévention des migraines.',
  coenzymeQ10: 'Antioxydant qui peut aider à réduire la fréquence des migraines.',
};

const ACTIVITY_OPTIONS = [
  { id: 'marche', label: 'Marche' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'lecture', label: 'Lecture' },
  { id: 'ecran', label: 'Ecrans < 30 min' },
  { id: 'natation', label: 'Natation' },
  { id: 'velo', label: 'Vélo' },
  { id: 'etirements', label: 'Étirements' },
  { id: 'jardinage', label: 'Jardinage' },
  { id: 'cuisine', label: 'Cuisine' },
  { id: 'bricolage', label: 'Bricolage' },
];

const DEFAULT_VISIBLE_ACTIVITIES = new Set<string>([
  'marche',
  'yoga',
  'lecture',
  'ecran',
]);

const GENTLE_ACTIVITY_OPTIONS = [
  { id: 'meditation', label: 'Méditation' },
  { id: 'relaxation', label: 'Relaxation musculaire' },
  { id: 'respiration', label: 'Respiration guidée' },
  { id: 'musique', label: 'Musique apaisante' },
  { id: 'bain', label: 'Bain chaud' },
  { id: 'massage', label: 'Auto-massage' },
  { id: 'aromatherapie', label: 'Aromathérapie' },
  { id: 'acupuncture', label: 'Acupuncture' },
  { id: 'osteopathie', label: 'Ostéopathie' },
  { id: 'physiotherapie', label: 'Physiothérapie' },
  { id: 'sophrologie', label: 'Sophrologie' },
];

const DEFAULT_VISIBLE_GENTLE_ACTIVITIES = new Set<string>([
  'meditation',
  'relaxation',
  'respiration',
  'musique',
]);

const PERTURBATEUR_OPTIONS = [
  'Lumière forte',
  'Bruit élevé',
  'Stress',
  'Manque de sommeil',
  'Sur-stimulation',
  'Odeurs fortes',
  'Changements météo',
  'Repas sauté',
  'Déshydratation',
  'Écrans prolongés',
  'Conduite longue',
  'Changements hormonaux',
  'Alcool',
  'Caféine excessive',
  'Exercice intense',
  'Chaleur excessive',
  'Froid intense',
  'Position prolongée',
];

const DEFAULT_VISIBLE_PERTURBATEURS = new Set<string>([
  'Lumière forte',
  'Bruit élevé',
  'Stress',
  'Manque de sommeil',
  'Sur-stimulation',
  'Odeurs fortes',
  'Changements météo',
  'Repas sauté',
  'Déshydratation',
  'Écrans prolongés',
]);

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
  actionButton,
  children,
}: {
  title: string;
  description: string;
  id: SectionKey;
  highlight?: boolean;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div
    id={id}
    className={[
      'bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md scroll-mt-28',
      highlight ? 'ring-2 ring-white/50' : '',
    ].join(' ')}
  >
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex flex-col gap-1 flex-1">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">{title}</p>
        <p className="text-white/80 text-sm">{description}</p>
      </div>
      {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
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
  onError,
  onSuccess,
  onGoPreviousDay,
  onGoNextDay,
}: DailyEntryFormProps) {
  const { user } = useAuth();
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
  const [gentleActivityMinutes, setGentleActivityMinutes] = useState<Record<string, number>>(
    () => buildBaseState(GENTLE_ACTIVITY_OPTIONS),
  );
  const [customGentleActivities, setCustomGentleActivities] = useState<
    { id: string; label: string; duration: number }[]
  >([]);
  const [newGentleActivityName, setNewGentleActivityName] = useState('');
  const [newGentleActivityDuration, setNewGentleActivityDuration] = useState('');
  const [perturbateurs, setPerturbateurs] = useState<Set<string>>(new Set());
  const [customPerturbateurs, setCustomPerturbateurs] = useState<string[]>([]);
  const [newPerturbateurName, setNewPerturbateurName] = useState('');
  const [notes, setNotes] = useState('');
  const [medicationInfoId, setMedicationInfoId] = useState<string | null>(null);
  const [editingSymptomes, setEditingSymptomes] = useState(false);
  const [editingMedicaments, setEditingMedicaments] = useState(false);
  const [hiddenSliders, setHiddenSliders] = useState<{
    symptomes: Set<string>;
    medicaments: Set<string>;
  }>(() => ({
    symptomes: new Set(
      SYMPTOM_OPTIONS.filter((option) => !DEFAULT_VISIBLE_SYMPTOMS.has(option.id)).map(
        (option) => option.id,
      ),
    ),
    medicaments: new Set(
      MEDICATION_OPTIONS.filter((option) => !DEFAULT_VISIBLE_MEDICATIONS.has(option.id)).map(
        (option) => option.id,
      ),
    ),
  }));
  const [editingActivites, setEditingActivites] = useState(false);
  const [editingActivitesDouces, setEditingActivitesDouces] = useState(false);
  const [hiddenActivities, setHiddenActivities] = useState<{
    activites: Set<string>;
    activitesDouces: Set<string>;
  }>(() => ({
    activites: new Set(
      ACTIVITY_OPTIONS.filter((option) => !DEFAULT_VISIBLE_ACTIVITIES.has(option.id)).map(
        (option) => option.id,
      ),
    ),
    activitesDouces: new Set(
      GENTLE_ACTIVITY_OPTIONS.filter((option) => !DEFAULT_VISIBLE_GENTLE_ACTIVITIES.has(option.id)).map(
        (option) => option.id,
      ),
    ),
  }));
  const [editingPerturbateurs, setEditingPerturbateurs] = useState(false);
  const [hiddenPerturbateurs, setHiddenPerturbateurs] = useState<Set<string>>(
    () => new Set(
      PERTURBATEUR_OPTIONS.filter((item) => !DEFAULT_VISIBLE_PERTURBATEURS.has(item)),
    ),
  );
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    if (!initialEntry) {
      setSymptoms(buildBaseState(SYMPTOM_OPTIONS));
      setMedications(buildBaseState(MEDICATION_OPTIONS));
      setActivityMinutes(buildBaseState(ACTIVITY_OPTIONS));
      setCustomActivities([]);
      setGentleActivityMinutes(buildBaseState(GENTLE_ACTIVITY_OPTIONS));
      setCustomGentleActivities([]);
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
        .filter((activity) => activity.custom && !activity.id.startsWith('gentle_'))
        .map((activity) => ({
          id: activity.id,
          label: activity.label,
          duration: activity.duration,
        })),
    );

    const gentleActivityState = buildBaseState(GENTLE_ACTIVITY_OPTIONS);
    initialEntry.activities
      .filter((activity) => !activity.custom && GENTLE_ACTIVITY_OPTIONS.some(opt => opt.id === activity.id))
      .forEach((activity) => {
        gentleActivityState[activity.id] = activity.duration;
      });
    setGentleActivityMinutes(gentleActivityState);

    setCustomGentleActivities(
      initialEntry.activities
        .filter((activity) => activity.custom && activity.id.startsWith('gentle_'))
        .map((activity) => ({
          id: activity.id.replace(/^gentle_/, ''),
          label: activity.label,
          duration: activity.duration,
        })),
    );

    const allPerturbateurs = initialEntry.perturbateurs || [];
    const standardPerturbateurs = allPerturbateurs.filter((p) =>
      PERTURBATEUR_OPTIONS.includes(p),
    );
    const customPerturbateursLoaded = allPerturbateurs.filter(
      (p) => !PERTURBATEUR_OPTIONS.includes(p),
    );
    // Les perturbateurs personnalisés qui étaient sélectionnés doivent aussi être dans le set
    setPerturbateurs(new Set([...standardPerturbateurs, ...customPerturbateursLoaded]));
    setCustomPerturbateurs(customPerturbateursLoaded);
    setNotes(initialEntry.notes ?? '');
  }, [initialEntry]);

  // Charger les préférences depuis Firestore (avec fallback localStorage)
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        // Si pas d'utilisateur, charger depuis localStorage uniquement
        if (typeof window !== 'undefined') {
          try {
            const rawSliders = window.localStorage.getItem(SLIDER_VISIBILITY_STORAGE);
            if (rawSliders) {
              const parsed = JSON.parse(rawSliders) as Partial<Record<SliderGroup, string[]>>;
              setHiddenSliders({
                symptomes: new Set(parsed.symptomes ?? []),
                medicaments: new Set(parsed.medicaments ?? []),
              });
            }
            
            const rawActivities = window.localStorage.getItem(ACTIVITY_VISIBILITY_STORAGE);
            if (rawActivities) {
              const parsed = JSON.parse(rawActivities) as Partial<Record<ActivityGroup, string[]>>;
              setHiddenActivities({
                activites: new Set(parsed.activites ?? []),
                activitesDouces: new Set(parsed.activitesDouces ?? []),
              });
            }
            
            const rawPerturbateurs = window.localStorage.getItem(PERTURBATEUR_VISIBILITY_STORAGE);
            if (rawPerturbateurs) {
              const parsed = JSON.parse(rawPerturbateurs) as string[];
              setHiddenPerturbateurs(new Set(parsed));
            }
            
            // Charger les éléments personnalisés depuis localStorage
            const rawCustomActivities = window.localStorage.getItem(CUSTOM_ACTIVITIES_STORAGE);
            if (rawCustomActivities) {
              const parsed = JSON.parse(rawCustomActivities) as Array<{ id: string; label: string; duration: number }>;
              setCustomActivities(parsed);
            }
            
            const rawCustomGentleActivities = window.localStorage.getItem(CUSTOM_GENTLE_ACTIVITIES_STORAGE);
            if (rawCustomGentleActivities) {
              const parsed = JSON.parse(rawCustomGentleActivities) as Array<{ id: string; label: string; duration: number }>;
              setCustomGentleActivities(parsed);
            }
            
            const rawCustomPerturbateurs = window.localStorage.getItem(CUSTOM_PERTURBATEURS_STORAGE);
            if (rawCustomPerturbateurs) {
              const parsed = JSON.parse(rawCustomPerturbateurs) as string[];
              setCustomPerturbateurs(parsed);
            }
          } catch (error) {
            console.warn('Impossible de charger les préférences locales', error);
          }
        }
        setPreferencesLoaded(true);
        return;
      }
      
      // Utilisateur connecté : charger depuis Firestore
      try {
        // Essayer de charger depuis Firestore
        const firestorePrefs = await loadJournalPreferences(user.uid);
        
        if (firestorePrefs) {
          // Utiliser les préférences Firestore
          setHiddenSliders({
            symptomes: new Set(firestorePrefs.hiddenSliders.symptomes),
            medicaments: new Set(firestorePrefs.hiddenSliders.medicaments),
          });
          setHiddenActivities({
            activites: new Set(firestorePrefs.hiddenActivities.activites),
            activitesDouces: new Set(firestorePrefs.hiddenActivities.activitesDouces),
          });
          setHiddenPerturbateurs(new Set(firestorePrefs.hiddenPerturbateurs));
          
          // Charger les éléments personnalisés
          if (firestorePrefs.customActivities) {
            setCustomActivities(firestorePrefs.customActivities);
          }
          if (firestorePrefs.customGentleActivities) {
            setCustomGentleActivities(firestorePrefs.customGentleActivities);
          }
          if (firestorePrefs.customPerturbateurs) {
            setCustomPerturbateurs(firestorePrefs.customPerturbateurs);
          }
          
          // Mettre à jour localStorage comme cache
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(SLIDER_VISIBILITY_STORAGE, JSON.stringify({
              symptomes: firestorePrefs.hiddenSliders.symptomes,
              medicaments: firestorePrefs.hiddenSliders.medicaments,
            }));
            window.localStorage.setItem(ACTIVITY_VISIBILITY_STORAGE, JSON.stringify({
              activites: firestorePrefs.hiddenActivities.activites,
              activitesDouces: firestorePrefs.hiddenActivities.activitesDouces,
            }));
            window.localStorage.setItem(PERTURBATEUR_VISIBILITY_STORAGE, JSON.stringify(firestorePrefs.hiddenPerturbateurs));
            if (firestorePrefs.customActivities) {
              window.localStorage.setItem(CUSTOM_ACTIVITIES_STORAGE, JSON.stringify(firestorePrefs.customActivities));
            }
            if (firestorePrefs.customGentleActivities) {
              window.localStorage.setItem(CUSTOM_GENTLE_ACTIVITIES_STORAGE, JSON.stringify(firestorePrefs.customGentleActivities));
            }
            if (firestorePrefs.customPerturbateurs) {
              window.localStorage.setItem(CUSTOM_PERTURBATEURS_STORAGE, JSON.stringify(firestorePrefs.customPerturbateurs));
            }
          }
        } else {
          // Fallback : charger depuis localStorage
          if (typeof window !== 'undefined') {
            try {
              const rawSliders = window.localStorage.getItem(SLIDER_VISIBILITY_STORAGE);
              if (rawSliders) {
                const parsed = JSON.parse(rawSliders) as Partial<Record<SliderGroup, string[]>>;
                setHiddenSliders({
                  symptomes: new Set(parsed.symptomes ?? []),
                  medicaments: new Set(parsed.medicaments ?? []),
                });
              }
              
              const rawActivities = window.localStorage.getItem(ACTIVITY_VISIBILITY_STORAGE);
              if (rawActivities) {
                const parsed = JSON.parse(rawActivities) as Partial<Record<ActivityGroup, string[]>>;
                setHiddenActivities({
                  activites: new Set(parsed.activites ?? []),
                  activitesDouces: new Set(parsed.activitesDouces ?? []),
                });
              }
              
              const rawPerturbateurs = window.localStorage.getItem(PERTURBATEUR_VISIBILITY_STORAGE);
              if (rawPerturbateurs) {
                const parsed = JSON.parse(rawPerturbateurs) as string[];
                setHiddenPerturbateurs(new Set(parsed));
              }
              
              // Charger les éléments personnalisés depuis localStorage
              const rawCustomActivities = window.localStorage.getItem(CUSTOM_ACTIVITIES_STORAGE);
              if (rawCustomActivities) {
                const parsed = JSON.parse(rawCustomActivities) as Array<{ id: string; label: string; duration: number }>;
                setCustomActivities(parsed);
              }
              
              const rawCustomGentleActivities = window.localStorage.getItem(CUSTOM_GENTLE_ACTIVITIES_STORAGE);
              if (rawCustomGentleActivities) {
                const parsed = JSON.parse(rawCustomGentleActivities) as Array<{ id: string; label: string; duration: number }>;
                setCustomGentleActivities(parsed);
              }
              
              const rawCustomPerturbateurs = window.localStorage.getItem(CUSTOM_PERTURBATEURS_STORAGE);
              if (rawCustomPerturbateurs) {
                const parsed = JSON.parse(rawCustomPerturbateurs) as string[];
                setCustomPerturbateurs(parsed);
              }
            } catch (error) {
              console.warn('Impossible de charger les préférences locales', error);
            }
          }
        }
      } catch (error) {
        console.warn('Impossible de charger les préférences depuis Firestore', error);
        // Fallback localStorage
        if (typeof window !== 'undefined') {
          try {
            const rawSliders = window.localStorage.getItem(SLIDER_VISIBILITY_STORAGE);
            if (rawSliders) {
              const parsed = JSON.parse(rawSliders) as Partial<Record<SliderGroup, string[]>>;
              setHiddenSliders({
                symptomes: new Set(parsed.symptomes ?? []),
                medicaments: new Set(parsed.medicaments ?? []),
              });
            }
            
            const rawActivities = window.localStorage.getItem(ACTIVITY_VISIBILITY_STORAGE);
            if (rawActivities) {
              const parsed = JSON.parse(rawActivities) as Partial<Record<ActivityGroup, string[]>>;
              setHiddenActivities({
                activites: new Set(parsed.activites ?? []),
                activitesDouces: new Set(parsed.activitesDouces ?? []),
              });
            }
            
            const rawPerturbateurs = window.localStorage.getItem(PERTURBATEUR_VISIBILITY_STORAGE);
            if (rawPerturbateurs) {
              const parsed = JSON.parse(rawPerturbateurs) as string[];
              setHiddenPerturbateurs(new Set(parsed));
            }
            
            // Charger les éléments personnalisés depuis localStorage
            const rawCustomActivities = window.localStorage.getItem(CUSTOM_ACTIVITIES_STORAGE);
            if (rawCustomActivities) {
              const parsed = JSON.parse(rawCustomActivities) as Array<{ id: string; label: string; duration: number }>;
              setCustomActivities(parsed);
            }
            
            const rawCustomGentleActivities = window.localStorage.getItem(CUSTOM_GENTLE_ACTIVITIES_STORAGE);
            if (rawCustomGentleActivities) {
              const parsed = JSON.parse(rawCustomGentleActivities) as Array<{ id: string; label: string; duration: number }>;
              setCustomGentleActivities(parsed);
            }
            
            const rawCustomPerturbateurs = window.localStorage.getItem(CUSTOM_PERTURBATEURS_STORAGE);
            if (rawCustomPerturbateurs) {
              const parsed = JSON.parse(rawCustomPerturbateurs) as string[];
              setCustomPerturbateurs(parsed);
            }
          } catch (e) {
            console.warn('Impossible de charger les préférences locales', e);
          }
        }
      }
      
      setPreferencesLoaded(true);
    };
    
    loadPreferences();
  }, [user]);

  // Sauvegarder les préférences dans Firestore et localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !preferencesLoaded) return;
    
    const savePreferences = async () => {
      const preferences: JournalPreferences = {
        hiddenSliders: {
          symptomes: Array.from(hiddenSliders.symptomes),
          medicaments: Array.from(hiddenSliders.medicaments),
        },
        hiddenActivities: {
          activites: Array.from(hiddenActivities.activites),
          activitesDouces: Array.from(hiddenActivities.activitesDouces),
        },
        hiddenPerturbateurs: Array.from(hiddenPerturbateurs),
        customActivities,
        customGentleActivities,
        customPerturbateurs,
      };
      
      // Toujours sauvegarder dans localStorage comme cache
      window.localStorage.setItem(SLIDER_VISIBILITY_STORAGE, JSON.stringify(preferences.hiddenSliders));
      window.localStorage.setItem(ACTIVITY_VISIBILITY_STORAGE, JSON.stringify(preferences.hiddenActivities));
      window.localStorage.setItem(PERTURBATEUR_VISIBILITY_STORAGE, JSON.stringify(preferences.hiddenPerturbateurs));
      window.localStorage.setItem(CUSTOM_ACTIVITIES_STORAGE, JSON.stringify(customActivities));
      window.localStorage.setItem(CUSTOM_GENTLE_ACTIVITIES_STORAGE, JSON.stringify(customGentleActivities));
      window.localStorage.setItem(CUSTOM_PERTURBATEURS_STORAGE, JSON.stringify(customPerturbateurs));
      
      // Sauvegarder dans Firestore si utilisateur connecté
      if (user) {
        try {
          await saveJournalPreferences(user.uid, preferences);
        } catch (error) {
          console.warn('Impossible de sauvegarder les préférences dans Firestore', error);
        }
      }
    };
    
    savePreferences();
  }, [user, preferencesLoaded, hiddenSliders, hiddenActivities, hiddenPerturbateurs, customActivities, customGentleActivities, customPerturbateurs]);

  const handleToggleEditingSymptomes = () => {
    const wasEditing = editingSymptomes;
    setEditingSymptomes((prev) => !prev);
    if (wasEditing) {
      onSuccess?.('Préférences des symptômes mises à jour');
    }
  };

  const handleToggleEditingMedicaments = () => {
    const wasEditing = editingMedicaments;
    setEditingMedicaments((prev) => !prev);
    if (wasEditing) {
      onSuccess?.('Préférences des médicaments mises à jour');
    }
  };

  const handleToggleEditingActivites = () => {
    const wasEditing = editingActivites;
    setEditingActivites((prev) => !prev);
    if (wasEditing) {
      onSuccess?.('Préférences des activités mises à jour');
    }
  };

  const handleToggleEditingActivitesDouces = () => {
    const wasEditing = editingActivitesDouces;
    setEditingActivitesDouces((prev) => !prev);
    if (wasEditing) {
      onSuccess?.('Préférences des activités douces mises à jour');
    }
  };

  const handleToggleEditingPerturbateurs = () => {
    const wasEditing = editingPerturbateurs;
    setEditingPerturbateurs((prev) => !prev);
    if (wasEditing) {
      onSuccess?.('Préférences des éléments perturbateurs mises à jour');
    }
  };

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

  const gentleActivityTotal = useMemo(() => {
    const base = Object.values(gentleActivityMinutes).reduce(
      (acc, value) => acc + value,
      0,
    );
    const custom = customGentleActivities.reduce((acc, item) => acc + item.duration, 0);
    return base + custom;
  }, [gentleActivityMinutes, customGentleActivities]);

  const handleAddCustomActivity = () => {
    const name = newActivityName.trim();
    if (!name) {
      onError?.('Veuillez saisir un nom pour l\'activité');
      return;
    }

    const duration = newActivityDuration.trim() === '' ? 0 : Number(newActivityDuration);
    if (Number.isNaN(duration) || duration < 0) {
      onError?.('La durée doit être un nombre valide (≥ 0)');
      return;
    }

    setCustomActivities((prev) => [
      ...prev,
      { id: `${Date.now()}-${name}`, label: name, duration },
    ]);
    setNewActivityName('');
    setNewActivityDuration('');
    onSuccess?.('Activité ajoutée avec succès');
  };

  const handleRemoveCustomActivity = (id: string) => {
    setCustomActivities((prev) => prev.filter((activity) => activity.id !== id));
    onSuccess?.('Activité supprimée');
  };

  const handleAddCustomGentleActivity = () => {
    const name = newGentleActivityName.trim();
    if (!name) {
      onError?.('Veuillez saisir un nom pour l\'activité');
      return;
    }

    const duration = newGentleActivityDuration.trim() === '' ? 0 : Number(newGentleActivityDuration);
    if (Number.isNaN(duration) || duration < 0) {
      onError?.('La durée doit être un nombre valide (≥ 0)');
      return;
    }

    setCustomGentleActivities((prev) => [
      ...prev,
      { id: `${Date.now()}-${name}`, label: name, duration },
    ]);
    setNewGentleActivityName('');
    setNewGentleActivityDuration('');
    onSuccess?.('Activité douce ajoutée avec succès');
  };

  const handleRemoveCustomGentleActivity = (id: string) => {
    setCustomGentleActivities((prev) => prev.filter((activity) => activity.id !== id));
    onSuccess?.('Activité douce supprimée');
  };

  const handleAddCustomPerturbateur = () => {
    const name = newPerturbateurName.trim();
    if (!name) {
      onError?.('Veuillez saisir un nom pour l\'élément perturbateur');
      return;
    }

    // Vérifier si le perturbateur existe déjà (standard ou personnalisé)
    if (PERTURBATEUR_OPTIONS.includes(name) || customPerturbateurs.includes(name)) {
      onError?.('Cet élément perturbateur existe déjà');
      return;
    }

    setCustomPerturbateurs((prev) => [...prev, name]);
    setNewPerturbateurName('');
    onSuccess?.('Élément perturbateur ajouté avec succès');
  };

  const handleRemoveCustomPerturbateur = (name: string) => {
    setCustomPerturbateurs((prev) => prev.filter((p) => p !== name));
    // Retirer aussi du set des perturbateurs sélectionnés si présent
    setPerturbateurs((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    onSuccess?.('Élément perturbateur supprimé');
  };

  const toggleSliderVisibility = (group: SliderGroup, id: string) => {
    setHiddenSliders((prev) => {
      const nextGroup = new Set(prev[group]);
      if (nextGroup.has(id)) {
        nextGroup.delete(id);
      } else {
        nextGroup.add(id);
      }
      return {
        ...prev,
        [group]: nextGroup,
      };
    });
  };

  const toggleActivityVisibility = (group: ActivityGroup, id: string) => {
    setHiddenActivities((prev) => {
      const nextGroup = new Set(prev[group]);
      if (nextGroup.has(id)) {
        nextGroup.delete(id);
      } else {
        nextGroup.add(id);
      }
      return {
        ...prev,
        [group]: nextGroup,
      };
    });
  };

  const togglePerturbateurVisibility = (item: string) => {
    setHiddenPerturbateurs((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
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

      const baseGentleActivities = GENTLE_ACTIVITY_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        duration: gentleActivityMinutes[option.id] ?? 0,
        custom: false as const,
      })).filter((item) => item.duration > 0);

      const customGentle = customGentleActivities.map((activity) => ({
        id: `gentle_${activity.id}`,
        label: activity.label,
        duration: activity.duration,
        custom: true as const,
      }));

      return [...baseActivities, ...custom, ...baseGentleActivities, ...customGentle];
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const entry = buildEntryPayload('complete');
    await onSave?.(entry);
  };

  return (
    <form
      className="space-y-8"
      onSubmit={handleSubmit}
    >
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Journal du
            </p>
            {(onGoPreviousDay || onGoNextDay) && (
              <div className="flex flex-wrap gap-2">
                {onGoPreviousDay && (
                  <SimpleButton
                    type="button"
                    size="sm"
                    className="bg-white/10 text-white border border-white/30 px-3 py-2 rounded-xl hover:bg-white/20"
                    onClick={onGoPreviousDay}
                    aria-label="Jour précédent"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </SimpleButton>
                )}
                {onGoNextDay && (
                  <SimpleButton
                    type="button"
                    size="sm"
                    className="bg-white/10 text-white border border-white/30 px-3 py-2 rounded-xl hover:bg-white/20"
                    onClick={onGoNextDay}
                    aria-label="Jour suivant"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </SimpleButton>
                )}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-semibold text-white">{dateLabel}</h1>
          <p className="text-white/70">
            Sélectionne les éléments qui te concernent aujourd’hui. Les curseurs
            non modifiés restent à 0 (aucun symptôme / aucune prise).
          </p>
        </div>
      </div>


      <SectionCard
        id="symptomes"
        title="Symptômes (1-6)"
        description="Indique l’intensité ressentie pour chaque symptôme (0 = non ressenti)."
        highlight={initialSection === 'symptomes'}
        actionButton={
          <button
            type="button"
            onClick={handleToggleEditingSymptomes}
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
              editingSymptomes
                ? 'bg-white/20 border-2 border-white/50 text-white'
                : 'bg-white/10 hover:bg-white/20 border border-white/30 text-white/70 hover:text-white',
            ].join(' ')}
            title={editingSymptomes ? 'Terminer le mode édition' : 'Mode édition des symptômes'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SYMPTOM_OPTIONS.map((option) => {
            const isHidden = hiddenSliders.symptomes.has(option.id);
            if (!editingSymptomes && isHidden) {
              return null;
            }
            return (
              <div
                key={option.id}
                className={[
                  'bg-black/30 border border-white/5 rounded-2xl p-4 transition-opacity duration-200',
                  editingSymptomes && isHidden ? 'opacity-40 border-dashed border-white/20' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-medium">{option.label}</p>
                  <div className="flex items-center gap-2">
                    {!editingSymptomes && (
                      <span className="text-white/70 text-sm font-medium">
                        {Math.round(symptoms[option.id] ?? 0)}/6
                      </span>
                    )}
                    {editingSymptomes && (
                      <button
                        type="button"
                        onClick={() => toggleSliderVisibility('symptomes', option.id)}
                        className={[
                          'px-2 py-1 rounded-full text-xs border transition-colors duration-200 flex items-center justify-center',
                          isHidden
                            ? 'border-emerald-300/60 text-emerald-200 hover:bg-emerald-300/10'
                            : 'border-white/30 text-white/80 hover:bg-white/10',
                        ].join(' ')}
                        title={isHidden ? 'Ré-afficher' : 'Masquer'}
                      >
                        {isHidden ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
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
                  className={`mt-4 ${editingSymptomes ? 'pointer-events-none opacity-60' : ''}`}
                  trackColor="rgba(236,72,153,0.25)"
                  rangeColor="linear-gradient(90deg, rgba(236,72,153,1) 0%, rgba(168,85,247,1) 100%)"
                  labelFormatter={() => ''}
                  leftIcon={<span className="text-white/60 text-xs">0</span> as React.ReactNode}
                  rightIcon={<span className="text-white/60 text-xs">6</span> as React.ReactNode}
                />
              </div>
            );
          })}
        </div>
        <p className="text-white/70 text-sm mt-4">
          Total du jour : <span className="text-white">{symptomTotal}/132</span>
        </p>
      </SectionCard>

      <SectionCard
        id="medicaments"
        title="Médicaments (1-10)"
        description="Valide ce que tu as pris et ajuste (0 = aucune prise)."
        highlight={initialSection === 'medicaments'}
        actionButton={
          <button
            type="button"
            onClick={handleToggleEditingMedicaments}
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
              editingMedicaments
                ? 'bg-white/20 border-2 border-white/50 text-white'
                : 'bg-white/10 hover:bg-white/20 border border-white/30 text-white/70 hover:text-white',
            ].join(' ')}
            title={editingMedicaments ? 'Terminer le mode édition' : 'Mode édition des médicaments'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MEDICATION_OPTIONS.map((option) => {
            const isHidden = hiddenSliders.medicaments.has(option.id);
            if (!editingMedicaments && isHidden) {
              return null;
            }
            return (
              <div
                key={option.id}
                className={[
                  'bg-black/30 border border-white/5 rounded-2xl p-4 transition-opacity duration-200',
                  editingMedicaments && isHidden ? 'opacity-40 border-dashed border-white/20' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-medium">{option.label}</p>
                  <div className="flex items-center gap-2">
                    {!editingMedicaments && (
                      <>
                        <span className="text-white/70 text-sm font-medium">
                          {Math.round(medications[option.id] ?? 0)}/10
                        </span>
                        <button
                          type="button"
                          onClick={() => setMedicationInfoId(option.id)}
                          className="flex-shrink-0 w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 text-[10px] font-semibold"
                          title="Information"
                        >
                          i
                        </button>
                      </>
                    )}
                    {editingMedicaments && (
                      <button
                        type="button"
                        onClick={() => toggleSliderVisibility('medicaments', option.id)}
                        className={[
                          'px-2 py-1 rounded-full text-xs border transition-colors duration-200 flex items-center justify-center',
                          isHidden
                            ? 'border-emerald-300/60 text-emerald-200 hover:bg-emerald-300/10'
                            : 'border-white/30 text-white/80 hover:bg-white/10',
                        ].join(' ')}
                        title={isHidden ? 'Ré-afficher' : 'Masquer'}
                      >
                        {isHidden ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
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
                  className={`mt-4 ${editingMedicaments ? 'pointer-events-none opacity-60' : ''}`}
                  trackColor="rgba(59,130,246,0.25)"
                  rangeColor="linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(14,165,233,1) 100%)"
                  labelFormatter={() => ''}
                  leftIcon={<span className="text-white/60 text-xs">0</span> as React.ReactNode}
                  rightIcon={<span className="text-white/60 text-xs">10</span> as React.ReactNode}
                />
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        id="activites"
        title="Activités & temps effectué"
        description="Note la durée (en minutes) pour chaque activité."
        highlight={initialSection === 'activites'}
        actionButton={
          <button
            type="button"
            onClick={handleToggleEditingActivites}
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
              editingActivites
                ? 'bg-white/20 border-2 border-white/50 text-white'
                : 'bg-white/10 hover:bg-white/20 border border-white/30 text-white/70 hover:text-white',
            ].join(' ')}
            title={editingActivites ? 'Terminer le mode édition' : 'Mode édition des activités'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACTIVITY_OPTIONS.map((option) => {
            const isHidden = hiddenActivities.activites.has(option.id);
            if (!editingActivites && isHidden) {
              return null;
            }
            return (
              <div
                key={option.id}
                className={[
                  'bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 transition-opacity duration-200',
                  editingActivites && isHidden ? 'opacity-40 border-dashed border-white/20' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium">{option.label}</p>
                  <div className="flex items-center gap-2">
                    {!editingActivites && (
                      <span className="text-white/70 text-sm">
                        {activityMinutes[option.id]} min
                      </span>
                    )}
                    {editingActivites && (
                      <button
                        type="button"
                        onClick={() => toggleActivityVisibility('activites', option.id)}
                        className={[
                          'px-2 py-1 rounded-full text-xs border transition-colors duration-200 flex items-center justify-center',
                          isHidden
                            ? 'border-emerald-300/60 text-emerald-200 hover:bg-emerald-300/10'
                            : 'border-white/30 text-white/80 hover:bg-white/10',
                        ].join(' ')}
                        title={isHidden ? 'Ré-afficher' : 'Masquer'}
                      >
                        {isHidden ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
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
                  disabled={editingActivites}
                  className={editingActivites ? 'opacity-60 pointer-events-none' : ''}
                />
              </div>
            );
          })}

          {customActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{activity.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-white/70 text-sm">
                    {activity.duration} min
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomActivity(activity.id)}
                    className="text-white/60 hover:text-white transition-colors"
                    title="Supprimer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
              <OutlineInput
                type="number"
                min={0}
                placeholder="Durée en minutes"
                value={activity.duration ? String(activity.duration) : ''}
                onChange={(event) => {
                  const newDuration = Number(event.target.value);
                  setCustomActivities((prev) =>
                    prev.map((a) =>
                      a.id === activity.id ? { ...a, duration: newDuration } : a,
                    ),
                  );
                }}
                variant="white"
                size="md"
              />
            </div>
          ))}

          {editingActivites && (
            <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 space-y-3 md:col-span-2">
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
            </div>
          )}
        </div>
        <p className="text-white/70 text-sm mt-4">
          Total temps actif :{' '}
          <span className="text-white font-semibold">{activityTotal} min</span>
        </p>
      </SectionCard>

      <SectionCard
        id="activitesDouces"
        title="Activités douces & thérapies"
        description="Note la durée (en minutes) pour chaque activité douce ou séance de thérapie."
        highlight={initialSection === 'activitesDouces'}
        actionButton={
          <button
            type="button"
            onClick={handleToggleEditingActivitesDouces}
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
              editingActivitesDouces
                ? 'bg-white/20 border-2 border-white/50 text-white'
                : 'bg-white/10 hover:bg-white/20 border border-white/30 text-white/70 hover:text-white',
            ].join(' ')}
            title={editingActivitesDouces ? 'Terminer le mode édition' : 'Mode édition des activités douces'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GENTLE_ACTIVITY_OPTIONS.map((option) => {
            const isHidden = hiddenActivities.activitesDouces.has(option.id);
            if (!editingActivitesDouces && isHidden) {
              return null;
            }
            return (
              <div
                key={option.id}
                className={[
                  'bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 transition-opacity duration-200',
                  editingActivitesDouces && isHidden ? 'opacity-40 border-dashed border-white/20' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium">{option.label}</p>
                  <div className="flex items-center gap-2">
                    {!editingActivitesDouces && (
                      <span className="text-white/70 text-sm">
                        {gentleActivityMinutes[option.id]} min
                      </span>
                    )}
                    {editingActivitesDouces && (
                      <button
                        type="button"
                        onClick={() => toggleActivityVisibility('activitesDouces', option.id)}
                        className={[
                          'px-2 py-1 rounded-full text-xs border transition-colors duration-200 flex items-center justify-center',
                          isHidden
                            ? 'border-emerald-300/60 text-emerald-200 hover:bg-emerald-300/10'
                            : 'border-white/30 text-white/80 hover:bg-white/10',
                        ].join(' ')}
                        title={isHidden ? 'Ré-afficher' : 'Masquer'}
                      >
                        {isHidden ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <OutlineInput
                  type="number"
                  min={0}
                  placeholder="Durée en minutes"
                  value={gentleActivityMinutes[option.id] ? String(gentleActivityMinutes[option.id]) : ''}
                  onChange={(event) =>
                    setGentleActivityMinutes((prev) => ({
                      ...prev,
                      [option.id]: Number(event.target.value),
                    }))
                  }
                  variant="white"
                  size="md"
                  disabled={editingActivitesDouces}
                  className={editingActivitesDouces ? 'opacity-60 pointer-events-none' : ''}
                />
              </div>
            );
          })}

          {customGentleActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">{activity.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-white/70 text-sm">
                    {activity.duration} min
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomGentleActivity(activity.id)}
                    className="text-white/60 hover:text-white transition-colors"
                    title="Supprimer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
              <OutlineInput
                type="number"
                min={0}
                placeholder="Durée en minutes"
                value={activity.duration ? String(activity.duration) : ''}
                onChange={(event) => {
                  const newDuration = Number(event.target.value);
                  setCustomGentleActivities((prev) =>
                    prev.map((a) =>
                      a.id === activity.id ? { ...a, duration: newDuration } : a,
                    ),
                  );
                }}
                variant="white"
                size="md"
              />
            </div>
          ))}

          {editingActivitesDouces && (
            <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 space-y-3 md:col-span-2">
              <p className="text-white font-medium">Ajouter une activité douce / thérapie perso</p>
            <div className="flex flex-col md:flex-row gap-3">
              <OutlineInput
                placeholder="Nom de l'activité"
                value={newGentleActivityName}
                onChange={(event) => setNewGentleActivityName(event.target.value)}
                variant="white"
                size="md"
                className="flex-1"
              />
              <OutlineInput
                placeholder="Durée (min)"
                type="number"
                value={newGentleActivityDuration}
                onChange={(event) => setNewGentleActivityDuration(event.target.value)}
                variant="white"
                size="md"
                className="flex-1"
              />
              <SimpleButton type="button" onClick={handleAddCustomGentleActivity}>
                Ajouter
              </SimpleButton>
            </div>
            </div>
          )}
        </div>
        <p className="text-white/70 text-sm mt-4">
          Total temps activités douces :{' '}
          <span className="text-white font-semibold">{gentleActivityTotal} min</span>
        </p>
      </SectionCard>

      <SectionCard
        id="perturbateurs"
        title="Éléments perturbateurs"
        description="Sélectionne les facteurs déclencheurs identifiés."
        highlight={initialSection === 'perturbateurs'}
        actionButton={
          <button
            type="button"
            onClick={handleToggleEditingPerturbateurs}
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
              editingPerturbateurs
                ? 'bg-white/20 border-2 border-white/50 text-white'
                : 'bg-white/10 hover:bg-white/20 border border-white/30 text-white/70 hover:text-white',
            ].join(' ')}
            title={editingPerturbateurs ? 'Terminer le mode édition' : 'Mode édition des perturbateurs'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        }
      >
        <div className="flex flex-wrap gap-3">
          {PERTURBATEUR_OPTIONS.map((item) => {
            const isHidden = hiddenPerturbateurs.has(item);
            if (!editingPerturbateurs && isHidden) {
              return null;
            }
            const isActive = perturbateurs.has(item);
            return (
              <div key={item} className="relative">
                <button
                  type="button"
                  onClick={() => !editingPerturbateurs && togglePerturbateur(item)}
                  disabled={editingPerturbateurs}
                  className={[
                    'px-4 py-2 rounded-full border transition-all duration-200 text-sm',
                    editingPerturbateurs && isHidden
                      ? 'opacity-40 border-dashed border-white/20 bg-transparent text-white/70'
                      : isActive
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-transparent border-white/30 text-white/70 hover:text-white',
                    editingPerturbateurs && !isHidden ? 'opacity-60 pointer-events-none' : '',
                  ].join(' ')}
                >
                  {item}
                </button>
                {editingPerturbateurs && (
                  <button
                    type="button"
                    onClick={() => togglePerturbateurVisibility(item)}
                    className={[
                      'absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs border transition-colors duration-200 bg-black/80 backdrop-blur-sm flex items-center justify-center',
                      isHidden
                        ? 'border-emerald-300/60 text-emerald-200 hover:bg-emerald-300/10'
                        : 'border-white/30 text-white/80 hover:bg-white/10',
                    ].join(' ')}
                    title={isHidden ? 'Ré-afficher' : 'Masquer'}
                  >
                    {isHidden ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })}
          {customPerturbateurs.map((item) => {
            const isActive = perturbateurs.has(item);
            return (
              <div key={item} className="relative">
                <button
                  type="button"
                  onClick={() => !editingPerturbateurs && togglePerturbateur(item)}
                  disabled={editingPerturbateurs}
                  className={[
                    'px-4 py-2 rounded-full border transition-all duration-200 text-sm',
                    isActive
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-transparent border-white/30 text-white/70 hover:text-white',
                    editingPerturbateurs ? 'opacity-60 pointer-events-none' : '',
                  ].join(' ')}
                >
                  {item}
                </button>
                {editingPerturbateurs && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomPerturbateur(item)}
                    className="absolute -top-2 -right-2 p-1 rounded-full border transition-colors duration-200 bg-black/80 backdrop-blur-sm border-red-300/60 text-red-200 hover:bg-red-300/10 flex items-center justify-center"
                    title="Supprimer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {editingPerturbateurs && (
          <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-4 space-y-3 mt-4">
            <p className="text-white font-medium">Ajouter un élément perturbateur perso</p>
            <div className="flex flex-col md:flex-row gap-3">
              <OutlineInput
                placeholder="Nom de l'élément perturbateur"
                value={newPerturbateurName}
                onChange={(event) => setNewPerturbateurName(event.target.value)}
                variant="white"
                size="md"
                className="flex-1"
              />
              <SimpleButton type="button" onClick={handleAddCustomPerturbateur}>
                Ajouter
              </SimpleButton>
            </div>
          </div>
        )}
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

      <div className="sticky bottom-6 z-20 flex justify-center md:justify-end pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg flex flex-col gap-4 bg-black/70 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <SimpleButton type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer la journée'}
          </SimpleButton>
        </div>
      </div>

      <AnimatePresence>
        {medicationInfoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setMedicationInfoId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 border border-white/20 rounded-3xl p-6 max-w-md w-full backdrop-blur-md"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  {MEDICATION_OPTIONS.find((m) => m.id === medicationInfoId)?.label}
                </h3>
                <button
                  type="button"
                  onClick={() => setMedicationInfoId(null)}
                  className="text-white/70 hover:text-white transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {MEDICATION_INFO[medicationInfoId] || 'Information non disponible.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

