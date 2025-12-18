import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Fonction pour obtenir la configuration Firebase
function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
  };

  const missingKeys = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (typeof window !== 'undefined') {
    console.log(
      '[Firebase] Chargement des variables:',
      missingKeys.length === 0 ? 'OK' : `Manquantes: ${missingKeys.join(', ')}`
    );
  }

  return config;
}

// Initialiser Firebase (éviter les doubles initialisations)
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

function initializeFirebase() {
  if (typeof window === 'undefined') {
    return; // Ne rien faire côté serveur
  }

  try {
    if (!app) {
      if (getApps().length === 0) {
        const firebaseConfig = getFirebaseConfig();
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }
    }

    if (!authInstance && app) {
      authInstance = getAuth(app);
    }
    if (!dbInstance && app) {
      dbInstance = getFirestore(app);
    }
    if (!storageInstance && app) {
      storageInstance = getStorage(app);
    }
  } catch (error) {
    console.error('[Firebase] Erreur lors de l\'initialisation:', error);
  }
}

// Services Firebase (initialisation lazy)
export function getAuthInstance(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth ne peut être utilisé que côté client');
  }
  if (!authInstance) {
    initializeFirebase();
  }
  if (!authInstance) {
    throw new Error('Firebase Auth n\'a pas pu être initialisé');
  }
  return authInstance;
}

export function getDbInstance(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error('Firestore ne peut être utilisé que côté client');
  }
  if (!dbInstance) {
    initializeFirebase();
  }
  if (!dbInstance) {
    throw new Error('Firestore n\'a pas pu être initialisé');
  }
  return dbInstance;
}

export function getStorageInstance(): FirebaseStorage {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Storage ne peut être utilisé que côté client');
  }
  if (!storageInstance) {
    initializeFirebase();
  }
  if (!storageInstance) {
    throw new Error('Firebase Storage n\'a pas pu être initialisé');
  }
  return storageInstance;
}

// Exports avec getters pour initialisation lazy
const authObj = {} as Auth;
const dbObj = {} as Firestore;
const storageObj = {} as FirebaseStorage;

// Créer des proxies qui délèguent toutes les propriétés
export const auth = new Proxy(authObj, {
  get(_target, prop) {
    const instance = getAuthInstance();
    const value = (instance as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
  set(_target, prop, value) {
    const instance = getAuthInstance();
    (instance as unknown as Record<PropertyKey, unknown>)[prop] = value;
    return true;
  },
}) as Auth;

export const db = new Proxy(dbObj, {
  get(_target, prop) {
    const instance = getDbInstance();
    const value = (instance as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
  set(_target, prop, value) {
    const instance = getDbInstance();
    (instance as unknown as Record<PropertyKey, unknown>)[prop] = value;
    return true;
  },
}) as Firestore;

export const storage = new Proxy(storageObj, {
  get(_target, prop) {
    const instance = getStorageInstance();
    const value = (instance as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
  set(_target, prop, value) {
    const instance = getStorageInstance();
    (instance as unknown as Record<PropertyKey, unknown>)[prop] = value;
    return true;
  },
}) as FirebaseStorage;

// Export de l'app pour utilisation avancée si nécessaire
export default function getApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase App ne peut être utilisé que côté client');
  }
  if (!app) {
    initializeFirebase();
  }
  if (!app) {
    throw new Error('Firebase App n\'a pas pu être initialisé');
  }
  return app;
}
