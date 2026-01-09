import { useLanguage } from '@/contexts/LanguageContext';

interface ShortcutsSectionProps {
  onStatisticsClick: () => void;
  onProfileClick: () => void;
}

export default function ShortcutsSection({
  onStatisticsClick,
  onProfileClick,
}: ShortcutsSectionProps) {
  const { t } = useLanguage();
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">{t('quickShortcuts')}</p>
        <h2 className="text-2xl font-semibold text-white">{t('whereDoYouWantToGo')}</h2>
        <p className="text-white/70 text-sm">
          {t('shortcutsDescription')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onStatisticsClick}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-4 text-left text-white hover:border-white/40 transition"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">{t('trends')}</p>
          <p className="text-lg font-semibold">{t('calendarAndStatistics')}</p>
          <p className="text-sm text-white/70 mt-1">{t('viewAllPastDays')}</p>
        </button>
        <button
          type="button"
          onClick={onProfileClick}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-pink-500/10 p-4 text-left text-white hover:border-white/40 transition"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">{t('settings')}</p>
          <p className="text-lg font-semibold">{t('profileAndPreferences')}</p>
          <p className="text-sm text-white/70 mt-1">{t('updateRemindersAndTeam')}</p>
        </button>
      </div>
    </div>
  );
}





