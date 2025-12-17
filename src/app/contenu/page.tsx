'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PATIENT_RESOURCES, CAREGIVER_RESOURCES } from './constants';
import ContenuHeader from './ContenuHeader';
import ResourceSection from './ResourceSection';
import QuickTipsSection from './QuickTipsSection';

export default function ContenuPage() {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-24">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-10">
        <ContenuHeader />

        <ResourceSection
          title="Pour le blessé"
          description="Focus sur tes routines quotidiennes et les modules audio rapides pour limiter les rechutes."
          resources={PATIENT_RESOURCES}
          category="Blessé"
        />

        <ResourceSection
          title="Pour l'accompagnant"
          description="Donne un accès guidé à ton entourage pour objectiver les journées difficiles et expliquer la progression."
          resources={CAREGIVER_RESOURCES}
          category="Accompagnant"
        />

        <QuickTipsSection />
      </div>
    </div>
  );
}
