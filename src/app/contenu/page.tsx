'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ResourceCard from '@/components/content/ResourceCard';
import { SimpleButton } from '@/components/buttons';

const patientResources = [
  {
    title: 'Routine matin / soir',
    description:
      'Checklist guidée pour structurer la journée après une commotion (hydratation, lumière douce, micro-pauses).',
    duration: '10 min',
    type: 'checklist' as const,
    actions: [
      {
        label: 'Ouvrir la checklist',
        href: '#',
      },
    ],
  },
  {
    title: 'Audio respiration box breathing',
    description:
      'Séance audio de 5 minutes pour calmer le système nerveux avant une activité cognitive.',
    duration: '5 min',
    type: 'audio' as const,
    actions: [
      {
        label: 'Écouter',
        href: '#',
      },
    ],
  },
  {
    title: 'Adapter ses écrans',
    description:
      'Mini-guide pour réduire la luminosité, activer le mode lecture et limiter les rechutes.',
    duration: '4 min',
    type: 'article' as const,
    actions: [
      {
        label: 'Lire le guide',
        href: '#',
      },
    ],
  },
];

const caregiverResources = [
  {
    title: 'Observer les signaux invisibles',
    description:
      'Grille d’observation pour détecter concentration, mémoire, irritabilité ou hypersensibilités.',
    duration: '15 min',
    type: 'checklist' as const,
    actions: [
      {
        label: 'Télécharger la grille',
        href: '#',
      },
    ],
  },
  {
    title: 'Comment parler du rythme de récupération',
    description:
      'Article destiné à l’entourage pour expliquer la lenteur du processus sans culpabiliser.',
    duration: '6 min',
    type: 'article' as const,
    actions: [
      {
        label: 'Lire',
        href: '#',
      },
    ],
  },
  {
    title: 'Session d’auto-évaluation accompagnant',
    description:
      'Accès sécurisé pour remplir l’analyse du jour et l’associer au profil du blessé.',
    type: 'video' as const,
    actions: [
      {
        label: 'Obtenir un code',
        href: '/accompagnant',
      },
    ],
  },
];

const quickTips = [
  {
    title: 'Hydratation & micronutrition',
    description: 'Répartition quotidienne, rappel eau + oméga 3.',
  },
  {
    title: 'Limiter les éléments perturbateurs',
    description: 'Plan d’action lumière, bruit, visites.',
  },
  {
    title: 'Système de notification',
    description: 'Comment configurer le rappel quotidien et en informer le thérapeute.',
  },
];

export default function ContenuPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-24">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-10">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Fiches pratiques
            </p>
            <h1 className="text-4xl font-bold text-white mt-1">
              Ressources pour ton rétablissement
            </h1>
            <p className="text-white/70 mt-3 max-w-3xl">
              Tout ce qu’il faut pour guider ton quotidien post-commotion et
              impliquer ton entourage : routines, audios, checklists, ainsi
              qu’un espace dédié aux accompagnants.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-md">
            <SimpleButton size="lg" className="w-full" onClick={() => router.push('/journal')}>
              Retour au journal
            </SimpleButton>
            <SimpleButton
              size="lg"
              variant="outline"
              className="w-full bg-transparent text-gray-900 border-white/30"
            >
              Télécharger tout (PDF)
            </SimpleButton>
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl text-white font-semibold">
              Pour le blessé
            </h2>
            <p className="text-white/70">
              Focus sur tes routines quotidiennes et les modules audio rapides
              pour limiter les rechutes.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {patientResources.map((resource) => (
              <ResourceCard
                key={resource.title}
                category="Blessé"
                {...resource}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl text-white font-semibold">
              Pour l’accompagnant
            </h2>
            <p className="text-white/70">
              Donne un accès guidé à ton entourage pour objectiver les journées
              difficiles et expliquer la progression.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {caregiverResources.map((resource) => (
              <ResourceCard
                key={resource.title}
                category="Accompagnant"
                {...resource}
              />
            ))}
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1 space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Rappels rapides
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Micro-fiches à consulter au quotidien
              </h2>
              <p className="text-white/70">
                Ces trois fiches peuvent être partagées directement avec ton
                thérapeute ou ton entourage pour garder le fil entre les
                consultations.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quickTips.map((tip) => (
                <div
                  key={tip.title}
                  className="bg-black/30 border border-white/5 rounded-2xl p-4"
                >
                  <h3 className="text-white font-semibold">{tip.title}</h3>
                  <p className="text-white/70 text-sm mt-2">
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

