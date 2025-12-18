'use client';

import React from 'react';
import { SimpleButton } from '@/components/buttons';

interface ResourceCardProps {
  category: 'Blessé' | 'Accompagnant';
  title: string;
  description: string;
  duration?: string;
  type?: 'audio' | 'video' | 'article' | 'checklist';
  actions?: {
    label: string;
    href: string;
  }[];
}

const typeLabel: Record<
  NonNullable<ResourceCardProps['type']>,
  { label: string; bg: string }
> = {
  audio: { label: 'Audio', bg: 'bg-purple-500/20 text-purple-200' },
  video: { label: 'Vidéo', bg: 'bg-cyan-500/20 text-cyan-200' },
  article: { label: 'Article', bg: 'bg-amber-500/20 text-amber-100' },
  checklist: { label: 'Checklist', bg: 'bg-emerald-500/20 text-emerald-100' },
};

export default function ResourceCard({
  category,
  title,
  description,
  duration,
  type,
  actions,
}: ResourceCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs uppercase tracking-[0.2em]">
          {category}
        </span>
        {type && (
          <span
            className={[
              'px-3 py-1 rounded-full text-xs font-semibold',
              typeLabel[type].bg,
            ].join(' ')}
          >
            {typeLabel[type].label}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-2xl text-white font-semibold">{title}</h3>
        <p className="text-white/70 mt-2">{description}</p>
      </div>

      {duration && (
        <p className="text-white/60 text-sm">Durée estimée : {duration}</p>
      )}

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <SimpleButton
              key={action.href}
              size="sm"
              className="px-4"
              onClick={() => window.open(action.href, '_blank')}
            >
              {action.label}
            </SimpleButton>
          ))}
        </div>
      )}
    </div>
  );
}


