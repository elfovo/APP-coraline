import type { DailyEntry, ActivityEntry } from '@/types/journal';

// Constantes pour la génération de seed
const SEED_SYMPTOMS = [
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

export function buildSeedEntry(targetDate: Date, daysAgo: number): DailyEntry {
  const dateISOSeed = targetDate.toISOString().split('T')[0];
  
  // Progression : amélioration au fil du temps (0 = aujourd'hui, 119 = il y a 120 jours)
  const totalDays = 120;
  const progressRatio = daysAgo / (totalDays - 1); // 0 = récent (mieux), 1 = ancien (pire)
  
  // Symptômes : beaucoup plus nombreux et intenses au début
  const baseSymptomCount = Math.max(2, Math.floor(13 * progressRatio + 2));
  const symptomIntensityBase = Math.max(1, Math.floor(5 * progressRatio + 1));
  
  const commonEarlySymptoms = ['cephalee', 'fatigue', 'nausees', 'vertiges', 'photophobie', 'phonophobie', 'concentration', 'brouillardMental', 'vision', 'humeur', 'anxiete', 'etourdissements', 'raideurNuque', 'douleurOculaire', 'confusion', 'irritabilite'];
  const commonMidSymptoms = ['cephalee', 'fatigue', 'vision', 'humeur', 'concentration', 'irritabilite', 'photophobie', 'phonophobie', 'brouillardMental'];
  const commonLateSymptoms = ['cephalee', 'fatigue', 'concentration', 'humeur'];
  
  const symptomPool = daysAgo > 80 ? commonEarlySymptoms : daysAgo > 40 ? commonMidSymptoms : commonLateSymptoms;
  const selectedSymptomIds = new Set<string>();
  
  const symptomCount = Math.min(baseSymptomCount, symptomPool.length);
  while (selectedSymptomIds.size < symptomCount) {
    selectedSymptomIds.add(symptomPool[randomInt(symptomPool.length - 1)]);
  }
  
  const symptoms = SEED_SYMPTOMS.filter(s => selectedSymptomIds.has(s.id)).map((symptom) => {
    const baseIntensity = symptomIntensityBase;
    const variation = randomInt(2) - 1;
    const intensity = Math.max(1, Math.min(6, baseIntensity + variation));
    return { id: symptom.id, label: symptom.label, intensity };
  });

  // Médicaments : très fréquents au début, puis diminution progressive
  const commonMeds = ['analgesique', 'antiInflammatoire', 'magnesium', 'vitamineB2', 'betaBloquant'];
  
  let maxMedsCount: number;
  let avgIntensityPerMed: number;
  let medicationUseRate: number;
  
  if (progressRatio > 0.75) {
    maxMedsCount = 4;
    avgIntensityPerMed = 3.5;
    medicationUseRate = 0.95;
  } else if (progressRatio > 0.5) {
    maxMedsCount = 3;
    avgIntensityPerMed = 2.5;
    medicationUseRate = 0.70;
  } else if (progressRatio > 0.3) {
    maxMedsCount = 2;
    avgIntensityPerMed = 2.0;
    medicationUseRate = 0.45;
  } else if (progressRatio > 0.15) {
    maxMedsCount = 2;
    avgIntensityPerMed = 1.5;
    medicationUseRate = 0.25;
  } else {
    maxMedsCount = 1;
    avgIntensityPerMed = 1.0;
    medicationUseRate = 0.10;
  }
  
  const selectedMeds = commonMeds.slice(0, Math.min(maxMedsCount, commonMeds.length));
  
  const medications = SEED_MEDICATIONS.filter(med => selectedMeds.includes(med.id))
    .filter(() => Math.random() < medicationUseRate)
    .map((med) => {
      let intensity: number;
      if (med.id === 'magnesium' || med.id === 'vitamineB2') {
        intensity = 1;
      } else {
        const variation = randomInt(1) - 0.5;
        intensity = Math.max(1, Math.min(4, Math.round(avgIntensityPerMed + variation)));
      }
      return {
        id: med.id,
        label: med.label,
        intensity,
      };
    });

  // Activités normales : augmentent avec le temps
  const activityRate = 0.3 + (1 - progressRatio) * 0.5;
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

  // Activités douces : très présentes au début, puis maintien
  const gentleActivityRate = 0.8 - (progressRatio * 0.3);
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
  const perturbateurRate = 0.5 - (progressRatio * 0.3);
  const perturbations = SEED_PERTURBATEURS.filter(() => Math.random() < perturbateurRate);

  // Notes complémentaires variées selon la période
  const notesTemplates = [
    ...(daysAgo > 80 ? [
      'Journée difficile, beaucoup de fatigue. Repos complet nécessaire.',
      'Symptômes intenses ce matin, amélioration en fin de journée après repos.',
      'Maux de tête persistants, évité les écrans toute la journée.',
      'Nausées importantes, difficulté à me concentrer. Prise de médicaments selon prescription.',
      'Vertiges au réveil, journée calme avec activités douces uniquement.',
      'Sensibilité à la lumière très marquée, porté des lunettes de soleil même à l\'intérieur.',
      'Journée éprouvante, beaucoup de repos. Suivi les recommandations médicales.',
      'Symptômes multiples aujourd\'hui, priorité au repos et à l\'hydratation.',
      'Difficulté à supporter le bruit et la lumière, journée passée dans le calme.',
      'Fatigue extrême, besoin de pauses fréquentes. Médicaments pris régulièrement.',
    ] : []),
    ...(daysAgo > 40 && daysAgo <= 80 ? [
      'Meilleure journée, moins de symptômes qu\'hier. Réussi à faire une petite marche.',
      'Fatigue modérée, mais capable de lire 20 minutes sans problème.',
      'Quelques maux de tête légers, mais gérables. Activités douces aidantes.',
      'Journée stable, pas de pics de symptômes. Continue les exercices de respiration.',
      'Légère amélioration de la concentration, réussi à travailler 30 minutes.',
      'Moins de sensibilité au bruit qu\'avant, progrès encourageant.',
      'Journée correcte, symptômes présents mais moins intenses qu\'au début.',
      'Réussi à sortir un peu, pas de régression. Continue la prudence.',
      'Amélioration progressive, capable de faire plus d\'activités douces.',
      'Symptômes gérables, bonne journée dans l\'ensemble.',
    ] : []),
    ...(daysAgo <= 40 ? [
      'Très bonne journée, symptômes minimes. Activités normales possibles.',
      'Presque plus de maux de tête, récupération en cours. Continue les bonnes habitudes.',
      'Concentration beaucoup mieux, réussi à travailler 1h sans problème.',
      'Journée presque normale, juste un peu de fatigue en fin d\'après-midi.',
      'Excellent progrès, se sent presque comme avant. Garde le rythme doux.',
      'Symptômes très légers, récupération presque complète. Continue la prudence.',
      'Journée agréable, très peu de symptômes. Retour progressif à la normale.',
      'Se sent bien aujourd\'hui, activités normales possibles avec modération.',
      'Récupération continue, journée positive. Maintien des bonnes pratiques.',
      'Presque plus de symptômes, excellente progression depuis le début.',
    ] : []),
  ];

  const noteSeed = notesTemplates.length > 0 && Math.random() < 0.80
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
}



