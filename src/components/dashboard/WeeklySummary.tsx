'use client';

import React from 'react';
import { WeeklyTotals } from '@/types/journal';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeeklySummaryProps {
  totals: WeeklyTotals;
  weekLabel: string;
}

const formatValue = (value: number, suffix = '', locale: string = 'fr-FR') =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value) + suffix;

export default function WeeklySummary({
  totals,
  weekLabel,
}: WeeklySummaryProps) {
  const { t, language } = useLanguage();
  const locale = language === 'en' ? 'en-US' : 'fr-FR';
  
  const CARDS = [
    { key: 'symptoms', label: t('symptomsLabel'), max: 132 },
    { key: 'medications', label: t('medicationsTitle'), max: 80 },
    { key: 'activities', label: `${t('activitiesLabel')} (${t('minutes')})`, max: 600 },
    { key: 'perturbateurs', label: t('disruptorsLabel'), max: 10 },
  ] as const;
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            {t('week')} {weekLabel}
          </p>
          <h2 className="text-3xl font-semibold text-white mt-2">
            {t('weeklyOverview')}
          </h2>
          <p className="text-white/70 mt-1">
            {t('weeklyOverviewDesc')}
          </p>
        </div>
        <div className="flex gap-3">
          <span className="px-4 py-2 rounded-full bg-white/10 text-white text-sm border border-white/20">
            {t('reportsAvailable')}
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
                {formatValue(value, '', locale)}
                {card.key === 'symptoms' ? '/132' : ''}
              </p>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
              <p className="text-xs text-white/50 mt-2">
                {card.key === 'activities' ? t('weeklyGoalMinutes', { max: card.max }) : t('weeklyGoal', { max: card.max })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}





