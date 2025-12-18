'use client';

import { usePathname } from 'next/navigation';
import { motion, useAnimate } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FloatingLines from '@/components/FloatingLines';

const AUTH_PATHS = ['/', '/login', '/register', '/reset-password', '/onboarding'];

export default function AuthAurora() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [scope, animate] = useAnimate();
  const [isVisible, setIsVisible] = useState(false);

  const isAuthPage = pathname
    ? AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    : false;
  // Pour l'onboarding, afficher l'aurora même si l'utilisateur est connecté
  const shouldShowAurora = isAuthPage && (pathname === '/onboarding' || pathname?.startsWith('/onboarding/') || !user);

  useEffect(() => {
    setIsVisible(shouldShowAurora);
  }, [shouldShowAurora]);

  useEffect(() => {
    if (!pathname || !shouldShowAurora) {
      return;
    }

    // Observer les changements de l'attribut data-aurora-visible
    const observer = new MutationObserver(() => {
      if (typeof document !== 'undefined') {
        const visibility = document.body.getAttribute('data-aurora-visible');
        const newVisibility = visibility !== 'false';
        if (newVisibility !== isVisible) {
          setIsVisible(newVisibility);
          animate(scope.current, { opacity: newVisibility ? 1 : 0 }, { duration: 0.8, ease: 'easeInOut' });
        }
      }
    });

    if (typeof document !== 'undefined') {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-aurora-visible'],
      });

      // Initialiser la visibilité
      const visibility = document.body.getAttribute('data-aurora-visible');
      setIsVisible(visibility !== 'false');
    }

    return () => {
      observer.disconnect();
    };
  }, [pathname, shouldShowAurora, isVisible, scope, animate]);

  if (!shouldShowAurora) {
    return null;
  }

  return (
    <motion.div
      ref={scope}
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <FloatingLines
        // Visible mais moins agressif que du blanc pur
        linesGradient={['#ffffff']}
        enabledWaves={['top', 'bottom']}
        lineCount={20}
        lineDistance={0.7}
        // Plus lent
        animationSpeed={0.28}
        // Moins lumineux (réduit l'intensité du shader)
        intensity={0.22}
        interactive={true}
        bendRadius={9}
        bendStrength={0}
        mouseDamping={0.05}
        parallax={true}
        parallaxStrength={0.18}
        // "screen" reste le plus lisible; l'intensité fait le boulot pour la luminosité
        mixBlendMode="screen"
      />
    </motion.div>
  );
}
