'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWellbeingScore } from '@/hooks/useWellbeingScore';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import {
  type WellbeingResult,
  getWellbeingStatusTranslationKey,
} from '@/lib/wellbeingScore';

function WellbeingContent({
  userId,
  result,
  loading,
}: {
  userId: string;
  result: WellbeingResult | null;
  loading: boolean;
}) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  if (!result || result.label === '—') {
    return (
      <p className="text-sm text-white/60 py-4">
        {t('wellbeingNoReference')}
      </p>
    );
  }

  const displayLabel = result.isConfirmed100
    ? t('wellbeing100Confirmed')
    : result.isUnconfirmed100
      ? t('wellbeing100Unconfirmed')
      : result.label;

  const statusLabel = t(getWellbeingStatusTranslationKey(result.status));
  const historyRuns = getStatusHistoryRuns(result.statusHistory);
  const recentRuns = historyRuns.slice(-6);

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex flex-col items-center gap-2">
        <span
          className={`text-4xl font-bold tabular-nums ${
            result.isConfirmed100
              ? 'text-emerald-400'
              : result.percent >= 80
                ? 'text-emerald-300'
                : result.percent >= 50
                  ? 'text-amber-300'
                  : 'text-white'
          }`}
        >
          {displayLabel}
        </span>
      </div>
      <div className="border-t border-white/10 pt-3">
        <p className="text-xs uppercase tracking-wider text-white/50 mb-2">
          {t('wellbeingStatusLabel')}
        </p>
        <p className="text-sm font-medium text-white/90">{statusLabel}</p>
      </div>
      {recentRuns.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <p className="text-xs uppercase tracking-wider text-white/50 mb-2">
            {t('wellbeingStatusHistory')}
          </p>
          <ul className="space-y-1.5 text-xs text-white/70">
            {recentRuns.map((run) => (
              <li key={run.startDateISO} className="flex items-center justify-between gap-2">
                <span className="text-white/50">
                  {formatDateRange(run.startDateISO, run.endDateISO)}
                </span>
                <span className="font-medium text-white/90">
                  {t(getWellbeingStatusTranslationKey(run.status))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Regroupe l’historique en séquences consécutives de même statut. */
function getStatusHistoryRuns(
  history: { dateISO: string; status: WellbeingResult['status'] }[],
): { startDateISO: string; endDateISO: string; status: WellbeingResult['status'] }[] {
  if (history.length === 0) return [];
  const runs: { startDateISO: string; endDateISO: string; status: WellbeingResult['status'] }[] = [];
  let start = history[0].dateISO;
  let prevStatus = history[0].status;
  for (let i = 1; i < history.length; i++) {
    if (history[i].status !== prevStatus) {
      runs.push({ startDateISO: start, endDateISO: history[i - 1].dateISO, status: prevStatus });
      start = history[i].dateISO;
      prevStatus = history[i].status;
    }
  }
  runs.push({
    startDateISO: start,
    endDateISO: history[history.length - 1].dateISO,
    status: prevStatus,
  });
  return runs;
}

function formatDateRange(startISO: string, endISO: string): string {
  if (startISO === endISO) return formatShortDate(startISO);
  return `${formatShortDate(startISO)} → ${formatShortDate(endISO)}`;
}

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${Number(m)}`;
}

export default function WellbeingScoreCard({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);
  const todayEntry = useTodayEntry(userId);
  const { result, loading } = useWellbeingScore(userId, todayEntry);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
        <span>{t('wellbeingScore')}</span>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          className="flex items-center justify-center w-7 h-7 rounded-full border border-white/30 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          aria-label={t('wellbeingScoreHowTitle')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-white/70">
        {t('wellbeingScoreDescription')}
      </p>
      <WellbeingContent userId={userId} result={result} loading={loading} />

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
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
                  {t('wellbeingScoreHowTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  className="text-white/70 hover:text-white transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {t('wellbeingScoreHowBody')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
