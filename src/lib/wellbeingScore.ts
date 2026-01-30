import type { DailyEntry } from '@/types/journal';

/** 22 symptômes (0–6 chacun) → score total max 132 */
export const SYMPTOM_IDS = [
  'cephalee',
  'nePasSeSentirNormal',
  'pressionCrane',
  'concentration',
  'douleursCervicales',
  'problemesMemoire',
  'nausees',
  'fatigue',
  'vertiges',
  'confusion',
  'vision',
  'somnolence',
  'equilibre',
  'hypersensibilite',
  'photophobie',
  'irritabilite',
  'phonophobie',
  'tristesse',
  'sensationRalenti',
  'anxiete',
  'brouillardMental',
  'difficultesEndormir',
] as const;

export const MAX_SYMPTOM_SCORE = SYMPTOM_IDS.length * 6; // 132

/** Score symptômes S(t) pour une entrée (0–132). Entrée vide ou null → 0. */
export function getSymptomScore(entry: DailyEntry | null): number {
  if (!entry?.symptoms?.length) return 0;
  return SYMPTOM_IDS.reduce((sum, id) => {
    const s = entry.symptoms.find((x) => x.id === id);
    return sum + (s?.intensity ?? 0);
  }, 0);
}

/** Référence R = pire score observé (max S(t)) sur toutes les entrées fournies. */
export function getReferenceR(entries: DailyEntry[]): number {
  if (entries.length === 0) return 0;
  return Math.max(...entries.map((e) => getSymptomScore(e)));
}

/** Statuts possibles du suivi bien-être (logique machine). */
export type WellbeingStatusKey =
  | 'en_progression'
  | 'stable'
  | 'rechute_legere'
  | 'rechute_significative'
  | 'cent_pourcent_atteint'
  | 'retabli_100_stable';

/** Un instantané de statut à une date (pour l’historique). */
export type StatusSnapshot = {
  dateISO: string;
  status: WellbeingStatusKey;
};

const STATUS_TRANSLATION_KEYS: Record<WellbeingStatusKey, string> = {
  en_progression: 'wellbeingStatusEnProgression',
  stable: 'wellbeingStatusStable',
  rechute_legere: 'wellbeingStatusRechuteLegere',
  rechute_significative: 'wellbeingStatusRechuteSignificative',
  cent_pourcent_atteint: 'wellbeingStatusCentPourcentAtteint',
  retabli_100_stable: 'wellbeingStatusRetabli100Stable',
};

/** Retourne la clé de traduction pour un statut. */
export function getWellbeingStatusTranslationKey(status: WellbeingStatusKey): string {
  return STATUS_TRANSLATION_KEYS[status];
}

export type WellbeingResult = {
  /** Pourcentage de rétablissement 0–100 (ou 100 confirmé). */
  percent: number;
  /** Libellé affiché : "X %", "100% (à confirmer)", "100%" */
  label: string;
  /** True si 100% confirmé (30 j consécutifs S(t) ≤ 2 sans aggravation). */
  isConfirmed100: boolean;
  /** True si S(t) ≤ 2 mais pas encore 30 j → "100% (à confirmer)". */
  isUnconfirmed100: boolean;
  /** Score du jour S(t). */
  scoreToday: number;
  /** Référence R utilisée. */
  referenceR: number;
  /** Statut actuel (règle machine). */
  status: WellbeingStatusKey;
  /** Historique des statuts par date (liste ordonnée par date). */
  statusHistory: StatusSnapshot[];
};

const AGGRAVATION_THRESHOLD = 10; // +10 points le lendemain d'une journée "normale" = aggravation notable
const CONSECUTIVE_DAYS_FOR_100 = 30;
const NEAR_REFERENCE_RECOVERY_PERCENT = 15; // "retour proche du score de référence" si récup ≤ 15%

