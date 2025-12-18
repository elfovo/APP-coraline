# Configuration Firebase Storage pour les photos de profil

## Problème
Si vous obtenez l'erreur "Missing or insufficient permissions" lors de l'upload d'une photo de profil, vous devez configurer les règles de sécurité Firebase Storage.

## Solution 1 : Via la Console Firebase (Recommandé)

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **Storage**
4. Cliquez sur l'onglet **Règles**
5. Remplacez les règles par défaut par :

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Règles pour les photos de profil
    match /profile-photos/{userId} {
      // Permettre la lecture à tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      
      // Permettre l'écriture uniquement à l'utilisateur propriétaire
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Permettre la suppression uniquement à l'utilisateur propriétaire
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Règles par défaut - refuser tout accès non spécifié
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

6. Cliquez sur **Publier**

## Solution 2 : Via Firebase CLI

Si vous avez Firebase CLI installé :

```bash
firebase deploy --only storage
```

## Vérification

Après avoir configuré les règles, essayez à nouveau d'uploader une photo de profil. L'erreur devrait disparaître.

## Note de sécurité

Ces règles permettent uniquement :
- Aux utilisateurs authentifiés de lire les photos de profil
- À chaque utilisateur d'uploader/modifier/supprimer uniquement sa propre photo de profil
- Aucun accès public aux fichiers



