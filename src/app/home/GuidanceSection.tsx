import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo } from 'react';

export default function GuidanceSection() {
  const { t } = useLanguage();
  const guidanceItems = useMemo(() => [
    t('guidanceItem1'),
    t('guidanceItem2'),
    t('guidanceItem3'),
  ], [t]);
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">{t('dailyGuidance')}</p>
        <h2 className="text-2xl font-semibold text-white">{t('gentlePlanToday')}</h2>
        <p className="text-white/70 text-sm">
          {t('guidanceDescription')}
        </p>
      </div>
      <ul className="space-y-3">
        {guidanceItems.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/30 p-3 text-white/80 text-sm"
          >
            <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}




