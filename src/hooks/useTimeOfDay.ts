import { useEffect, useState } from 'react';

export interface TimeOfDayMessage {
  greeting: string;
  heroMessage: string;
}

const DEFAULT_MESSAGE =
  'Centralise tes routines, tes suivis et les ressources utiles pour toi et ton entourage.';

export function useTimeOfDay(user: { displayName?: string | null; email?: string | null } | null) {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    const updateHour = () => setHour(new Date().getHours());
    updateHour();
    const intervalId = setInterval(updateHour, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const getMessage = (): TimeOfDayMessage => {
    if (!user) {
      return {
        greeting: 'Bienvenue',
        heroMessage: 'Connecte-toi pour retrouver ton espace personnel et tes suivis quotidiens.',
      };
    }

    const firstName =
      user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'Bienvenue';

    if (hour === null) {
      return {
        greeting: `Bienvenue ${firstName}`,
        heroMessage: DEFAULT_MESSAGE,
      };
    }

    if (hour < 12) {
      return {
        greeting: `Bonjour ${firstName}`,
        heroMessage:
          'Commence ta matinée en douceur : respiration guidée, routines légères et plan du jour.',
      };
    }

    if (hour < 18) {
      return {
        greeting: `Bon après-midi ${firstName}`,
        heroMessage:
          'Fais le point sur ta progression et ajuste tes activités selon ton niveau d\'énergie.',
      };
    }

    return {
      greeting: `Bonsoir ${firstName}`,
      heroMessage:
        'Prépare ta soirée, capture tes ressentis et assure un réveil plus serein demain.',
    };
  };

  return getMessage();
}



