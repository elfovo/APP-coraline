'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { BackButton, NextButton } from '@/components/buttons';
import SelectableCard from '@/components/onboarding/SelectableCard';
import DateInput from '@/components/onboarding/DateInput';
import { useAuth } from '@/contexts/AuthContext';
import { getDbInstance } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { saveJournalPreferences, type JournalPreferences } from '@/lib/firestoreEntries';

// Listes complètes des options
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

// Perturbateurs : on NE les configure PAS via l'onboarding
// On garde les mêmes defaults que `DailyEntryForm`.
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
  'Repas sauté',
  'Déshydratation',
  'Écrans prolongés',
]);

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Données de l'onboarding
  const [accidentDate, setAccidentDate] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [selectedMedications, setSelectedMedications] = useState<Set<string>>(new Set());
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [selectedGentleActivities, setSelectedGentleActivities] = useState<Set<string>>(new Set());
  const [medicationInfoId, setMedicationInfoId] = useState<string | null>(null);

  // Gérer le montage côté client uniquement
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Rediriger si pas connecté (après le chargement et le montage)
    if (isMounted && !authLoading && !user) {
      router.push('/register');
      return;
    }

    // Vérifier si l'onboarding doit être affiché
    if (isMounted && !authLoading && user) {
      const checkOnboardingStatus = async () => {
        try {
          // Ne pas afficher l'onboarding pour les comptes anonymes
          if (user.isAnonymous) {
            router.push('/');
            return;
          }

          // Vérifier si c'est une nouvelle inscription
          const isNewAccount = typeof window !== 'undefined' && sessionStorage.getItem('newAccount') === 'true';
          
          // Si ce n'est pas une nouvelle inscription, vérifier si l'onboarding a déjà été complété
          if (!isNewAccount) {
            const { loadJournalPreferences } = await import('@/lib/firestoreEntries');
            const preferences = await loadJournalPreferences(user.uid);
            // Si les préférences existent, l'onboarding a été complété
            if (preferences) {
              router.push('/');
              return;
            }
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'onboarding:', error);
          // En cas d'erreur, on laisse l'utilisateur continuer l'onboarding
        }
      };
      checkOnboardingStatus();
    }
  }, [user, authLoading, router, isMounted]);

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Dernière étape : sauvegarder et rediriger
      await handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const db = getDbInstance();

      // 1. Sauvegarder la date de l'accident
      if (accidentDate) {
        await setDoc(doc(db, 'users', user.uid), {
          accidentDates: [accidentDate],
        }, { merge: true });
      }

      // 2. Sauvegarder les préférences du journal
      // Les éléments sélectionnés seront visibles, les autres seront cachés
      const allSymptoms = SYMPTOM_OPTIONS.map(s => s.id);
      const allMedications = MEDICATION_OPTIONS.map(m => m.id);
      const allActivities = ACTIVITY_OPTIONS.map(a => a.id);
      const allGentleActivities = GENTLE_ACTIVITY_OPTIONS.map(a => a.id);

      const hiddenSymptoms = allSymptoms.filter(id => !selectedSymptoms.has(id));
      const hiddenMedications = allMedications.filter(id => !selectedMedications.has(id));
      const hiddenActivities = allActivities.filter(id => !selectedActivities.has(id));
      const hiddenGentleActivities = allGentleActivities.filter(id => !selectedGentleActivities.has(id));

      const preferences: JournalPreferences = {
        hiddenSliders: {
          symptomes: hiddenSymptoms,
          medicaments: hiddenMedications,
        },
        hiddenActivities: {
          activites: hiddenActivities,
          activitesDouces: hiddenGentleActivities,
        },
        // Ne pas toucher aux perturbateurs : on conserve strictement le comportement par défaut du Journal
        // (c'est-à-dire : cacher ceux qui ne sont pas dans DEFAULT_VISIBLE_PERTURBATEURS)
        hiddenPerturbateurs: PERTURBATEUR_OPTIONS.filter((p) => !DEFAULT_VISIBLE_PERTURBATEURS.has(p)),
        customActivities: [],
        customGentleActivities: [],
        customPerturbateurs: [],
      };

      await saveJournalPreferences(user.uid, preferences);

      // Supprimer le flag de nouvelle inscription
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('newAccount');
      }

      // Rediriger vers la page d'accueil
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (id: string, type: 'symptom' | 'medication' | 'activity' | 'gentleActivity') => {
    switch (type) {
      case 'symptom':
        setSelectedSymptoms(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        break;
      case 'medication':
        setSelectedMedications(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        break;
      case 'activity':
        setSelectedActivities(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        break;
      case 'gentleActivity':
        setSelectedGentleActivities(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        break;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return accidentDate !== '';
      case 2:
        return selectedSymptoms.size > 0;
      case 3:
        return selectedMedications.size > 0;
      case 4:
        return selectedActivities.size > 0;
      case 5:
        return selectedGentleActivities.size > 0;
      default:
        return false;
    }
  };

  // Fonction pour organiser les options en lignes avec alternance pair/impair
  const organizeInRows = <T,>(items: T[], itemsPerRowEven: number = 2, itemsPerRowOdd: number = 3): { rows: T[][], globalIndexMap: Map<T, number> } => {
    const rows: T[][] = [];
    const globalIndexMap = new Map<T, number>();
    let currentIndex = 0;
    let rowIndex = 0;

    while (currentIndex < items.length) {
      const isEvenRow = rowIndex % 2 === 0;
      const itemsInThisRow = isEvenRow ? itemsPerRowEven : itemsPerRowOdd;
      const row = items.slice(currentIndex, currentIndex + itemsInThisRow);
      if (row.length > 0) {
        rows.push(row);
        row.forEach((item, itemIndex) => {
          globalIndexMap.set(item, currentIndex + itemIndex);
        });
        currentIndex += itemsInThisRow;
      }
      rowIndex++;
    }

    return { rows, globalIndexMap };
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-8 lg:gap-12 w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="w-full max-w-3xl text-center space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Date de l&apos;accident
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Quand avez-vous eu votre commotion cérébrale ?
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="w-full max-w-2xl"
            >
              <DateInput
                value={accidentDate}
                onChange={setAccidentDate}
                max={new Date().toISOString().split('T')[0]}
                delay={0.4}
              />
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-8 lg:gap-12 w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="w-full max-w-3xl text-center space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Quels sont vos symptômes ?
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Sélectionnez tous les symptômes que vous ressentez (vous pourrez en ajouter d&apos;autres plus tard)
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="w-full max-w-4xl gap-3 flex flex-col"
            >
              {(() => {
                const { rows, globalIndexMap } = organizeInRows(SYMPTOM_OPTIONS);
                return rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-3 justify-center">
                    {row.map((symptom) => (
                      <SelectableCard
                        key={symptom.id}
                        title={symptom.label}
                        onClick={() => toggleSelection(symptom.id, 'symptom')}
                        isSelected={selectedSymptoms.has(symptom.id)}
                        delay={0.1 * (globalIndexMap.get(symptom) || 0)}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        }
                      />
                    ))}
                  </div>
                ));
              })()}
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-8 lg:gap-12 w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="w-full max-w-3xl text-center space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Quels médicaments prenez-vous ?
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Sélectionnez tous les médicaments que vous prenez pour votre commotion (vous pourrez en ajouter d&apos;autres plus tard)
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="w-full max-w-4xl gap-3 flex flex-col"
            >
              {(() => {
                const { rows, globalIndexMap } = organizeInRows(MEDICATION_OPTIONS);
                return rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-3 justify-center">
                    {row.map((medication) => (
                      <SelectableCard
                        key={medication.id}
                        title={medication.label}
                        onClick={() => toggleSelection(medication.id, 'medication')}
                        isSelected={selectedMedications.has(medication.id)}
                        delay={0.1 * (globalIndexMap.get(medication) || 0)}
                        showInfoButton={true}
                        onInfoClick={() => setMedicationInfoId(medication.id)}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        }
                      />
                    ))}
                  </div>
                ));
              })()}
            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-8 lg:gap-12 w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="w-full max-w-3xl text-center space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Quelles activités pratiquez-vous ?
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Sélectionnez toutes les activités que vous pratiquez (vous pourrez en ajouter d&apos;autres plus tard)
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="w-full max-w-4xl gap-3 flex flex-col"
            >
              {(() => {
                const { rows, globalIndexMap } = organizeInRows(ACTIVITY_OPTIONS);
                return rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-3 justify-center">
                    {row.map((activity) => (
                      <SelectableCard
                        key={activity.id}
                        title={activity.label}
                        onClick={() => toggleSelection(activity.id, 'activity')}
                        isSelected={selectedActivities.has(activity.id)}
                        delay={0.1 * (globalIndexMap.get(activity) || 0)}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        }
                      />
                    ))}
                  </div>
                ));
              })()}
            </motion.div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-8 lg:gap-12 w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="w-full max-w-3xl text-center space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Activités douces et thérapies
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Sélectionnez toutes les activités douces et thérapies que vous pratiquez (vous pourrez en ajouter d&apos;autres plus tard)
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              className="w-full max-w-4xl gap-3 flex flex-col"
            >
              {(() => {
                const { rows, globalIndexMap } = organizeInRows(GENTLE_ACTIVITY_OPTIONS);
                return rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-3 justify-center">
                    {row.map((activity) => (
                      <SelectableCard
                        key={activity.id}
                        title={activity.label}
                        onClick={() => toggleSelection(activity.id, 'gentleActivity')}
                        isSelected={selectedGentleActivities.has(activity.id)}
                        delay={0.1 * (globalIndexMap.get(activity) || 0)}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        }
                      />
                    ))}
                  </div>
                ));
              })()}
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Afficher un loader pendant le chargement initial ou l'authentification
  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Si pas d'utilisateur après le chargement, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent">
      <motion.div
        className="relative z-10 w-full max-w-6xl px-4 py-8 pb-24"
      >
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </motion.div>

      {/* Modal d'information pour les médicaments */}
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

      {/* Barre de navigation fixe en bas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-xl border-t border-white/10"
      >
        <div className="relative w-full max-w-6xl mx-auto">
          {/* Conteneur flex pour centrer les boutons */}
          <div className="flex items-center justify-center gap-24">
            {/* Bouton Retour */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <BackButton onClick={handleBack} disabled={currentStep === 1} />
            </motion.div>

            {/* Indicateur de progression */}
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{
                    scale: currentStep === index + 1 ? 1 : 0.8,
                    opacity: currentStep === index + 1 ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-2 h-2 rounded-full ${
                    currentStep === index + 1
                      ? 'bg-white'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Bouton Suivant */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <NextButton
                onClick={handleNext}
                disabled={!canProceed() || isSaving}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