/** Construit la map dateISO → S(t) et la liste des dates triées. */
function getScoreByDate(entries: DailyEntry[]): { scoreByDate: Map<string, number>; datesAsc: string[] } {
  const sorted = [...entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const scoreByDate = new Map(sorted.map((e) => [e.dateISO, getSymptomScore(e)]));
  const datesAsc = sorted.map((e) => e.dateISO);
  return { scoreByDate, datesAsc };
}

/** Score il y a exactement n jours (date ISO). Retourne undefined si pas d’entrée. */
function getScoreNDaysAgo(scoreByDate: Map<string, number>, todayISO: string, n: number): number | undefined {
  const d = new Date(todayISO);
  d.setDate(d.getDate() - n);
  const iso = d.toISOString().split('T')[0];
  const s = scoreByDate.get(iso);
  return s === undefined ? undefined : s;
}

/** Tendance ↓ sur 7 jours : régression linéaire, pente < -0.3. */
function hasDownwardTrend7Days(scoreByDate: Map<string, number>, todayISO: string): boolean {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const s = getScoreNDaysAgo(scoreByDate, todayISO, i);
    if (s === undefined) continue;
    points.push({ x: i, y: s });
  }
  if (points.length < 4) return false;
  const n = points.length;
  const sumX = points.reduce((a, p) => a + p.x, 0);
  const sumY = points.reduce((a, p) => a + p.y, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope < -0.3;
}

/** Hausse sur 2–3 jours : scores en augmentation sur les 2–3 derniers jours. */
function hasUpwardTrend2_3Days(scoreByDate: Map<string, number>, todayISO: string): boolean {
  const s0 = getScoreNDaysAgo(scoreByDate, todayISO, 0);
  const s1 = getScoreNDaysAgo(scoreByDate, todayISO, 1);
  const s2 = getScoreNDaysAgo(scoreByDate, todayISO, 2);
  if (s0 === undefined || s1 === undefined) return false;
  if (s1 < s0) return true; // hier < aujourd’hui
  if (s2 !== undefined && s2 < s1 && s1 < s0) return true; // 3 jours en hausse
  return false;
}

/**
 * Calcule le statut actuel à partir du résultat bien-être et des entrées.
 * Règles : Rétabli 100% → 100% atteint → Rechute signif. → Rechute légère → En progression → Stable.
 */
function computeCurrentStatus(
  entries: DailyEntry[],
  todayISO: string,
  todayScore: number,
  R: number,
  result: Omit<WellbeingResult, 'status' | 'statusHistory'>,
): WellbeingStatusKey {
  if (result.isConfirmed100) return 'retabli_100_stable';
  if (result.isUnconfirmed100) return 'cent_pourcent_atteint';
  if (R === 0) return 'stable';

  const { scoreByDate } = getScoreByDate(entries);
  const score7Ago = getScoreNDaysAgo(scoreByDate, todayISO, 7);
  const variation = score7Ago !== undefined ? todayScore - score7Ago : 0;
  const trendDown7 = hasDownwardTrend7Days(scoreByDate, todayISO);
  const trendUp2_3 = hasUpwardTrend2_3Days(scoreByDate, todayISO);
  const nearReference = result.percent <= NEAR_REFERENCE_RECOVERY_PERCENT;

  if (variation >= 10 || nearReference) return 'rechute_significative';
  if (variation >= 5 && variation <= 10) return 'rechute_legere';
  if (trendUp2_3) return 'rechute_legere';
  if (variation <= -5 || trendDown7) return 'en_progression';
  if (variation >= -4 && variation <= 4) return 'stable';
  return 'stable';
}

type WellbeingResultPartial = Omit<WellbeingResult, 'status' | 'statusHistory'>;

/**
 * Calcule le résultat bien-être sans statut ni historique (pour éviter la récursion).
 */
function computeWellbeingPartial(
  entries: DailyEntry[],
  todayISO: string,
  todayScore: number,
): WellbeingResultPartial {
  const R = getReferenceR(entries);
  const scoreToday = todayScore;

  if (R === 0) {
    return {
      percent: 0,
      label: '—',
      isConfirmed100: false,
      isUnconfirmed100: false,
      scoreToday,
      referenceR: 0,
    };
  }

  if (scoreToday > R) {
    return {
      percent: 0,
      label: '0%',
      isConfirmed100: false,
      isUnconfirmed100: false,
      scoreToday,
      referenceR: R,
    };
  }

  const percent = Math.round((100 * (R - scoreToday)) / R);

  if (scoreToday <= 2) {
    const entriesSorted = [...entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    const todayIdx = entriesSorted.findIndex((e) => e.dateISO === todayISO);
    if (todayIdx < 0) {
      return {
        percent: 100,
        label: '100% (à confirmer)',
        isConfirmed100: false,
        isUnconfirmed100: true,
        scoreToday,
        referenceR: R,
      };
    }

    const scoreByDate = new Map(entriesSorted.map((e) => [e.dateISO, getSymptomScore(e)]));
    let consecutiveLow = 0;
    const today = new Date(todayISO);
    for (let d = 0; d < CONSECUTIVE_DAYS_FOR_100; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const iso = date.toISOString().split('T')[0];
      const s = scoreByDate.get(iso) ?? -1;
      if (s <= 2 && s >= 0) consecutiveLow++;
      else break;
    }
    const has30Consecutive = consecutiveLow >= CONSECUTIVE_DAYS_FOR_100;

    let hasNotableAggravation = false;
    const sortedByDate = [...entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    for (let i = 0; i < sortedByDate.length - 1; i++) {
      const sToday = getSymptomScore(sortedByDate[i]);
      const sTomorrow = getSymptomScore(sortedByDate[i + 1]);
      if (sToday <= 20 && sTomorrow - sToday >= AGGRAVATION_THRESHOLD) {
        hasNotableAggravation = true;
        break;
      }
    }

    const isConfirmed100 = has30Consecutive && !hasNotableAggravation;

    return {
      percent: 100,
      label: isConfirmed100 ? '100%' : '100% (à confirmer)',
      isConfirmed100,
      isUnconfirmed100: !isConfirmed100,
      scoreToday,
      referenceR: R,
    };
  }

  return {
    percent,
    label: `${percent}%`,
    isConfirmed100: false,
    isUnconfirmed100: false,
    scoreToday,
    referenceR: R,
  };
}

/**
 * Calcule l’historique des statuts : pour chaque date ayant une entrée (jusqu’à aujourd’hui),
 * détermine le statut à cette date avec les entrées disponibles jusqu’à cette date.
 */
export function computeStatusHistory(
  entries: DailyEntry[],
  todayISO: string,
): StatusSnapshot[] {
  const sorted = [...entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const upToToday = sorted.filter((e) => e.dateISO <= todayISO);
  const history: StatusSnapshot[] = [];

  for (let i = 0; i < upToToday.length; i++) {
    const slice = upToToday.slice(0, i + 1);
    const dateISO = upToToday[i].dateISO;
    const scoreAtDate = getSymptomScore(upToToday[i]);
    const partial = computeWellbeingPartial(slice, dateISO, scoreAtDate);
    const status = computeCurrentStatus(slice, dateISO, scoreAtDate, partial.referenceR, partial);
    history.push({ dateISO, status });
  }

  return history;
}

/**
 * Calcule le résultat bien-être à partir des entrées et du score du jour.
 * Inclut le statut actuel et l’historique des statuts par date.
 */
export function computeWellbeing(
  entries: DailyEntry[],
  todayISO: string,
  todayScore: number,
): WellbeingResult {
  const partial = computeWellbeingPartial(entries, todayISO, todayScore);
  const status = computeCurrentStatus(
    entries,
    todayISO,
    todayScore,
    partial.referenceR,
    partial,
  );
  const statusHistory = computeStatusHistory(entries, todayISO);
  return {
    ...partial,
    status,
    statusHistory,
  };
}
