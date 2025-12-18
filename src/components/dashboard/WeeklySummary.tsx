'use client';

import React from 'react';
import { WeeklyTotals } from '@/types/journal';

interface WeeklySummaryProps {
  totals: WeeklyTotals;
  weekLabel: string;
}

const formatValue = (value: number, suffix = '') =>
  new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value) + suffix;

const CARDS = [
  { key: 'symptoms', label: 'Symptômes', max: 132 },
  { key: 'medications', label: 'Médicaments / Thérapies', max: 80 },
  { key: 'activities', label: 'Activités (min)', max: 600 },
  { key: 'perturbateurs', label: 'Perturbateurs', max: 10 },
] as const;

export default function WeeklySummary({
  totals,
  weekLabel,
}: WeeklySummaryProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Semaine {weekLabel}
          </p>
          <h2 className="text-3xl font-semibold text-white mt-2">
            Vue d&apos;ensemble hebdomadaire
          </h2>
          <p className="text-white/70 mt-1">
            Totaux par catégorie pour suivre les tendances et préparer les
            exports médicaux.
          </p>
        </div>
        <div className="flex gap-3">
          <span className="px-4 py-2 rounded-full bg-white/10 text-white text-sm border border-white/20">
            Rapports PDF / CSV disponibles
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map((card) => {
          const value = totals[card.key];
          const ratio = Math.min(1, value / card.max);

          return (
            <div
              key={card.key}
              className="bg-black/30 border border-white/10 rounded-2xl p-4 shadow-inner"
            >
              <p className="text-sm text-white/60">{card.label}</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {formatValue(value)}
                {card.key === 'symptoms' ? '/132' : ''}
              </p>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
              <p className="text-xs text-white/50 mt-2">
                Objectif hebdo : {card.max}
                {card.key === 'activities' ? ' min' : ''}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}


