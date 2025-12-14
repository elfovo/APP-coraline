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
