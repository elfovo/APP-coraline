'use client';

import CaregiverCodeCard from '@/components/caregiver/CaregiverCodeCard';
import CaregiverObservationForm from '@/components/caregiver/CaregiverObservationForm';
import { SimpleButton } from '@/components/buttons';
import { useRouter } from 'next/navigation';

export default function CaregiverPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-24">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-10">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            Espace accompagnant
          </p>
          <h1 className="text-4xl font-bold text-white">
            Partager ton observation quotidienne
          </h1>
          <p className="text-white/70 max-w-3xl">
            Cet espace te permet d’aider la personne blessée à documenter les
            signes difficiles à ressentir seul·e. Le patient génère un code
            temporaire, tu le saisis puis tu notes ce que tu observes calmement.
          </p>
          <div className="flex flex-wrap gap-3">
            <SimpleButton onClick={() => router.push('/contenu')}>
              Voir les fiches accompagnant
            </SimpleButton>
            <SimpleButton
              variant="outline"
              className="bg-transparent text-white border-white/30"
              onClick={() => router.push('/journal')}
            >
              Retour au journal patient
            </SimpleButton>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CaregiverCodeCard />
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Étape 2 · Accompagnant
            </p>
            <h2 className="text-2xl font-semibold text-white mt-1">
              Une seule observation par jour
            </h2>
            <p className="text-white/70 mt-2">
              Après avoir reçu le code, saisis-le dans le formulaire pour
              synchroniser ton analyse. Tu peux remplir ce formulaire depuis ton
              téléphone sans avoir de compte.
            </p>
            <ul className="list-disc list-inside text-white/70 text-sm mt-4 space-y-1">
              <li>Reste factuel, note ce que tu as observé directement.</li>
              <li>
                L’échelle de 1 à 6 correspond à l’intensité ou la fréquence.
              </li>
              <li>
                Tu peux ajouter un exemple concret dans la zone “Notes”.
              </li>
            </ul>
          </div>
        </section>

        <CaregiverObservationForm />
      </div>
    </div>
  );
}





