import { DailyEntry, WeeklySnapshot } from '@/types/journal';

export const mockDailyEntries: DailyEntry[] = [
  {
    dateISO: '2025-01-14',
    dayLabel: 'Mar. 14 jan',
    status: 'complete',
    symptoms: [
      { id: 's1', label: 'Céphalée', intensity: 4, trend: 'down' },
      { id: 's2', label: 'Fatigue', intensity: 5, trend: 'stable' },
      { id: 's3', label: 'Anxiété', intensity: 3, trend: 'down' },
    ],
    medications: [
      { id: 'm1', label: 'Analgésique', dosage: '500 mg', intensity: 6 },
      { id: 'm2', label: 'Repos guidé', intensity: 4 },
    ],
    activities: [
      { id: 'a1', label: 'Marche légère', duration: 25, symptomImpact: 2 },
      {
        id: 'a2',
        label: 'Lecture (custom)',
        duration: 15,
        symptomImpact: 3,
        custom: true,
      },
    ],
    perturbateurs: ['Lumière forte', 'Bruit élevé'],
    notes:
      'Rechute légère en fin de journée, penser à limiter les écrans après 20h.',
    reminderSent: true,
  },
  {
    dateISO: '2025-01-13',
    dayLabel: 'Lun. 13 jan',
    status: 'draft',
    symptoms: [
      { id: 's1', label: 'Céphalée', intensity: 2, trend: 'down' },
      { id: 's4', label: 'Saut d’humeur', intensity: 3, trend: 'stable' },
      { id: 's5', label: 'Troubles du sommeil', intensity: 4 },
    ],
    medications: [{ id: 'm1', label: 'Analgésique', dosage: '500 mg', intensity: 4 }],
    activities: [
      { id: 'a3', label: 'Respiration guidée', duration: 10, symptomImpact: 1 },
      { id: 'a4', label: 'Yoga doux', duration: 20, symptomImpact: 2 },
    ],
    perturbateurs: ['Stress élevé'],
    reminderSent: true,
  },
  {
    dateISO: '2025-01-12',
    dayLabel: 'Dim. 12 jan',
    status: 'missing',
    symptoms: [],
    medications: [],
    activities: [],
    perturbateurs: [],
    reminderSent: false,
  },
];

export const mockWeeklyHistory: WeeklySnapshot[] = [
  {
    weekLabel: 'Semaine 02',
    symptoms: 14,
    medications: 32,
    activities: 180,
    perturbateurs: 3,
  },
  {
    weekLabel: 'Semaine 03',
    symptoms: 10,
    medications: 28,
    activities: 210,
    perturbateurs: 4,
  },
  {
    weekLabel: 'Semaine 04',
    symptoms: 16,
    medications: 35,
    activities: 240,
    perturbateurs: 2,
  },
];
