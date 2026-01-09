'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import HeroSection from './home/HeroSection';
import HighlightCard from './home/HighlightCard';
import GuidanceSection from './home/GuidanceSection';
import ShortcutsSection from './home/ShortcutsSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import LandingPage from './(auth)/page';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo } from 'react';
import type { HighlightCard } from './home/constants';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const todayEntry = useTodayEntry(user?.uid ?? null);
  const { greeting, heroMessage } = useTimeOfDay(user);

  // Tous les hooks doivent être appelés avant les retours conditionnels
  const isTodayComplete = todayEntry?.status === 'complete';
  const highlightCards = useMemo((): HighlightCard[] => [
    {
      title: t('completeJournal'),
      description: isTodayComplete
        ? t('journalCompleteDescription')
        : t('journalIncompleteDescription'),
      action: () => router.push('/journal'),
      badge: isTodayComplete ? t('completed') : t('fiveMinutes'),
      variant: isTodayComplete ? 'completed' : 'default',
      disabled: isTodayComplete,
    },
    {
      title: t('consultPracticalSheets'),
      description: t('practicalSheetsDescription'),
      action: () => router.push('/contenu'),
      badge: t('newBadge'),
      variant: 'default',
    },
    {
      title: t('detailedStatistics'),
      description: t('statisticsDescription'),
      action: () => router.push('/statistique'),
      badge: t('historyBadge'),
      variant: 'default',
    },
  ], [isTodayComplete, router, t]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Si l'utilisateur n'est pas connecté, afficher la landing page
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-10 flex flex-col gap-10">
        <HeroSection
          greeting={greeting}
          heroMessage={heroMessage}
          onJournalClick={() => router.push('/journal')}
          onLibraryClick={() => router.push('/contenu')}
        />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlightCards.map((card) => (
            <HighlightCard key={card.title} card={card} />
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GuidanceSection />
          <ShortcutsSection
            onStatisticsClick={() => router.push('/statistique')}
            onProfileClick={() => router.push('/profil')}
          />
        </section>
      </div>
    </div>
  );
}
