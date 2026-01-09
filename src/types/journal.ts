export type Trend = 'up' | 'down' | 'stable';

export interface SymptomEntry {
  id: string;
  label: string;
  intensity: number; // 1-6
  trend?: Trend;
}

export interface MedicationEntry {
  id: string;
  label: string;
  dosage?: string;
  intensity: number; // 1-10
}

export interface ActivityEntry {
  id: string;
  label: string;
  duration: number; // minutes
  symptomImpact?: number; // 1-6
  custom?: boolean;
}

export interface DailyEntry {
  dateISO: string; // YYYY-MM-DD
  dayLabel: string; // e.g. 'Lun. 13'
  status: 'complete' | 'draft' | 'missing';
  symptoms: SymptomEntry[];
  medications: MedicationEntry[];
  activities: ActivityEntry[];
  perturbateurs: string[];
  notes?: string;
  reminderSent?: boolean;
}

export interface WeeklyTotals {
  symptoms: number;
  medications: number;
  activities: number;
  perturbateurs: number;
}

export interface WeeklySnapshot extends WeeklyTotals {
  weekLabel: string;
}





