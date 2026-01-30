export interface PatientLookupResult {
  userId: string;
  displayName?: string | null;
  email?: string | null;
  patientId?: number | null;
}

/**
 * Recherche un utilisateur par son ID patient via l'API serveur.
 * Cette fonction appelle une route API Next.js qui utilise Firebase Admin SDK
 * pour contourner les règles de sécurité Firestore.
 */
export async function findUserByPatientId(patientId: string | number): Promise<PatientLookupResult | null> {
  const numericId = Number(patientId);
  if (Number.isNaN(numericId) || numericId <= 0) {
    return null;
  }

  try {
    const response = await fetch(`/api/patient/lookup?patientId=${encodeURIComponent(numericId)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Patient non trouvé
      }
      const errorData = await response.json().catch(() => ({}));
      const errorObj = typeof errorData === 'object' && errorData !== null ? errorData : {};
      // Message utilisateur en priorité, puis détail technique (dev), puis générique
      const userMessage =
        (errorObj as { error?: string }).error ||
        (errorObj as { details?: string }).details ||
        `Erreur HTTP ${response.status}`;
      console.error('[PatientAccess] Erreur API:', response.status, response.statusText, Object.keys(errorObj).length ? errorObj : '(réponse vide ou non-JSON)');
      throw new Error(userMessage);
    }

    const data: PatientLookupResult = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('[PatientAccess] Erreur lors de la recherche:', error);
    throw error;
  }
}

