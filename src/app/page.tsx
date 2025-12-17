'use client';

import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { getHighlightCards } from './home/constants';
import HeroSection from './home/HeroSection';
import HighlightCard from './home/HighlightCard';
import GuidanceSection from './home/GuidanceSection';
import ShortcutsSection from './home/ShortcutsSection';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const todayEntry = useTodayEntry(user?.uid ?? null);
  const { greeting, heroMessage } = useTimeOfDay(user);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Redirection en cours
  }

  const isTodayComplete = todayEntry?.status === 'complete';
  const highlightCards = getHighlightCards(isTodayComplete, (path) => router.push(path));

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
