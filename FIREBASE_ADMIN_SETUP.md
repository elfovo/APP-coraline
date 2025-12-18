# Configuration Firebase Admin SDK

Pour que la fonctionnalité "Accès Santé Personnelle" fonctionne, il faut configurer Firebase Admin SDK.

## Option 1 : Service Account JSON (Recommandé pour la production)

1. **Télécharger le fichier de service account** :
   - Va dans la [Console Firebase](https://console.firebase.google.com/)
   - Sélectionne ton projet
   - Va dans **Paramètres du projet** (icône d'engrenage) → **Comptes de service**
   - Clique sur **Générer une nouvelle clé privée**
   - Télécharge le fichier JSON

2. **Placer le fichier hors du repo** :
   - Ne le mets **pas** dans `src/` (ni dans Git).
   - Place-le dans un dossier hors-repo, par ex: `~/secrets/firebase-service-account.json`
   - **⚠️ IMPORTANT** : si tu l’as déjà committé par erreur, il peut rester dans l’historique Git → rotate la clé (voir plus bas).

3. **Configurer la variable d'environnement** :
   - Ajoute dans ton `.env.local` :
     ```
     FIREBASE_SERVICE_ACCOUNT_PATH=/chemin/absolu/vers/firebase-service-account.json
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

### Rotation (si la clé a fuité)
Si tu as déjà committé/partagé ce JSON (même brièvement), considère la clé comme compromise :
- Va dans Firebase Console → Comptes de service → Gérer les clés → **révoquer** l’ancienne clé
- Génère une **nouvelle** clé et mets à jour ton chemin dans `.env.local`



