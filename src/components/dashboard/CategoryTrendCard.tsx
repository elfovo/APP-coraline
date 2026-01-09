'use client';

import React from 'react';

interface CategoryTrendCardProps {
  title: string;
  description: string;
  unit?: string;
  max?: number;
  data: Array<{
    weekLabel: string;
    value: number;
  }>;
  accentGradient?: string;
}

export default function CategoryTrendCard({
  title,
  description,
  unit = '',
  max = 100,
  data,
  accentGradient = 'from-purple-500 via-pink-500 to-orange-400',
}: CategoryTrendCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          {title}
        </p>
        <p className="text-white/70 text-sm mt-1">{description}</p>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const ratio = Math.min(1, item.value / max);
          return (
            <div key={item.weekLabel}>
              <div className="flex items-center justify-between text-white/70 text-sm mb-1">
                <span>{item.weekLabel}</span>
                <span className="text-white font-semibold">
                  {item.value}
                  {unit}
                </span>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${accentGradient}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}





