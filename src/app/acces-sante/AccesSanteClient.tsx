'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PatientIdInput from '@/components/inputs/PatientIdInput';
import { SimpleButton } from '@/components/buttons';
import { findUserByPatientId } from '@/lib/patientAccess';
import StatisticsDashboard from '@/components/statistics/StatisticsDashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AccesSanteClient() {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId') ?? '';

  const [patientIdInput, setPatientIdInput] = useState(initialPatientId);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<{
    userId: string;
    displayName?: string | null;
    email?: string | null;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoadingDisplayName, setIsLoadingDisplayName] = useState(false);

  // S'assurer que le composant est monté côté client avant d'accéder à sessionStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mettre à jour displayName quand patientData change
  useEffect(() => {
    if (patientData) {
      setDisplayName(patientData.displayName ?? null);
    } else {
      setDisplayName(null);
    }
  }, [patientData]);

  // Essayer de récupérer le displayName depuis Firestore si ce n'est pas déjà fait
  useEffect(() => {
    if (!isMounted || !patientData?.userId) return;
    // Si on a déjà un displayName, ne pas faire de requête
    if (displayName || isLoadingDisplayName) return;

    setIsLoadingDisplayName(true);
    fetch(`/api/patient/user?userId=${encodeURIComponent(patientData.userId)}`)
      .then(async (res) => {
        if (res.ok) {
          const userData = await res.json();
          if (userData?.displayName) {
            setDisplayName(userData.displayName);
          }
        }
      })
      .catch((err) => {
        console.error('Erreur lors de la récupération du displayName:', err);
      })
      .finally(() => {
        setIsLoadingDisplayName(false);
      });
  }, [patientData?.userId, isMounted, displayName, isLoadingDisplayName]);

  useEffect(() => {
    if (!isMounted || !initialPatientId) return;

    // Vérifier si les données sont déjà préchargées dans sessionStorage
    const storedData = sessionStorage.getItem('patientData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        // Vérifier que les données sont récentes (moins de 5 minutes)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          setPatientData({
            userId: parsed.userId,
            displayName: parsed.displayName ?? null,
            email: parsed.email ?? null,
          });
          return;
        }
      } catch {
        // ignore
      }
    }
    // sinon on laisse l'utilisateur lancer la recherche
  }, [isMounted, initialPatientId]);

  const handleVerify = async () => {
    const idToCheck = patientIdInput.trim();
    if (!idToCheck) {
      setErrorMessage('Merci d’indiquer un ID patient valide.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await findUserByPatientId(idToCheck);
      if (!result) {
        setPatientData(null);
        setErrorMessage('Patient introuvable.');
        setIsLoading(false);
        return;
      }

      // Charger infos user (optionnel) via API pour displayName/email si besoin
      const userResponse = await fetch(`/api/patient/user?userId=${encodeURIComponent(result.userId)}`);
      let userData: { displayName?: string | null } | null = null;
      if (userResponse.ok) {
        userData = await userResponse.json();
      }

      const finalDisplayName = userData?.displayName || result.displayName || null;

      setPatientData({
        userId: result.userId,
        displayName: finalDisplayName,
        email: result.email || null,
      });
      setIsLoading(false);
    } catch (error: unknown) {
      console.error("Erreur lors de la vérification de l'ID patient:", error);
      setErrorMessage("Impossible de vérifier l'ID patient pour le moment.");
      setIsLoading(false);
    }
  };

  // Loader SSR-safe
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-transparent pt-16 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Accès au suivi patient</p>
              <h1 className="text-4xl font-bold text-white">Accès au suivi patient</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si un patient est chargé, afficher les statistiques
  if (patientData) {
    return (
      <StatisticsDashboard
        userId={patientData.userId}
        headerTitle={displayName ? `Historique de ${displayName}` : 'Historique complet du patient'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Accès au suivi patient</p>
            <h1 className="text-4xl font-bold text-white">Accès au suivi patient</h1>
            <p className="text-white/70">
              Entrez l&apos;ID patient de votre patient pour accéder à son suivi et suivre l&apos;évolution de sa commotion cérébrale.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300">
            <PatientIdInput value={patientIdInput} onChange={setPatientIdInput} onSubmit={() => handleVerify()} />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 text-center">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-center">
            <SimpleButton onClick={() => handleVerify()} disabled={!patientIdInput.trim() || isLoading} className="px-8 py-3 min-w-[200px]">
              {isLoading ? 'Chargement...' : 'Accéder au suivi'}
            </SimpleButton>
          </div>

          {isLoading && (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


