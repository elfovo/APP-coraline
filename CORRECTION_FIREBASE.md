# 🔧 Correction des erreurs Firebase

## Problèmes identifiés

1. **Erreur Firestore** : `Missing or insufficient permissions` lors du chargement de la photo
2. **Erreur Storage** : `Missing or insufficient permissions` + CORS lors de l'upload

## ✅ Solution complète

### Étape 1 : Vérifier et corriger les règles Firestore

Allez dans **Firebase Console → Firestore Database → Règles** et assurez-vous que vos règles sont **EXACTEMENT** dans cet ordre :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ IMPORTANT : Cette règle DOIT être en premier
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Les règles plus spécifiques viennent après
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

**⚠️ Points critiques :**
- La règle `match /users/{userId}` DOIT être en premier (avant les sous-collections)
- Cliquez sur **"Publier"** (pas juste sauvegarder)
- Attendez 2-3 minutes après publication

### Étape 2 : Vérifier et corriger les règles Storage

Allez dans **Firebase Console → Storage → Règles** et copiez-collez EXACTEMENT :

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**⚠️ Points critiques :**
- Vérifiez qu'il n'y a AUCUNE autre règle
- Cliquez sur **"Publier"**
- Attendez 2-3 minutes

### Étape 3 : Vérification dans Firebase Console

Pour **Firestore** :
1. Firebase Console → Firestore Database → Règles
2. Vérifiez que vous voyez "Règles publiées" avec une date récente
3. Vérifiez qu'il n'y a pas d'icône d'erreur rouge

Pour **Storage** :
1. Firebase Console → Storage → Règles
2. Vérifiez que vous voyez "Règles publiées" avec une date récente
3. Vérifiez qu'il n'y a pas d'icône d'erreur rouge

### Étape 4 : Test dans l'application

1. **Fermez complètement votre navigateur**
2. **Rouvrez-le**
3. Allez sur `http://localhost:3000`
4. **Déconnectez-vous** de l'application
5. **Reconnectez-vous**
6. Allez sur la page profil
7. Essayez d'uploader une photo

## 🔍 Si ça ne fonctionne toujours pas

### Vérifier l'ID utilisateur

Dans la console du navigateur (F12), vérifiez que :
- L'ID utilisateur dans les logs correspond à votre ID Firebase
- Vous pouvez le vérifier dans Firebase Console → Authentication → Users

### Test avec règles temporaires

Pour Storage, testez temporairement avec des règles très permissives :

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId} {
      // TEMPORAIRE - pour tester uniquement
      allow read, write, delete: if request.auth != null;
    }
    
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Si ça fonctionne avec ces règles, le problème vient de la condition `request.auth.uid == userId`.

### Vérifier l'authentification

Dans la console du navigateur, vérifiez :
- `Tentative d'upload pour l'utilisateur: [votre-uid]`
- `Utilisateur authentifié Firebase: [votre-uid]`

Ces deux IDs doivent être identiques.

## 📝 Checklist finale

- [ ] Règles Firestore publiées avec `match /users/{userId}` en premier
- [ ] Règles Storage publiées
- [ ] Attendu 2-3 minutes après publication
- [ ] Navigateur complètement fermé et rouvert
- [ ] Déconnecté et reconnecté à l'application
- [ ] ID utilisateur correspond dans les logs

