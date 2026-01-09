import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface TimeOfDayMessage {
  greeting: string;
  heroMessage: string;
}

export function useTimeOfDay(user: { displayName?: string | null; email?: string | null } | null) {
  const [hour, setHour] = useState<number | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const updateHour = () => setHour(new Date().getHours());
    updateHour();
    const intervalId = setInterval(updateHour, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const getMessage = (): TimeOfDayMessage => {
    if (!user) {
      return {
        greeting: t('welcome'),
        heroMessage: t('loginMessage'),
      };
    }

    const firstName =
      user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? t('welcome');

    if (hour === null) {
      return {
        greeting: t('welcomeFirstName', { firstName }),
        heroMessage: t('defaultHeroMessage'),
      };
    }

    if (hour < 12) {
      return {
        greeting: t('goodMorning', { firstName }),
        heroMessage: t('morningMessage'),
      };
    }

    if (hour < 18) {
      return {
        greeting: t('goodAfternoon', { firstName }),
        heroMessage: t('afternoonMessage'),
      };
    }

    return {
      greeting: t('goodEvening', { firstName }),
      heroMessage: t('eveningMessage'),
    };
  };

  return getMessage();
}






