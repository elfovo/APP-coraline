import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { getDbInstance } from './firebase';
import type { DailyEntry, WeeklyTotals } from '@/types/journal';

const ENTRIES_SUBCOLLECTION = 'entries';
const CAREGIVER_CODES_COLLECTION = 'caregiverCodes';
const CAREGIVER_OBSERVATIONS_SUBCOLLECTION = 'caregiverObservations';
const ENTOURAGE_COMMENTS_SUBCOLLECTION = 'entourageComments';

const formatTimestamp = (date: Date) => Timestamp.fromDate(date);

const getDb = () => getDbInstance();

const entriesCollection = (userId: string) =>
  collection(getDb(), 'users', userId, ENTRIES_SUBCOLLECTION);

const caregiverCodeDocument = (userId: string) =>
  doc(getDb(), 'users', userId, CAREGIVER_CODES_COLLECTION, 'current');

const caregiverCodeLookupDoc = (code: string) =>
  doc(getDb(), CAREGIVER_CODES_COLLECTION, code);

const caregiverObservationsCollection = (userId: string) =>
  collection(getDb(), 'users', userId, CAREGIVER_OBSERVATIONS_SUBCOLLECTION);

const entourageCommentsCollection = (userId: string) =>
  collection(getDb(), 'users', userId, ENTOURAGE_COMMENTS_SUBCOLLECTION);

const journalPreferencesDocument = (userId: string) =>
  doc(getDb(), 'users', userId, 'preferences', 'journal');

export interface JournalPreferences {
  hiddenSliders: {
    symptomes: string[];
    medicaments: string[];
  };
  hiddenActivities: {
    activites: string[];
    activitesDouces: string[];
  };
  hiddenPerturbateurs: string[];
  customActivities?: { id: string; label: string; duration: number }[];
  customGentleActivities?: { id: string; label: string; duration: number }[];
  customPerturbateurs?: string[];
}

export function listenRecentEntries(
  userId: string,
  maxEntries = 7,
  callback: (entries: DailyEntry[]) => void,
) {
  const q = query(
    entriesCollection(userId),
    orderBy('dateISO', 'desc'),
    limit(maxEntries),
  );
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((docSnap) => docSnap.data() as DailyEntry);
    const sorted = docs.sort((a, b) => (a.dateISO > b.dateISO ? -1 : 1));
    callback(sorted);
  });
}

export async function fetchEntriesBetween(
  userId: string,
  startISO: string,
  endISO: string,
): Promise<DailyEntry[]> {
  const q = query(
    entriesCollection(userId),
    where('dateISO', '>=', startISO),
    where('dateISO', '<=', endISO),
    orderBy('dateISO', 'asc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data() as DailyEntry);
}

export async function fetchDailyEntry(
  userId: string,
  dateISO: string,
): Promise<DailyEntry | null> {
  const ref = doc(entriesCollection(userId), dateISO);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? ((snapshot.data() as DailyEntry) ?? null) : null;
}

export async function saveDailyEntry(userId: string, entry: DailyEntry) {
  const ref = doc(entriesCollection(userId), entry.dateISO);
  await setDoc(ref, entry, { merge: true });
}

export async function deleteAllEntries(userId: string) {
  const snapshot = await getDocs(entriesCollection(userId));
  const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
  await Promise.all(deletePromises);
}

export function computeWeeklyTotals(entries: DailyEntry[]): WeeklyTotals {
  return entries.reduce(
    (acc, entry) => ({
      symptoms:
        acc.symptoms +
        entry.symptoms.reduce((sum, item) => sum + item.intensity, 0),
      medications:
        acc.medications +
        entry.medications.reduce((sum, item) => sum + item.intensity, 0),
      activities:
        acc.activities +
        entry.activities.reduce((sum, item) => sum + item.duration, 0),
      perturbateurs: acc.perturbateurs + entry.perturbateurs.length,
    }),
    { symptoms: 0, medications: 0, activities: 0, perturbateurs: 0 },
  );
}

export async function getActiveCaregiverCode(userId: string) {
  const ref = caregiverCodeDocument(userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const expiresAt: Timestamp | undefined = data?.expiresAt;
  if (!expiresAt || expiresAt.toMillis() < Date.now()) {
    await deleteDoc(ref).catch(() => {});
    return null;
  }
  return {
    code: data.code as string,
    expiresAt: expiresAt.toDate(),
  };
}

export async function generateCaregiverCode(userId: string) {
  const existing = await getActiveCaregiverCode(userId);
  if (existing) {
    return existing;
  }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const payload = {
    code,
    userId,
    createdAt: serverTimestamp(),
    expiresAt: formatTimestamp(expiresAt),
  };

  await setDoc(caregiverCodeDocument(userId), payload);
  await setDoc(caregiverCodeLookupDoc(code), payload);

  return { code, expiresAt };
}

export async function verifyCaregiverCode(code: string) {
  const ref = caregiverCodeLookupDoc(code);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error('Code invalide');
  }
  const data = snapshot.data();
  const expiresAt = (data.expiresAt as Timestamp).toMillis();
  if (expiresAt < Date.now()) {
    await deleteDoc(ref).catch(() => {});
    throw new Error('Code expiré');
  }
  return data.userId as string;
}

interface CaregiverObservationPayload {
  ratings: Record<string, number>;
  energyLevel: number;
  notes?: string;
}

export async function saveCaregiverObservation(
  code: string,
  payload: CaregiverObservationPayload,
) {
  const userId = await verifyCaregiverCode(code);
  await addDoc(caregiverObservationsCollection(userId), {
    ...payload,
    code,
    createdAt: serverTimestamp(),
  });
}

export interface EntourageCommentItem {
  dateISO: string;
  comment: string;
}

/** Récupère tous les commentaires de l'entourage pour un utilisateur (patient). */
export async function fetchEntourageComments(
  userId: string,
): Promise<EntourageCommentItem[]> {
  const snapshot = await getDocs(entourageCommentsCollection(userId));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      dateISO: docSnap.id,
      comment: typeof data?.comment === 'string' ? data.comment : '',
    };
  });
}

