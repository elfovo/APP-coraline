# 🚀 Configuration rapide - Accès Santé Personnelle

## ⚡ Ce qu'il faut faire (5 minutes)

Pour que la fonctionnalité "Accès Santé Personnelle" fonctionne, tu dois configurer Firebase Admin SDK.

### Étape 1 : Télécharger le fichier de service account

1. Va sur [Console Firebase](https://console.firebase.google.com/)
2. Sélectionne ton projet **coco-app-c0820**
3. Clique sur l'icône ⚙️ **Paramètres du projet** (en haut à gauche)
4. Va dans l'onglet **Comptes de service**
5. Clique sur **Générer une nouvelle clé privée**
6. Un fichier JSON se télécharge (ex: `coco-app-c0820-firebase-adminsdk-xxxxx.json`)

### Étape 2 : Placer le fichier hors du repo

1. Renomme le fichier en `firebase-service-account.json`
2. Ne le mets **pas** dans `src/` (ni dans Git). Place-le plutôt dans un dossier hors-repo, par ex:
   - `~/secrets/firebase-service-account.json`

### Étape 3 : Configurer la variable d'environnement

1. Crée ou modifie le fichier `.env.local` à la racine du projet
2. Ajoute cette ligne :
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=/chemin/absolu/vers/firebase-service-account.json
   ```

### Étape 4 : Redémarrer le serveur de développement

```bash
# Arrête le serveur (Ctrl+C) puis relance :
npm run dev
```

## ✅ Vérification

Une fois configuré, teste la fonctionnalité :
1. Va sur la page d'accueil (non connecté)
2. Clique sur "Professionnel de santé"
3. Entre un ID patient valide
4. Ça devrait fonctionner sans erreur de permissions !

## ⚠️ Important

- **NE COMMITE JAMAIS** le fichier `firebase-service-account.json` dans Git
- Même s’il est dans `.gitignore`, une fuite peut arriver (copie, commit passé, partage) → rotate la clé si tu as un doute
- Ce fichier contient des credentials sensibles, garde-le hors-repo

## 🆘 Problème ?

Si tu as une erreur, vérifie :
- ✅ Le fichier JSON existe bien à l’emplacement indiqué par `FIREBASE_SERVICE_ACCOUNT_PATH`
- ✅ La variable `FIREBASE_SERVICE_ACCOUNT_PATH` est dans `.env.local`
- ✅ Tu as redémarré le serveur après avoir ajouté la variable
- ✅ Le `projectId` dans le JSON correspond à `NEXT_PUBLIC_FIREBASE_PROJECT_ID`



