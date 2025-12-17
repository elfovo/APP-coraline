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

/**
 * Déplace une date ISO d'un certain nombre de jours
 */
export function shiftDate(isoDate: string, deltaDays: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().split('T')[0];
}

/**
 * Formate une date ISO en label français
 */
export function formatDateLabel(dateISO: string): string {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatter.format(new Date(`${dateISO}T00:00:00`));
}

/**
 * Obtient la date ISO d'aujourd'hui
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

