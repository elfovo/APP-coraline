export const GUIDANCE_ITEMS = [
  'Prends 2 minutes pour respirer avant de commencer une activité cognitive.',
  'Informe ton accompagnant si tu ressens une fatigue inhabituelle.',
  "Limite l'écran à 20 minutes en continu, puis fais une pause de 5 minutes.",
] as const;

export interface HighlightCard {
  title: string;
  description: string;
  action: () => void;
  badge: string;
  variant: 'completed' | 'default';
  disabled?: boolean;
}

export const getHighlightCards = (
  isTodayComplete: boolean,
  navigate: (path: string) => void,
): HighlightCard[] => [
  {
    title: 'Compléter mon journal',
    description: isTodayComplete
      ? 'Super, ton entrée du jour est déjà validée. Tu peux te reposer ou revoir ce que tu as noté.'
      : 'Ajoute ton humeur, tes symptômes et activités du jour.',
    action: () => navigate('/journal'),
    badge: isTodayComplete ? 'Terminé' : '5 min',
    variant: isTodayComplete ? 'completed' : 'default',
    disabled: isTodayComplete,
  },
  {
    title: 'Consulter les fiches pratiques',
    description: 'Routines, audios et checklists pour ton entourage.',
    action: () => navigate('/contenu'),
    badge: 'Nouveau',
    variant: 'default',
  },
  {
    title: 'Statistiques détaillées',
    description: 'Visualise ton calendrier et les tendances récentes.',
    action: () => navigate('/statistique'),
    badge: 'Historique',
    variant: 'default',
  },
];
