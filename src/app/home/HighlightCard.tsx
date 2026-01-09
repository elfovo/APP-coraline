import { SimpleButton } from '@/components/buttons';
import type { HighlightCard as HighlightCardType } from './constants';
import { useLanguage } from '@/contexts/LanguageContext';

interface HighlightCardProps {
  card: HighlightCardType;
}

export default function HighlightCard({ card }: HighlightCardProps) {
  const { t } = useLanguage();
  return (
    <article
      className={`rounded-3xl p-6 flex flex-col gap-4 transition-colors border ${
        card.variant === 'completed'
          ? 'bg-emerald-500/10 border-emerald-400/40'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
        <span>{t('action')}</span>
        <span
          className={`px-3 py-1 rounded-full ${
            card.variant === 'completed'
              ? 'bg-emerald-400/20 text-emerald-100'
              : 'bg-white/10 text-white/70'
          }`}
        >
          {card.badge}
        </span>
      </div>
      <h3 className="text-xl text-white font-semibold flex items-center gap-2">
        {card.variant === 'completed' && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-100 text-sm">
            ✓
          </span>
        )}
        {card.title}
      </h3>
      <p
        className={`flex-1 text-sm ${
          card.variant === 'completed' ? 'text-emerald-50/90' : 'text-white/70'
        }`}
      >
        {card.description}
      </p>
      <SimpleButton
        size="md"
        className="w-full"
        onClick={card.action}
        disabled={card.disabled}
        variant={card.variant === 'completed' ? 'outline' : 'default'}
      >
        {card.variant === 'completed' ? t('journalFilled') : t('access')}
      </SimpleButton>
    </article>
  );
}





