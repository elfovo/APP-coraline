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

export const shiftDate = (dateISO: string, offset: number): string => {
  const date = new Date(`${dateISO}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

export const formatDateLabel = (dateISO: string): string => {
  if (!dateISO) return '';
  const date = new Date(`${dateISO}T00:00:00`);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
};


