export interface Resource {
  title: string;
  description: string;
  duration?: string;
  type: 'checklist' | 'audio' | 'article' | 'video';
  actions: Array<{
    label: string;
    href: string;
  }>;
}

export interface QuickTip {
  title: string;
  description: string;
}

export const PATIENT_RESOURCES: Resource[] = [
  {
    title: 'Routine matin / soir',
    description:
      'Checklist guidée pour structurer la journée après une commotion (hydratation, lumière douce, micro-pauses).',
    duration: '10 min',
    type: 'checklist',
    actions: [
      {
        label: 'Ouvrir la checklist',
        href: '#',
      },
    ],
  },
  {
    title: 'Audio respiration box breathing',
    description:
      'Séance audio de 5 minutes pour calmer le système nerveux avant une activité cognitive.',
    duration: '5 min',
    type: 'audio',
    actions: [
      {
        label: 'Écouter',
        href: '#',
      },
    ],
  },
  {
    title: 'Adapter ses écrans',
    description:
      'Mini-guide pour réduire la luminosité, activer le mode lecture et limiter les rechutes.',
    duration: '4 min',
    type: 'article',
    actions: [
      {
        label: 'Lire le guide',
        href: '#',
      },
    ],
  },
];

export const CAREGIVER_RESOURCES: Resource[] = [
  {
    title: 'Observer les signaux invisibles',
    description:
      "Grille d'observation pour détecter concentration, mémoire, irritabilité ou hypersensibilités.",
    duration: '15 min',
    type: 'checklist',
    actions: [
      {
        label: 'Télécharger la grille',
        href: '#',
      },
    ],
  },
  {
    title: 'Comment parler du rythme de récupération',
    description:
      "Article destiné à l'entourage pour expliquer la lenteur du processus sans culpabiliser.",
    duration: '6 min',
    type: 'article',
    actions: [
      {
        label: 'Lire',
        href: '#',
      },
    ],
  },
  {
    title: "Session d'auto-évaluation accompagnant",
    description:
      "Accès sécurisé pour remplir l'analyse du jour et l'associer au profil du blessé.",
    type: 'video',
    actions: [
      {
        label: 'Obtenir un code',
        href: '/accompagnant',
      },
    ],
  },
];

export const QUICK_TIPS: QuickTip[] = [
  {
    title: 'Hydratation & micronutrition',
    description: 'Répartition quotidienne, rappel eau + oméga 3.',
  },
  {
    title: 'Limiter les éléments perturbateurs',
    description: "Plan d'action lumière, bruit, visites.",
  },
  {
    title: 'Système de notification',
    description: "Comment configurer le rappel quotidien et en informer le thérapeute.",
  },
];


