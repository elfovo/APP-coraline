'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import DailyEntryForm, { SectionKey } from '@/components/journal/DailyEntryForm';
import { fetchDailyEntry, saveDailyEntry, deleteAllEntries } from '@/lib/firestoreEntries';
import type { DailyEntry, MedicationEntry, ActivityEntry } from '@/types/journal';
import { SimpleButton } from '@/components/buttons';
import { getDbInstance } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const SEED_SYMPTOMS = [
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
] as const;

const SEED_MEDICATIONS = [
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
] as const;

const SEED_ACTIVITIES = [
  { id: 'marche', label: 'Marche' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'lecture', label: 'Lecture' },
  { id: 'ecran', label: 'Ecrans < 30 min' },
  { id: 'natation', label: 'Natation' },
  { id: 'etirements', label: 'Étirements' },
] as const;

const SEED_GENTLE_ACTIVITIES = [
  { id: 'meditation', label: 'Méditation' },
  { id: 'relaxation', label: 'Relaxation musculaire' },
  { id: 'respiration', label: 'Respiration guidée' },
  { id: 'musique', label: 'Musique apaisante' },
  { id: 'bain', label: 'Bain chaud' },
  { id: 'massage', label: 'Auto-massage' },
] as const;

const SEED_PERTURBATEURS = [
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
  const [clearLoading, setClearLoading] = useState(false);

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

  const shiftDate = (isoDate: string, deltaDays: number) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + deltaDays);
    return date.toISOString().split('T')[0];
  };

  const navigateToDate = (targetISO: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', targetISO);
    const query = params.toString();
    router.push(query ? `/journal?${query}` : '/journal');
  };

  const goToPreviousDay = () => {
    navigateToDate(shiftDate(dateISO, -1));
  };

  const goToNextDay = () => {
    navigateToDate(shiftDate(dateISO, 1));
  };
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

  const buildSeedEntry = (targetDate: Date, daysAgo: number): DailyEntry => {
    const dateISOSeed = targetDate.toISOString().split('T')[0];
    
    // Progression : amélioration au fil du temps (0 = aujourd'hui, 119 = il y a 120 jours)
    // Les premiers jours sont les pires, puis amélioration progressive
    const totalDays = 120;
    const progressRatio = daysAgo / (totalDays - 1); // 0 = récent (mieux), 1 = ancien (pire, juste après l'accident)
    const improvementFactor = 1 - progressRatio * 0.7; // Amélioration de 70% sur 4 mois
    
    // Symptômes : beaucoup plus nombreux et intenses au début (juste après l'accident), diminuent avec le temps
    // Au début (progressRatio proche de 1) : 12-15 symptômes, intensité 4-6
    // À la fin (progressRatio proche de 0) : 2-4 symptômes, intensité 1-3
    const baseSymptomCount = Math.max(2, Math.floor(13 * progressRatio + 2));
    const symptomIntensityBase = Math.max(1, Math.floor(5 * progressRatio + 1));
    
    // Sélectionner des symptômes variés selon la période
    // Plus de symptômes au début (juste après l'accident)
    const commonEarlySymptoms = ['cephalee', 'fatigue', 'nausees', 'vertiges', 'photophobie', 'phonophobie', 'concentration', 'brouillardMental', 'vision', 'humeur', 'anxiete', 'etourdissements', 'raideurNuque', 'douleurOculaire', 'confusion', 'irritabilite'];
    const commonMidSymptoms = ['cephalee', 'fatigue', 'vision', 'humeur', 'concentration', 'irritabilite', 'photophobie', 'phonophobie', 'brouillardMental'];
    const commonLateSymptoms = ['cephalee', 'fatigue', 'concentration', 'humeur'];
    
    const symptomPool = daysAgo > 80 ? commonEarlySymptoms : daysAgo > 40 ? commonMidSymptoms : commonLateSymptoms;
    const selectedSymptomIds = new Set<string>();
    
    // Sélectionner un nombre variable de symptômes
    const symptomCount = Math.min(baseSymptomCount, symptomPool.length);
    while (selectedSymptomIds.size < symptomCount) {
      selectedSymptomIds.add(symptomPool[randomInt(symptomPool.length - 1)]);
    }
    
    const symptoms = SEED_SYMPTOMS.filter(s => selectedSymptomIds.has(s.id)).map((symptom) => {
      const baseIntensity = symptomIntensityBase;
      const variation = randomInt(2) - 1; // -1, 0, ou +1
      const intensity = Math.max(1, Math.min(6, baseIntensity + variation));
      return { id: symptom.id, label: symptom.label, intensity };
    });

    // Médicaments : très fréquents au début (juste après l'accident), puis diminution progressive
    // Au début : 80-90% de chance d'avoir des médicaments, intensité élevée
    // À la fin : 20-30% de chance, intensité faible
    const medicationUseRate = 0.85 - (progressRatio * 0.6); // 85% au début, 25% à la fin
    const commonMeds = ['analgesique', 'antiInflammatoire', 'magnesium', 'vitamineB2', 'betaBloquant'];
    const medications = SEED_MEDICATIONS.filter(med => commonMeds.includes(med.id))
      .filter(() => Math.random() < medicationUseRate)
      .map((med) => {
        // Intensité plus élevée au début, diminue avec le temps
        let intensity;
        if (med.id === 'magnesium' || med.id === 'vitamineB2') {
          intensity = 1; // Suppléments toujours à 1
        } else {
          // Autres médicaments : intensité 2-3 au début, 1-2 à la fin
          const baseIntensity = progressRatio > 0.5 ? 3 : progressRatio > 0.2 ? 2 : 1;
          intensity = Math.max(1, baseIntensity + randomInt(1) - 1);
        }
        return {
          id: med.id,
          label: med.label,
          intensity,
        };
      });

    // Activités normales : augmentent avec le temps (signe de récupération)
    const activityRate = 0.3 + (1 - progressRatio) * 0.5; // 30% au début, 80% à la fin
    const activities = SEED_ACTIVITIES.filter(() => Math.random() < activityRate)
      .map((activity) => {
        const baseDuration = daysAgo > 60 ? 15 : daysAgo > 30 ? 25 : 35;
        const duration = baseDuration + randomInt(20);
        return {
          id: activity.id,
          label: activity.label,
          duration,
          custom: false as const,
        };
      });

    // Activités douces : très présentes au début (récupération), puis maintien
    const gentleActivityRate = 0.8 - (progressRatio * 0.3); // 80% au début, 50% à la fin
    const gentleActivities = SEED_GENTLE_ACTIVITIES.filter(() => Math.random() < gentleActivityRate)
      .map((activity) => {
        const baseDuration = daysAgo > 60 ? 20 : daysAgo > 30 ? 15 : 10;
        const duration = baseDuration + randomInt(15);
        return {
          id: activity.id,
          label: activity.label,
          duration,
          custom: false as const,
        } as ActivityEntry;
      });

    // Perturbateurs : plus fréquents au début, diminuent avec le temps
    const perturbateurRate = 0.5 - (progressRatio * 0.3); // 50% au début, 20% à la fin
    const perturbations = SEED_PERTURBATEURS.filter(() => Math.random() < perturbateurRate);

    // Notes complémentaires variées et pertinentes selon la période
    const notesTemplates = [
      // Notes du début (période difficile)
      ...(daysAgo > 60 ? [
        'Journée difficile, beaucoup de fatigue. Repos complet nécessaire.',
        'Symptômes intenses ce matin, amélioration en fin de journée après repos.',
        'Maux de tête persistants, évité les écrans toute la journée.',
        'Nausées importantes, difficulté à me concentrer. Prise de médicaments selon prescription.',
        'Vertiges au réveil, journée calme avec activités douces uniquement.',
        'Sensibilité à la lumière très marquée, porté des lunettes de soleil même à l\'intérieur.',
      ] : []),
      // Notes du milieu (amélioration progressive)
      ...(daysAgo > 30 && daysAgo <= 60 ? [
        'Meilleure journée, moins de symptômes qu\'hier. Réussi à faire une petite marche.',
        'Fatigue modérée, mais capable de lire 20 minutes sans problème.',
        'Quelques maux de tête légers, mais gérables. Activités douces aidantes.',
        'Journée stable, pas de pics de symptômes. Continue les exercices de respiration.',
        'Légère amélioration de la concentration, réussi à travailler 30 minutes.',
        'Moins de sensibilité au bruit qu\'avant, progrès encourageant.',
      ] : []),
      // Notes récentes (bien mieux)
      ...(daysAgo <= 30 ? [
        'Très bonne journée, symptômes minimes. Activités normales possibles.',
        'Presque plus de maux de tête, récupération en cours. Continue les bonnes habitudes.',
        'Concentration beaucoup mieux, réussi à travailler 1h sans problème.',
        'Journée presque normale, juste un peu de fatigue en fin d\'après-midi.',
        'Excellent progrès, se sent presque comme avant. Garde le rythme doux.',
        'Symptômes très légers, récupération presque complète. Continue la prudence.',
      ] : []),
    ];

    const noteSeed = notesTemplates.length > 0 && Math.random() < 0.65
      ? notesTemplates[randomInt(notesTemplates.length - 1)]
      : '';

    const entry: DailyEntry = {
      dateISO: dateISOSeed,
      dayLabel: seedDateFormatter.format(targetDate),
      status: 'complete',
      symptoms,
      medications,
      activities: [
        ...activities.map(a => ({ ...a, custom: false as const }) as ActivityEntry),
        ...gentleActivities.map(a => ({ ...a, custom: false as const }) as ActivityEntry),
      ],
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
      
      // Créer les entrées pour 120 jours
      let oldestDateISO = '';
      for (let i = 0; i < 120; i++) {
        const target = new Date(today);
        target.setDate(today.getDate() - i);
        const entry = buildSeedEntry(target, i);
        await saveDailyEntry(user.uid, entry);
        if (entry.dateISO === dateISO) {
          setInitialEntry(entry);
        }
        // Garder la date la plus ancienne (dernière itération)
        if (i === 119) {
          oldestDateISO = entry.dateISO;
        }
      }
      
      // Sauvegarder la date d'accident dans Firestore (date de la première donnée)
      const db = getDbInstance();
      await setDoc(doc(db, 'users', user.uid), {
        accidentDates: [oldestDateISO],
      }, { merge: true });
      
      setSubmitMessage('4 mois de données de démonstration ajoutées avec progression réaliste.');
    } catch (error) {
      console.error(error);
      setSubmitError('Impossible de générer les données démo.');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleClearEntries = async () => {
    if (!user || clearLoading) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Cela supprimera définitivement toutes tes entrées. Continuer ?',
      );
      if (!confirmed) {
        return;
      }
    }
    setClearLoading(true);
    try {
      await deleteAllEntries(user.uid);
      setInitialEntry(null);
      setSubmitMessage('Toutes les données ont été supprimées.');
    } catch (error) {
      console.error(error);
      setSubmitError('Impossible de supprimer les données.');
    } finally {
      setClearLoading(false);
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
      <div className="container mx-auto px-4 pt-6 flex flex-wrap gap-3 justify-end">
        <SimpleButton
          size="sm"
          className="bg-white/90 text-gray-900 border-white/60 px-4 py-2 rounded-xl"
          onClick={handleSeedEntries}
          disabled={seedLoading || clearLoading}
        >
          {seedLoading ? 'Génération…' : 'Créer des données de démo'}
        </SimpleButton>
        <SimpleButton
          size="sm"
          variant="outline"
          className="text-white border-red-300/60 hover:bg-red-500/10 px-4 py-2 rounded-xl"
          onClick={handleClearEntries}
          disabled={clearLoading || seedLoading}
        >
          {clearLoading ? 'Suppression…' : 'Supprimer toutes les données'}
        </SimpleButton>
      </div>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <DailyEntryForm
          dateISO={dateISO}
          dateLabel={dateLabel}
          initialEntry={initialEntry}
          initialSection={initialSection ?? undefined}
          onSave={handleSaveEntry}
          isSubmitting={isSubmitting}
          onError={setSubmitError}
          onSuccess={setSubmitMessage}
          onGoPreviousDay={goToPreviousDay}
          onGoNextDay={goToNextDay}
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


