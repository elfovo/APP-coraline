'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PatientIdInput from '@/components/inputs/PatientIdInput';
import { SimpleButton } from '@/components/buttons';
import { findUserByPatientId } from '@/lib/patientAccess';
import StatisticsDashboard from '@/components/statistics/StatisticsDashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AccesSantePage() {
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
      setDisplayName(patientData.displayName);
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
          console.log('DisplayName récupéré depuis API:', userData);
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
        console.log('Données récupérées depuis sessionStorage:', parsed);
        // Vérifier que les données sont récentes (moins de 5 minutes)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          // Si le displayName est null, essayer de le récupérer depuis l'API
          if (!parsed.displayName && parsed.userId) {
            // Récupérer le displayName depuis Firestore de manière asynchrone
            fetch(`/api/patient/user?userId=${encodeURIComponent(parsed.userId)}`)
              .then(async (res) => {
                if (res.ok) {
                  const userData = await res.json();
                  console.log('DisplayName récupéré depuis API:', userData);
                  const finalDisplayName = userData?.displayName || null;
                  // Mettre à jour les données dans sessionStorage si on a trouvé un displayName
                  if (finalDisplayName) {
                    const updatedData = { ...parsed, displayName: finalDisplayName };
                    sessionStorage.setItem('patientData', JSON.stringify(updatedData));
                  }
                  setPatientData({
                    userId: parsed.userId,
                    displayName: finalDisplayName,
                    email: parsed.email,
                  });
                } else {
                  // Si l'API échoue, utiliser les données telles quelles
                  setPatientData({
                    userId: parsed.userId,
                    displayName: parsed.displayName,
                    email: parsed.email,
                  });
                }
              })
              .catch(() => {
                // En cas d'erreur, utiliser les données telles quelles
                setPatientData({
                  userId: parsed.userId,
                  displayName: parsed.displayName,
                  email: parsed.email,
                });
              });
          } else {
            setPatientData({
              userId: parsed.userId,
              displayName: parsed.displayName,
              email: parsed.email,
            });
          }
          console.log('PatientData défini depuis sessionStorage:', {
            userId: parsed.userId,
            displayName: parsed.displayName,
            email: parsed.email,
          });
          // Stocker aussi les données préchargées pour StatisticsDashboard
          sessionStorage.setItem('preloadedEntries', JSON.stringify(parsed.entries || []));
          sessionStorage.setItem('preloadedAccidentDates', JSON.stringify(parsed.accidentDates || []));
          return;
        }
      } catch (e) {
        console.warn('Erreur lors de la lecture des données préchargées:', e);
      }
    }
    // Si pas de données préchargées, faire la vérification normale
    handleVerify(initialPatientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPatientId, isMounted]);

  const handleVerify = async (value?: string) => {
    const idToCheck = (value ?? patientIdInput).trim();
    if (!idToCheck) {
      setErrorMessage('Merci d\'indiquer un ID patient valide.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPatientData(null);

    try {
      const result = await findUserByPatientId(idToCheck);

      if (!result) {
        setErrorMessage('Aucun patient trouvé pour cet ID. Vérifie le numéro saisi.');
        setIsLoading(false);
        return;
      }

      // Récupérer aussi les données utilisateur depuis Firestore pour avoir le displayName complet
      const userResponse = await fetch(`/api/patient/user?userId=${encodeURIComponent(result.userId)}`);
      let userData = null;
      if (userResponse.ok) {
        userData = await userResponse.json();
        console.log('Données utilisateur depuis API:', userData);
      }
      
      const finalDisplayName = userData?.displayName || result.displayName || null;
      console.log('DisplayName final:', {
        userDataDisplayName: userData?.displayName,
        resultDisplayName: result.displayName,
        finalDisplayName
      });
      
      setPatientData({
        userId: result.userId,
        displayName: finalDisplayName,
        email: result.email || null,
      });
      setIsLoading(false);
    } catch (error: any) {
      console.error('Erreur lors de la vérification de l\'ID patient:', error);
      setErrorMessage('Impossible de vérifier l\'ID patient pour le moment.');
      setIsLoading(false);
    }
  };

  // Ne rien rendre jusqu'à ce que le composant soit monté côté client
  // Cela évite les erreurs d'hydratation
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
    // Extraire le prénom du patient
    // Ordre de priorité: displayName (depuis Firestore) > email (partie avant @) > rien
    let patientFirstName: string | null = null;
    
    // 1. Essayer d'utiliser le displayName s'il existe
    if (displayName && displayName.trim()) {
      const nameParts = displayName.trim().split(/\s+/);
      patientFirstName = nameParts[0] || displayName;
    }
    // 2. Sinon, utiliser l'email (partie avant @) comme fallback
    else if (patientData.email) {
      const emailPrefix = patientData.email.split('@')[0];
      if (emailPrefix && emailPrefix.trim()) {
        patientFirstName = emailPrefix;
      }
    }
    // 3. Sinon, on garde null (rien par défaut)
    
    console.log('Extraction du prénom:', {
      displayName,
      email: patientData.email,
      patientFirstName
    });
    
    const headerTitle = patientFirstName 
      ? `Historique complet, ${patientFirstName}`
      : 'Historique complet';

    return (
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-8">
          <StatisticsDashboard
            userId={patientData.userId}
            headerTitle={headerTitle}
          />
        </div>
      </div>
    );
  }

  // Affichage du chargement (seulement si on charge depuis l'URL)
  if (isLoading && initialPatientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <LoadingSpinner />
      </div>
    );
  }

  // Formulaire pour accès direct à la page (sans patientId dans l'URL)
  return (
    <div className="min-h-screen bg-transparent pt-16 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Accès au suivi patient</p>
            <h1 className="text-4xl font-bold text-white">Accès au suivi patient</h1>
            <p className="text-white/70">
              Entrez l'ID patient de votre patient pour accéder à son suivi et suivre l'évolution de sa commotion cérébrale.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300">
            <PatientIdInput
              value={patientIdInput}
              onChange={setPatientIdInput}
              onSubmit={() => handleVerify()}
            />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 text-center">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-center">
            <SimpleButton
              onClick={() => handleVerify()}
              disabled={!patientIdInput.trim() || isLoading}
              className="px-8 py-3 min-w-[200px]"
            >
              {isLoading ? 'Chargement...' : 'Accéder au suivi'}
            </SimpleButton>
          </div>
        </div>
      </div>
    </div>
  );
}

