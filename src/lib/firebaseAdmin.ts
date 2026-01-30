import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

/**
 * Initialise Firebase Admin SDK pour usage côté serveur.
 * Utilise les variables d'environnement pour la configuration.
 */
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // Vérifier si une app existe déjà
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID n\'est pas défini dans les variables d\'environnement');
  }

  // Option 0 (recommandée en prod / Netlify): credentials via variable d'environnement
  // - FIREBASE_SERVICE_ACCOUNT_JSON: JSON complet (string)
  // - FIREBASE_SERVICE_ACCOUNT_BASE64: JSON complet encodé en base64
  const serviceAccountJsonFromEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      : null);

  if (serviceAccountJsonFromEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonFromEnv);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      console.log('[Firebase Admin] ✅ Initialisation via env (service account JSON) réussie!');
      return adminApp;
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string } | null;
      console.error('[Firebase Admin] ❌ Erreur parsing FIREBASE_SERVICE_ACCOUNT_*:', err?.message || error);
      if (err?.stack) {
        console.error('[Firebase Admin] Stack:', err.stack);
      }
      // On continue sur les autres options (path / ADC) si parsing échoue
    }
  }

  // Option 1: Utiliser les credentials JSON si disponibles (chemin relatif ou absolu)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    try {
      // Essayer plusieurs chemins possibles
      const possiblePaths = [
        // Chemin absolu tel quel
        path.isAbsolute(serviceAccountPath) ? serviceAccountPath : null,
        // Chemin relatif depuis process.cwd()
        path.join(process.cwd(), serviceAccountPath),
        // Chemin relatif depuis __dirname (si disponible)
        typeof __dirname !== 'undefined' ? path.join(__dirname, '..', serviceAccountPath) : null,
        // Chemin direct si c'est déjà un chemin valide
        serviceAccountPath,
      ].filter((p): p is string => p !== null);

      let fullPath: string | null = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          fullPath = testPath;
          break;
        }
      }

      if (fullPath) {
        console.log('[Firebase Admin] Chargement du service account depuis:', fullPath);
        const serviceAccountJson = fs.readFileSync(fullPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
        console.log('[Firebase Admin] ✅ Initialisation réussie!');
        return adminApp;
      } else {
        console.error('[Firebase Admin] ❌ Fichier de service account introuvable');
        console.error('[Firebase Admin] Chemins testés:', possiblePaths);
        console.error('[Firebase Admin] Répertoire courant:', process.cwd());
        console.error('[Firebase Admin] 💡 Crée le fichier à cet emplacement ou utilise FIREBASE_SERVICE_ACCOUNT_JSON dans .env.local (JSON sur une ligne).');
      }
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string } | null;
      console.error('[Firebase Admin] ❌ Erreur lors du chargement:', err?.message || error);
      if (err?.stack) {
        console.error('[Firebase Admin] Stack:', err.stack);
      }
    }
  } else {
    console.warn('[Firebase Admin] ⚠️ FIREBASE_SERVICE_ACCOUNT_PATH non défini');
  }

  // Option 2: Utiliser GOOGLE_APPLICATION_CREDENTIALS (variable d'environnement système)
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (googleAppCreds && fs.existsSync(googleAppCreds)) {
    try {
      const serviceAccountJson = fs.readFileSync(googleAppCreds, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      return adminApp;
    } catch (error) {
      console.error('[Firebase Admin] Erreur lors du chargement via GOOGLE_APPLICATION_CREDENTIALS:', error);
    }
  }

  // Option 3: Initialisation par défaut (cherche dans ~/.config/gcloud/)
  try {
    adminApp = initializeApp({
      projectId,
    });
    return adminApp;
  } catch (error: unknown) {
    const err = error as { message?: string } | null;
    console.error('[Firebase Admin] Erreur lors de l\'initialisation:', err?.message || error);
    throw new Error(
      'Impossible d\'initialiser Firebase Admin. ' +
      'Configure FIREBASE_SERVICE_ACCOUNT_JSON (recommandé), FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT_PATH ou GOOGLE_APPLICATION_CREDENTIALS. ' +
      'Voir FIREBASE_ADMIN_SETUP.md pour plus d\'informations.'
    );
  }
}

/**
 * Obtient l'instance Firestore Admin (avec accès complet, contourne les règles de sécurité)
 */
export function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }

  const app = getAdminApp();
  adminDb = getFirestore(app);
  return adminDb;
}

