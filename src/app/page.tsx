'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { SimpleButton, OutlineButton } from '@/components/buttons';
import { listenRecentEntries } from '@/lib/firestoreEntries';
import type { DailyEntry } from '@/types/journal';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) {
      setTodayEntry(null);
      return;
    }
    const unsubscribe = listenRecentEntries(user.uid, 7, (docs) => {
      const todayISO = new Date().toISOString().split('T')[0];
      const match = docs.find((entry) => entry.dateISO === todayISO) ?? null;
      setTodayEntry(match);
    });
    return () => unsubscribe();
  }, [user]);

  const { greeting, heroMessage } = useMemo(() => {
    const defaultMessage =
      'Centralise tes routines, tes suivis et les ressources utiles pour toi et ton entourage.';

    if (!user) {
      return {
        greeting: 'Bienvenue',
        heroMessage: 'Connecte-toi pour retrouver ton espace personnel et tes suivis quotidiens.',
      };
    }

    const firstName =
      user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Bienvenue';

    if (hour === null) {
      return {
        greeting: `Bienvenue ${firstName}`,
        heroMessage: defaultMessage,
      };
    }

    if (hour < 12) {
      return {
        greeting: `Bonjour ${firstName}`,
        heroMessage:
          'Commence ta matinée en douceur : respiration guidée, routines légères et plan du jour.',
      };
    }
    if (hour < 18) {
      return {
        greeting: `Bon après-midi ${firstName}`,
        heroMessage:
          'Fais le point sur ta progression et ajuste tes activités selon ton niveau d’énergie.',
      };
    }
    return {
      greeting: `Bonsoir ${firstName}`,
      heroMessage:
        'Prépare ta soirée, capture tes ressentis et assure un réveil plus serein demain.',
    };
  }, [user, hour]);

  useEffect(() => {
    const updateHour = () => setHour(new Date().getHours());
    updateHour();
    const intervalId = setInterval(updateHour, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirection en cours
  }

  const isTodayComplete = todayEntry?.status === 'complete';

  const highlightCards = [
    {
      title: 'Compléter mon journal',
      description: isTodayComplete
        ? 'Super, ton entrée du jour est déjà validée. Tu peux te reposer ou revoir ce que tu as noté.'
        : 'Ajoute ton humeur, tes symptômes et activités du jour.',
      action: () => router.push('/journal'),
      badge: isTodayComplete ? 'Terminé' : '5 min',
      variant: isTodayComplete ? 'completed' : 'default',
      disabled: isTodayComplete,
    },
    {
      title: 'Consulter les fiches pratiques',
      description: 'Routines, audios et checklists pour ton entourage.',
      action: () => router.push('/contenu'),
      badge: 'Nouveau',
      variant: 'default',
    },
    {
      title: 'Statistiques détaillées',
      description: 'Visualise ton calendrier et les tendances récentes.',
      action: () => router.push('/statistique'),
      badge: 'Historique',
      variant: 'default',
    },
  ];

  const guidanceItems = [
    'Prends 2 minutes pour respirer avant de commencer une activité cognitive.',
    'Informe ton accompagnant si tu ressens une fatigue inhabituelle.',
    'Limite l’écran à 20 minutes en continu, puis fais une pause de 5 minutes.',
  ];

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-10 flex flex-col gap-10">
        <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 sm:p-10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-12 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <p className="text-white/70 uppercase tracking-[0.3em] text-xs">Tableau de bord</p>
              <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight">
                {greeting}, continuons ton rétablissement avec clarté.
              </h1>
              <p className="text-white/80 text-lg">{heroMessage}</p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-64">
              <SimpleButton size="lg" className="flex-1" onClick={() => router.push('/journal')}>
                Ouvrir le journal
              </SimpleButton>
              <OutlineButton
                size="lg"
                className="flex-1 border-white/40 text-white"
                onClick={() => router.push('/contenu')}
              >
                Bibliothèque
              </OutlineButton>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlightCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-3xl p-6 flex flex-col gap-4 transition-colors border ${
                card.variant === 'completed'
                  ? 'bg-emerald-500/10 border-emerald-400/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
                <span>Action</span>
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
                {card.variant === 'completed' ? 'Journal rempli' : 'Accéder'}
              </SimpleButton>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Guidance quotidienne</p>
              <h2 className="text-2xl font-semibold text-white">Plan doux pour aujourd’hui</h2>
              <p className="text-white/70 text-sm">
                Trois suggestions pour garder le rythme sans t’épuiser.
              </p>
            </div>
            <ul className="space-y-3">
              {guidanceItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/30 p-3 text-white/80 text-sm"
                >
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Raccourcis rapides</p>
              <h2 className="text-2xl font-semibold text-white">Où veux-tu aller ?</h2>
              <p className="text-white/70 text-sm">
                Choisis un espace selon ton besoin du moment.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => router.push('/statistique')}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-4 text-left text-white hover:border-white/40 transition"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">Tendances</p>
                <p className="text-lg font-semibold">Calendrier & statistiques</p>
                <p className="text-sm text-white/70 mt-1">Visualise toutes tes journées passées.</p>
              </button>
              <button
                type="button"
                onClick={() => router.push('/profil')}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-pink-500/10 p-4 text-left text-white hover:border-white/40 transition"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2">Réglages</p>
                <p className="text-lg font-semibold">Profil & préférences</p>
                <p className="text-sm text-white/70 mt-1">Met à jour tes rappels et ton équipe.</p>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
