'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import TextType from '@/components/TextType';
import { useRouter } from 'next/navigation';

interface TypingLoadingOverlayProps {
  isLoading?: boolean;
  redirectTo?: string;
  onLoadingComplete?: () => void;
  firstMessage?: string;
  secondMessage?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
}

export default function TypingLoadingOverlay({ 
  isLoading = true,
  redirectTo,
  onLoadingComplete,
  firstMessage = 'Chargement ...',
  secondMessage = 'Fini.',
  typingSpeed = 60,
  deletingSpeed = 40
}: TypingLoadingOverlayProps) {
  const router = useRouter();
  const startTimeRef = useRef<number>(Date.now());
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const secondTimerRef = useRef<NodeJS.Timeout | null>(null);
  const firstTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showSecond, setShowSecond] = useState(false);
  const [canRedirect, setCanRedirect] = useState(false);

  // Réinitialiser quand un nouveau chargement commence
  useEffect(() => {
    const resetTimers = () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (secondTimerRef.current) clearTimeout(secondTimerRef.current);
      if (firstTimerRef.current) clearTimeout(firstTimerRef.current);
    };

    if (isLoading) {
      resetTimers();
      startTimeRef.current = Date.now();
      setShowSecond(false);
      setCanRedirect(false);
    }
    return () => resetTimers();
  }, [isLoading, firstMessage, secondMessage]);

  // Quand le chargement est terminé, supprimer la première phrase puis afficher la deuxième
  useEffect(() => {
    if (!isLoading && !showSecond) {
      firstTimerRef.current = setTimeout(() => {
        setShowSecond(true);
      }, 500);
    }
    return () => {
      if (firstTimerRef.current) clearTimeout(firstTimerRef.current);
    };
  }, [isLoading, showSecond]);

  // Une fois la deuxième phrase affichée, calculer quand elle sera tapée + s'assurer de 2 secondes minimum
  useEffect(() => {
    if (showSecond && !canRedirect) {
      const typingTime = secondMessage.length * typingSpeed + 200 + 1000; // écriture + pause
      const elapsed = Date.now() - startTimeRef.current;
      const minRemaining = Math.max(0, 2000 - elapsed);
      const totalWait = Math.max(typingTime, minRemaining);

      secondTimerRef.current = setTimeout(() => {
        setCanRedirect(true);
      }, totalWait);

      return () => {
        if (secondTimerRef.current) clearTimeout(secondTimerRef.current);
      };
    }
  }, [showSecond, canRedirect, secondMessage.length, typingSpeed]);

  // Rediriger quand on peut
  useEffect(() => {
    if (canRedirect && redirectTo) {
      redirectTimerRef.current = setTimeout(() => {
        router.push(redirectTo);
        onLoadingComplete?.();
      }, 100); // léger tampon

      return () => {
        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      };
    }
  }, [canRedirect, redirectTo, router, onLoadingComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-transparent">
      <div className="text-center space-y-8">
        <AnimatePresence mode="wait">
          {!showSecond ? (
            <motion.div
              key="first"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TextType
                text={isLoading ? [firstMessage] : [firstMessage, '']}
                as="div"
                typingSpeed={typingSpeed}
                initialDelay={200}
                pauseDuration={600}
                deletingSpeed={deletingSpeed}
                variableSpeed={undefined}
                loop={false}
                className="text-2xl md:text-3xl font-medium text-white"
                showCursor={true}
                cursorCharacter="|"
                cursorBlinkDuration={0.6}
                onSentenceComplete={undefined}
              />
            </motion.div>
          ) : (
            <motion.div
              key="second"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TextType
                text={secondMessage}
                as="div"
                typingSpeed={typingSpeed}
                initialDelay={200}
                pauseDuration={1000}
                variableSpeed={undefined}
                loop={false}
                className="text-2xl md:text-3xl font-medium text-white"
                showCursor={true}
                cursorCharacter="|"
                cursorBlinkDuration={0.6}
                onSentenceComplete={undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
