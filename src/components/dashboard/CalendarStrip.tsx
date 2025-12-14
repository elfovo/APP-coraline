'use client';

import React from 'react';

type CalendarDay = {
  dateISO: string;
  label: string;
  status: 'complete' | 'draft' | 'missing';
  summary: string;
};

interface CalendarStripProps {
  days: CalendarDay[];
  selectedDate: string;
  onSelect: (dateISO: string) => void;
}

const statusStyles: Record<CalendarDay['status'], string> = {
  complete: 'border-green-400/80 bg-green-400/10 text-green-100',
  draft: 'border-amber-400/70 bg-amber-400/10 text-amber-100',
  missing: 'border-white/20 bg-transparent text-white/50',
};

export default function CalendarStrip({
  days,
  selectedDate,
  onSelect,
}: CalendarStripProps) {
  return (
    <div className="w-full pb-4 overflow-x-auto">
      <div className="flex gap-4 min-w-max snap-x snap-mandatory">
        {days.map((day) => {
          const isSelected = day.dateISO === selectedDate;

          return (
            <button
              key={day.dateISO}
              onClick={() => onSelect(day.dateISO)}
              className={[
                'group relative flex min-w-[160px] flex-col rounded-[26px] px-5 py-4 text-left transition-all duration-300 snap-center',
                'bg-gradient-to-br from-emerald-950/80 via-emerald-900/40 to-black/60 border border-emerald-500/30 shadow-[0_15px_45px_rgba(0,0,0,0.45)]',
                statusStyles[day.status],
                isSelected
                  ? 'ring-2 ring-emerald-200/80 scale-[1.02]'
                  : 'hover:ring-1 hover:ring-emerald-300/40',
              ].join(' ')}
              aria-label={`Choisir le ${day.label}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 rounded-[26px] border-[3px] border-transparent transition-colors duration-300 ${
                  isSelected ? 'border-emerald-100/70' : ''
                }`}
              />
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-white/65">
                <span
                  className={`h-2 w-2 rounded-full ${
                    day.status === 'complete'
                      ? 'bg-emerald-300'
                      : day.status === 'draft'
                      ? 'bg-amber-300'
                      : 'bg-white/40'
                  }`}
                />
                {day.label}
              </div>
              <div className="mt-4 text-3xl font-semibold text-white drop-shadow-sm">
                {day.summary}
              </div>
              <div className="mt-2 text-sm text-white/70">
                {day.status === 'complete'
                  ? 'Complet'
                  : day.status === 'draft'
                  ? 'Brouillon'
                  : 'À remplir'}
              </div>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="mt-3 text-[10px] uppercase tracking-[0.4em] text-white/60">
                Journal
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
