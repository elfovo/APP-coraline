'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { findUserByPatientId } from '@/lib/patientAccess';

const StatisticsDashboard = dynamic(() => import('@/components/statistics/StatisticsDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <LoadingSpinner />
    </div>
  ),
});

export default function StatistiquePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');
  const { user, loading: authLoading } = useAuth();
  
  // Utiliser useRequireAuth seulement si pas de patientId
  // Mais on doit l'appeler de manière conditionnelle pour éviter la redirection
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [requireAuthChecked, setRequireAuthChecked] = useState(false);

  // Gérer l'authentification seulement si pas de patientId
  useEffect(() => {
    if (!patientId && !authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!patientId && !authLoading) {
      setRequireAuthChecked(true);
      setTargetUserId(user?.uid || null);
    }
  }, [patientId, user, authLoading, router]);

  // Si un patientId est fourni, on doit le convertir en userId
  useEffect(() => {
    if (patientId) {
      setLoadingPatient(true);
      findUserByPatientId(patientId)
        .then((result) => {
          if (result) {
            setTargetUserId(result.userId);
          } else {
            setTargetUserId(null);
          }
        })
        .catch((error) => {
          console.error('Erreur lors de la recherche du patient:', error);
          setTargetUserId(null);
        })
        .finally(() => {
          setLoadingPatient(false);
        });
    }
  }, [patientId]);

  // Déterminer l'état de chargement
  const loading = patientId 
    ? (authLoading || loadingPatient) 
    : (authLoading || !requireAuthChecked);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <LoadingSpinner />
      </div>
    );
  }

  // Si pas de patientId et pas d'utilisateur, on a déjà redirigé
  if (!patientId && !user) {
    return null;
  }

  // Si patientId mais pas trouvé
  if (patientId && !targetUserId && !loadingPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <p className="text-white text-lg">Patient introuvable</p>
        </div>
      </div>
    );
  }

  if (!targetUserId) {
    return null;
  }

  return (
    <StatisticsDashboard 
      userId={targetUserId} 
      headerTitle={patientId ? 'Historique complet du patient' : 'Historique complet'}
    />
  );
}

