import { useEffect, useMemo, useState } from 'react';
import { getDbInstance } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { fetchEntriesBetween } from '@/lib/firestoreEntries';
import { getTodayISO } from '@/lib/dateUtils';
import {
  getSymptomScore,
  computeWellbeing,
  type WellbeingResult,
} from '@/lib/wellbeingScore';
import type { DailyEntry } from '@/types/journal';

export function useWellbeingScore(userId: string | null, todayEntry: DailyEntry | null) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const todayISO = getTodayISO();
        const db = getDbInstance();
        const userSnap = await getDoc(doc(db, 'users', userId));
        const accidentDates: string[] = userSnap.exists()
          ? (userSnap.data()?.accidentDates ?? []) || []
          : [];

        const startISO =
          accidentDates.length > 0
            ? accidentDates.sort((a, b) => a.localeCompare(b))[0]
            : null;

        if (!startISO || startISO > todayISO) {
          if (!cancelled) setEntries([]);
          return;
        }

        const list = await fetchEntriesBetween(userId, startISO, todayISO);
        if (!cancelled) setEntries(list);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const todayISO = getTodayISO();
  const result = useMemo((): WellbeingResult | null => {
    if (entries.length === 0 && !todayEntry && !loading) return null;
    const hasTodayInList = entries.some((e) => e.dateISO === todayISO);
    const entriesWithToday =
      todayEntry && !hasTodayInList ? [...entries, todayEntry] : entries;
    const todayScore = getSymptomScore(
      todayEntry ?? entriesWithToday.find((e) => e.dateISO === todayISO) ?? null,
    );
    return computeWellbeing(entriesWithToday, todayISO, todayScore);
  }, [entries, todayISO, todayEntry, loading]);

  return { result: loading ? null : result, loading };
}
