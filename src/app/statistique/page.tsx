import { Suspense } from 'react';
import StatistiqueClient from './StatistiqueClient';

export default function StatistiquePage() {
  return (
    <Suspense fallback={null}>
      <StatistiqueClient />
    </Suspense>
  );
}


