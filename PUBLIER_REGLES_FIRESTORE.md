# 🔥 Publier les règles Firestore pour l'ID patient

## Problème
Si vous obtenez l'erreur "Missing or insufficient permissions" lors de la création d'un ID patient, c'est que les règles Firestore ne sont pas encore publiées dans Firebase Console.

## Solution : Publier les règles Firestore

### Étape 1 : Aller dans Firebase Console
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet (`coco-app-c0820`)
3. Dans le menu de gauche, cliquez sur **Firestore Database**
4. Cliquez sur l'onglet **Règles**

### Étape 2 : Copier les règles
Copiez-collez **EXACTEMENT** ces règles dans l'éditeur :

```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règle pour le document utilisateur (pour stocker la photo de profil)
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
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
      allow create: if true; // ou mieux : condition sur le code temporaire
    }
    
    // Règle pour le compteur d'ID patient (utilisé lors de la création de compte)
    match /_metadata/patientCounter {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Étape 3 : Publier
1. Cliquez sur le bouton **Publier** (en haut à droite)
2. Attendez 1-2 minutes que les règles soient propagées
3. Réessayez de créer un ID patient dans la page profil

## Vérification
Après avoir publié les règles, vous devriez pouvoir créer un ID patient sans erreur de permissions.

## Note importante
⚠️ La règle pour `_metadata/patientCounter` permet à **tous les utilisateurs authentifiés** de lire et écrire ce document. C'est nécessaire pour que chaque utilisateur puisse générer son propre ID patient de manière séquentielle.