export async function saveJournalPreferences(
  userId: string,
  preferences: JournalPreferences,
) {
  const ref = journalPreferencesDocument(userId);
  await setDoc(ref, preferences, { merge: true });
}

export async function loadJournalPreferences(
  userId: string,
): Promise<JournalPreferences | null> {
  const ref = journalPreferencesDocument(userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as JournalPreferences;
}

/**
 * Génère le prochain ID patient de manière atomique
 * Utilise une transaction Firestore pour garantir l'unicité et la séquentialité
 */
export async function generateNextPatientId(): Promise<number> {
  const db = getDbInstance();
  const counterRef = doc(db, '_metadata', 'patientCounter');

  try {
    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextId: number;
      if (!counterDoc.exists()) {
        // Premier compte : initialiser à 1
        nextId = 1;
        transaction.set(counterRef, { lastId: nextId });
      } else {
        // Incrémenter le dernier ID
        const data = counterDoc.data();
        nextId = (data.lastId ?? 0) + 1;
        transaction.update(counterRef, { lastId: nextId });
      }
      
      return nextId;
    });
  } catch (error: unknown) {
    console.error('Erreur lors de la génération de l\'ID patient:', error);
    
    // Message d'erreur plus détaillé
    const err = error as { code?: string; message?: string } | null;
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      throw new Error('Permissions insuffisantes. Vérifiez que les règles Firestore pour _metadata/patientCounter sont publiées dans Firebase Console.');
    }
    
    throw new Error(`Impossible de générer l'ID patient: ${err?.message || 'Erreur inconnue'}`);
  }
}

/**
 * Initialise le document utilisateur avec l'ID patient
 * À appeler lors de la création d'un nouveau compte
 */
export async function initializeUserDocument(userId: string, patientId: number) {
  const db = getDbInstance();
  const userRef = doc(db, 'users', userId);
  
  // Vérifier si le document existe déjà
  const userDoc = await getDoc(userRef);
  if (userDoc.exists() && userDoc.data().patientId) {
    // L'utilisateur a déjà un ID patient, ne pas le modifier
    return userDoc.data().patientId as number;
  }
  
  // Créer ou mettre à jour le document avec l'ID patient
  await setDoc(userRef, { patientId }, { merge: true });
  return patientId;
}

/**
 * Récupère l'ID patient d'un utilisateur
 */
export async function getPatientId(userId: string): Promise<number | null> {
  const db = getDbInstance();
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return userDoc.data().patientId ?? null;
}

/**
 * Supprime toutes les données utilisateur dans Firestore
 */
export async function deleteUserData(userId: string) {
  const db = getDbInstance();
  
  // Supprimer toutes les entrées du journal
  const entriesRef = entriesCollection(userId);
  const entriesSnapshot = await getDocs(entriesRef);
  const deleteEntriesPromises = entriesSnapshot.docs.map((docSnap) =>
    deleteDoc(docSnap.ref)
  );
  await Promise.all(deleteEntriesPromises);

  // Supprimer les codes accompagnants
  const caregiverCodeRef = caregiverCodeDocument(userId);
  const caregiverCodeSnap = await getDoc(caregiverCodeRef);
  if (caregiverCodeSnap.exists()) {
    const codeData = caregiverCodeSnap.data();
    const code = codeData?.code as string | undefined;
    
    // Supprimer le document utilisateur
    await deleteDoc(caregiverCodeRef);
    
    // Supprimer le lookup si le code existe
    if (code) {
      const lookupRef = caregiverCodeLookupDoc(code);
      await deleteDoc(lookupRef).catch(() => {
        // Ignorer si déjà supprimé
      });
    }
  }

  // Supprimer toutes les observations des accompagnants
  const observationsRef = caregiverObservationsCollection(userId);
  const observationsSnapshot = await getDocs(observationsRef);
  const deleteObservationsPromises = observationsSnapshot.docs.map((docSnap) =>
    deleteDoc(docSnap.ref)
  );
  await Promise.all(deleteObservationsPromises);

  // Supprimer le document utilisateur principal (si existe)
  const userDocRef = doc(db, 'users', userId);
  await deleteDoc(userDocRef).catch(() => {
    // Ignorer si le document n'existe pas
  });
}

