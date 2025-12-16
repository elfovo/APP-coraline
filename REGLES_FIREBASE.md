# Configuration des règles Firebase

## ⚠️ IMPORTANT : Erreur CORS

Si vous obtenez une erreur CORS (`Access to XMLHttpRequest... has been blocked by CORS policy`), c'est que les règles Firebase Storage ne sont **pas encore configurées** ou sont incorrectes.

**Les règles Storage sont OBLIGATOIRES** pour que l'upload fonctionne.

---

## 🔥 Firestore Rules

### Étape 1 : Ajouter la règle pour les photos de profil

Allez dans **Firebase Console → Firestore Database → Règles** et ajoutez cette règle en haut de vos règles existantes :

```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⬇️ AJOUTEZ CETTE RÈGLE (pour stocker la photo de profil)
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Vos règles existantes...
    match /users/{userId}/entries/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/caregiverCodes/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /caregiverCodes/{code} {
      allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /users/{userId}/caregiverObservations/{docId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if true;
    }
  }
}
```

Cliquez sur **Publier**.

---

## 📦 Storage Rules (CRITIQUE - Résout l'erreur CORS)

### Étape 2 : Configurer les règles Storage

1. Allez dans **Firebase Console → Storage**
2. Si Storage n'est pas encore activé, cliquez sur **Commencer**
3. Cliquez sur l'onglet **Règles**
4. **Remplacez TOUT le contenu** par :

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

5. Cliquez sur **Publier**

### ⚠️ Si vous avez déjà des règles Storage

Si vous avez déjà des règles Storage, ajoutez juste cette partie :

```javascript
match /profile-photos/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

---

## ✅ Vérification

Après avoir publié les deux ensembles de règles :

1. **Rafraîchissez votre navigateur** (Ctrl+F5 ou Cmd+Shift+R)
2. **Déconnectez-vous et reconnectez-vous** à l'application
3. Essayez à nouveau d'uploader une photo de profil

L'erreur CORS devrait disparaître et l'upload devrait fonctionner.

---

## 🔍 Dépannage

### L'erreur persiste après avoir configuré les règles ?

1. Vérifiez que vous avez bien cliqué sur **Publier** (pas juste sauvegardé)
2. Attendez 1-2 minutes pour que les règles se propagent
3. Vérifiez que vous êtes bien connecté dans l'application
4. Vérifiez dans la console Firebase que les règles sont bien publiées
5. Videz le cache du navigateur et reconnectez-vous

### Comment vérifier que les règles sont actives ?

Dans Firebase Console → Storage → Règles, vous devriez voir un indicateur "Règles publiées" avec la date/heure de publication.

