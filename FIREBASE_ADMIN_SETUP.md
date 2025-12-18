# Configuration Firebase Admin SDK

Pour que la fonctionnalité "Accès Santé Personnelle" fonctionne, il faut configurer Firebase Admin SDK.

## Option 1 : Service Account JSON (Recommandé pour la production)

1. **Télécharger le fichier de service account** :
   - Va dans la [Console Firebase](https://console.firebase.google.com/)
   - Sélectionne ton projet
   - Va dans **Paramètres du projet** (icône d'engrenage) → **Comptes de service**
   - Clique sur **Générer une nouvelle clé privée**
   - Télécharge le fichier JSON

2. **Placer le fichier dans le projet** :
   - Place le fichier JSON dans le dossier `src/lib/` (ex: `src/lib/firebase-service-account.json`)
   - **⚠️ IMPORTANT** : Ajoute ce fichier à `.gitignore` pour ne pas le commiter !

3. **Configurer la variable d'environnement** :
   - Ajoute dans ton `.env.local` :
     ```
     FIREBASE_SERVICE_ACCOUNT_PATH=./src/lib/firebase-service-account.json
     ```

## Option 2 : Variable d'environnement GOOGLE_APPLICATION_CREDENTIALS

1. **Télécharger le fichier de service account** (comme dans l'option 1)

2. **Configurer la variable d'environnement** :
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/chemin/vers/firebase-service-account.json"
   ```

   Ou dans `.env.local` :
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/chemin/absolu/vers/firebase-service-account.json
   ```

## Option 3 : Initialisation par défaut (Développement local uniquement)

Firebase Admin SDK cherche automatiquement les credentials dans :
- `GOOGLE_APPLICATION_CREDENTIALS`
- `~/.config/gcloud/application_default_credentials.json` (si tu as installé gcloud CLI)

Pour le développement local, tu peux installer gcloud CLI et te connecter :
```bash
gcloud auth application-default login
```

## Vérification

Une fois configuré, la route API `/api/patient/lookup` devrait fonctionner sans erreur de permissions.

## Sécurité

- ⚠️ **NE JAMAIS** commiter le fichier de service account dans Git
- ⚠️ **NE JAMAIS** exposer les credentials dans le code client
- ✅ Le fichier de service account doit rester côté serveur uniquement
- ✅ Ajoute `firebase-service-account.json` à `.gitignore`



