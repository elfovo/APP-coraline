/**
 * Utilitaires pour le formatage des dates
 */

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'Non disponible';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
};

export const formatLongDate = (dateString: string): string => {
  const dateObj = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);
};

export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

const createUTCDate = (dateISO: string): Date => {
  const [year, month, day] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
};

export const shiftDate = (dateISO: string, offset: number): string => {
  const date = createUTCDate(dateISO);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().split('T')[0];
};

export const formatDateLabel = (dateISO: string, language: 'fr' | 'en' = 'fr'): string => {
  if (!dateISO) return '';
  const date = new Date(`${dateISO}T00:00:00`);
  const locale = language === 'en' ? 'en-US' : 'fr-FR';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
};







