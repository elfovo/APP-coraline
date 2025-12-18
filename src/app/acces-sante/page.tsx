import { Suspense } from 'react';
import AccesSanteClient from './AccesSanteClient';

export default function AccesSantePage() {
  return (
    <Suspense fallback={null}>
      <AccesSanteClient />
    </Suspense>
  );
}


