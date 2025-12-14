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
      <div className="flex gap-3 min-w-max">
        {days.map((day) => {
          const isSelected = day.dateISO === selectedDate;

          return (
            <button
              key={day.dateISO}
              onClick={() => onSelect(day.dateISO)}
              className={[
                'flex flex-col items-center justify-between rounded-2xl px-4 py-3 border transition-all duration-200 backdrop-blur-sm min-w-[110px]',
                statusStyles[day.status],
                isSelected ? 'ring-2 ring-white/80 shadow-lg scale-[1.02]' : 'hover:ring-1 hover:ring-white/40',
              ].join(' ')}
            >
              <span className="text-sm uppercase tracking-wide">
                {day.label}
              </span>
              <span className="text-lg font-semibold mt-2 text-white">
                {day.summary}
              </span>
              <span className="text-xs mt-1 text-white/70">
                {day.status === 'complete'
                  ? 'Complet'
                  : day.status === 'draft'
                  ? 'Brouillon'
                  : 'À remplir'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
