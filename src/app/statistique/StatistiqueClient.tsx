'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { findUserByPatientId } from '@/lib/patientAccess';
import { useLanguage } from '@/contexts/LanguageContext';

const StatisticsDashboard = dynamic(() => import('@/components/statistics/StatisticsDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <LoadingSpinner />
    </div>
  ),
});

export default function StatistiqueClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

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
  }, [patientId, authLoading, user, router]);

  // Charger le patient via patientId (accès santé)
  useEffect(() => {
    if (!patientId) return;

    setLoadingPatient(true);
    findUserByPatientId(patientId)
      .then((res) => {
        setTargetUserId(res?.userId ?? null);
      })
      .finally(() => {
        setLoadingPatient(false);
        setRequireAuthChecked(true);
      });
  }, [patientId]);

  if (authLoading || loadingPatient || !requireAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <LoadingSpinner />
      </div>
    );
  }

  if (!targetUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <p className="text-white/70">{t('userNotFound')}</p>
      </div>
    );
  }

  return <StatisticsDashboard userId={targetUserId} />;
}



