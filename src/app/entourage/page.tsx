import { Suspense } from 'react';
import EntourageClient from './EntourageClient';

export default function EntouragePage() {
  return (
    <Suspense fallback={null}>
      <EntourageClient />
    </Suspense>
  );
}
