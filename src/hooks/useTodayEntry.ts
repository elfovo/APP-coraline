import { useEffect, useState } from 'react';
import { listenRecentEntries } from '@/lib/firestoreEntries';
import { getTodayISO } from '@/lib/dateUtils';
import type { DailyEntry } from '@/types/journal';

export function useTodayEntry(userId: string | null) {
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);

  useEffect(() => {
    if (!userId) {
      setTodayEntry(null);
      return;
    }

    const unsubscribe = listenRecentEntries(userId, 7, (docs) => {
      const todayISO = getTodayISO();
      const match = docs.find((entry) => entry.dateISO === todayISO) ?? null;
      setTodayEntry(match);
    });

    return () => unsubscribe();
  }, [userId]);

  return todayEntry;
}
