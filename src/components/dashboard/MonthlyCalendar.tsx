'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DayInfo {
  status: 'complete' | 'draft' | 'missing';
  summary: string;
}

interface MonthlyCalendarProps {
  selectedDate: string;
  onSelect: (dateISO: string) => void;
  entriesMap: Record<string, DayInfo>;
  isLoading?: boolean;
  accidentDates?: string[];
  /** Dates (YYYY-MM-DD) pour lesquelles un commentaire de l'entourage existe */
  commentDates?: string[];
}

const statusAccent: Record<DayInfo['status'], string> = {
  complete: 'bg-emerald-500/5 text-white',
  draft: 'bg-amber-400/5 text-white',
  missing: 'bg-white/0 text-white/60',
};

const padNumber = (value: number) => value.toString().padStart(2, '0');

const toISODate = (date: Date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

const normalizeDate = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized;
};

const createDateFromISO = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return normalizeDate(new Date(year, month - 1, day));
};

export default function MonthlyCalendar({
  selectedDate,
  onSelect,
  entriesMap,
  isLoading = false,
  accidentDates = [],
  commentDates = [],
}: MonthlyCalendarProps) {
  const { t, language } = useLanguage();
  const todayISO = useMemo(() => toISODate(normalizeDate(new Date())), []);
  
  const WEEKDAY_LABELS = [
    t('monday'),
    t('tuesday'),
    t('wednesday'),
    t('thursday'),
    t('friday'),
    t('saturday'),
    t('sunday'),
  ];
  
  const STATUS_LABELS: Record<DayInfo['status'], string> = {
    complete: t('statusComplete'),
    draft: t('statusDraft'),
    missing: t('statusMissing'),
  };
  
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'fr-FR', {
    month: 'long',
    year: 'numeric',
  }), [language]);
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      return createDateFromISO(selectedDate);
    }
    return normalizeDate(new Date());
  });

  useEffect(() => {
    if (!selectedDate) return;
    setViewDate((prev) => {
      const next = createDateFromISO(selectedDate);
      if (prev.getFullYear() === next.getFullYear() && prev.getMonth() === next.getMonth()) {
        return prev;
      }
      return next;
    });
  }, [selectedDate]);

  const calendarCells = useMemo(() => {
    const cells = [] as Array<{
      iso: string;
      label: string;
      status: DayInfo['status'];
      summary: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isAccidentDate: boolean;
      hasEntourageComment: boolean;
    }>;

    const firstOfMonth = normalizeDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
    const offset = (firstOfMonth.getDay() + 6) % 7; // start Monday
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - offset);

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const totalCells = offset + daysInMonth;
    const gridLength = totalCells <= 35 ? 35 : 42;
    const commentSet = new Set(commentDates);

    for (let i = 0; i < gridLength; i++) {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + i);
      const normalizedCurrent = normalizeDate(current);
      const iso = toISODate(normalizedCurrent);
      const info = entriesMap[iso];
      const isAccidentDate = accidentDates.includes(iso);
      const hasEntourageComment = commentSet.has(iso);
      cells.push({
        iso,
        label: String(normalizedCurrent.getDate()),
        status: info?.status ?? 'missing',
        summary: info?.summary ?? '—',
        isCurrentMonth: normalizedCurrent.getMonth() === viewDate.getMonth(),
        isToday: iso === todayISO,
        isAccidentDate,
        hasEntourageComment,
      });
    }

    return cells;
  }, [entriesMap, viewDate, todayISO, accidentDates, commentDates]);

  const changeMonth = (delta: number) => {
    setViewDate((prev) =>
      normalizeDate(new Date(prev.getFullYear(), prev.getMonth() + delta, 1)),
    );
  };

  if (isLoading && !Object.keys(entriesMap).length) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 min-h-[320px] animate-pulse" />
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md w-full overflow-visible">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">{t('calendarLabel')}</p>
          <h3 className="text-xl md:text-3xl font-semibold text-white capitalize">
            {monthFormatter.format(viewDate)}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-white/20 text-white/80 px-3 py-1 hover:border-white/50 text-sm"
            onClick={() => changeMonth(-1)}
          >
            ◀
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 text-white/80 px-3 py-1 hover:border-white/50 text-sm"
            onClick={() => changeMonth(1)}
          >
            ▶
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto overflow-y-visible w-full">
        <div className="min-w-[560px] w-full max-w-full py-4 px-4 mx-auto">
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-[0.4em] text-white/40">
            {WEEKDAY_LABELS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => {
              const styles = statusAccent[cell.status];
              const isSelected = cell.iso === selectedDate;
              const commentStyle = cell.hasEntourageComment && !cell.isAccidentDate
                ? 'border-amber-400/60 bg-amber-500/10 ring-1 ring-amber-400/40'
                : cell.hasEntourageComment && cell.isAccidentDate
                  ? 'ring-amber-400/30'
                  : '';
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => onSelect(cell.iso)}
                  className={`relative flex min-h-[78px] flex-col rounded-2xl border px-2 py-2 text-left transition-all duration-200 text-xs cursor-pointer hover:scale-105 hover:z-10 overflow-hidden min-w-0 ${
                    cell.isCurrentMonth ? 'bg-white/5' : 'bg-black/30 text-white/40'
                  } ${cell.isToday ? 'border-emerald-400/70 ring-1 ring-emerald-300/50' : 'border-white/12'} ${
                    isSelected ? 'ring-2 ring-blue-400/70 border-blue-400/50' : ''
                  } ${cell.isAccidentDate ? 'border-red-400/60 bg-red-500/10 ring-1 ring-red-400/40' : ''} ${commentStyle} ${styles}`}
                >
                  <div className="flex items-center justify-between gap-0.5 text-[11px] min-w-0">
                    <span className={`shrink-0 ${cell.isAccidentDate ? 'text-red-300 font-semibold' : cell.hasEntourageComment ? 'text-amber-300 font-medium' : ''}`}>{cell.label}</span>
                    <div className="flex items-center gap-0.5 min-w-0 shrink-0 overflow-hidden">
                      {cell.isAccidentDate && (
                        <svg className="w-3 h-3 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {cell.hasEntourageComment && (
                        <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                      )}
                      {cell.isToday && <span className="text-emerald-300 text-[9px] truncate max-w-[3.5rem]" title={t('today')}>{t('today')}</span>}
                    </div>
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] truncate">
                    {cell.summary}
                  </div>
                  <div className={`mt-auto uppercase tracking-[0.3em] truncate max-w-full ${
                    cell.status === 'missing' ? 'text-[8px]' : 'text-[9px]'
                  } ${cell.isAccidentDate ? 'text-red-300' : ''} ${cell.hasEntourageComment && !cell.isAccidentDate ? 'text-amber-300' : ''}`} title={cell.isAccidentDate ? t('accident') : cell.hasEntourageComment ? t('entourageCommentShort') : STATUS_LABELS[cell.status]}>
                    {cell.isAccidentDate ? t('accident') : cell.hasEntourageComment ? t('entourageCommentShort') : STATUS_LABELS[cell.status]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
