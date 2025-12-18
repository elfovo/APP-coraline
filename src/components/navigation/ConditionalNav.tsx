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

  // Vérifier immédiatement avec window.location pour une détection plus fiable
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowPath = window.location.pathname;
      
      // Masquer sur accès-sante
      if (windowPath === '/acces-sante' || windowPath.startsWith('/acces-sante')) {
        setShouldHide(true);
        return;
      }

      // Masquer sur onboarding
      if (windowPath === '/onboarding' || windowPath.startsWith('/onboarding')) {
        setShouldHide(true);
        return;
      }

      // Masquer sur statistique avec patientId
      if (windowPath === '/statistique') {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('patientId')) {
          setShouldHide(true);
          setIsStatisticsWithPatientId(true);
          return;
        }
      }

      setShouldHide(false);
      setIsStatisticsWithPatientId(false);
    }
  }, [pathname]);

  // Vérification immédiate au rendu (pour éviter le flash)
  if (typeof window !== 'undefined') {
    const windowPath = window.location.pathname;
    if (windowPath === '/acces-sante' || windowPath.startsWith('/acces-sante')) {
      return null;
    }
    if (windowPath === '/onboarding' || windowPath.startsWith('/onboarding')) {
      return null;
    }
    if (windowPath === '/statistique') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('patientId')) {
        return null;
      }
    }
  }

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
  // - Page onboarding
  const hideNavigation = (isAuthPage && !user) || isStatisticsWithPatientId || shouldHide || pathname === '/acces-sante' || pathname === '/onboarding';

  if (hideNavigation) {
    return null;
  }

  return <SimpleNav />;
}



