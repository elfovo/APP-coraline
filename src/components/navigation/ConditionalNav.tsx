'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import SimpleNav from './SimpleNav';
import { useAuth } from '@/contexts/AuthContext';

const AUTH_PAGES = ['/', '/login', '/register', '/reset-password'];

export default function ConditionalNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isStatisticsWithPatientId, setIsStatisticsWithPatientId] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  // Synchroniser shouldHide avec l'URL (pour statistique + patientId)
  useEffect(() => {
    if (pathname === '/statistique' && typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('patientId')) {
        setIsStatisticsWithPatientId(true);
        setShouldHide(true);
        return;
      }
    }
    setIsStatisticsWithPatientId(false);
    setShouldHide(false);
  }, [pathname]);

  if (!pathname) {
    return null;
  }

  const isAuthPage = AUTH_PAGES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Masquer le menu si :
  // - Page d'auth sans utilisateur
  // - Page statistique avec patientId
  // - Page accès-sante (dédiée aux professionnels de santé)
  // - Page entourage (commentaires de l'entourage)
  // - Page onboarding
  const hideNavigation =
    (isAuthPage && !user) ||
    isStatisticsWithPatientId ||
    shouldHide ||
    pathname === '/acces-sante' ||
    pathname.startsWith('/acces-sante') ||
    pathname === '/entourage' ||
    pathname.startsWith('/entourage') ||
    pathname === '/onboarding' ||
    pathname.startsWith('/onboarding');

  if (hideNavigation) {
    return null;
  }

  return <SimpleNav />;
}



