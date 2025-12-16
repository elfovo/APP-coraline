# 🔍 Vérification des règles Firebase Storage

## ⚠️ Erreur : "Missing or insufficient permissions"

Si vous voyez cette erreur, suivez ces étapes **dans l'ordre** :

---

## ✅ Étape 1 : Vérifier que Storage est activé

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **coco-app-c0820**
3. Dans le menu de gauche, cherchez **Storage**
4. Si vous voyez un bouton "Commencer" ou "Get started", **cliquez dessus** et activez Storage
5. Choisissez l'emplacement (région) le plus proche de vous
6. Cliquez sur "Terminé"

---

## ✅ Étape 2 : Vérifier les règles Storage

1. Toujours dans Firebase Console → **Storage**
2. Cliquez sur l'onglet **"Règles"** (en haut, à côté de "Fichiers")
3. **Copiez-collez EXACTEMENT** ces règles :

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

4. **IMPORTANT** : Cliquez sur le bouton **"Publier"** (en haut à droite, bouton bleu)
5. Attendez de voir le message "Règles publiées avec succès"

---

## ✅ Étape 3 : Vérifier que les règles sont bien publiées

1. Après avoir cliqué sur "Publier", vous devriez voir :
   - Un message de confirmation
   - La date/heure de publication en haut de l'éditeur
   - Un indicateur "Règles publiées"

2. Si vous ne voyez pas ces éléments, **les règles ne sont pas publiées** → Recommencez l'étape 2

---

## ✅ Étape 4 : Attendre la propagation

1. **Attendez 2-3 minutes** après avoir publié les règles
2. Les règles peuvent prendre quelques instants pour se propager sur tous les serveurs Firebase

---

## ✅ Étape 5 : Tester dans l'application

1. **Fermez complètement votre navigateur** (pas juste l'onglet)
2. **Rouvrez votre navigateur**
3. Allez sur `http://localhost:3000`
4. **Déconnectez-vous** de l'application
5. **Reconnectez-vous**
6. Essayez à nouveau d'uploader une photo de profil

---

## 🔍 Vérification supplémentaire

### Vérifier l'ID utilisateur

Dans la console du navigateur (F12), vérifiez que :
- Vous êtes bien connecté
- L'ID utilisateur correspond à celui dans l'URL de l'erreur

L'erreur montre : `profile-photos/hnDOiIWGcaPWPHLyZzohdVz0xoS2`

Vérifiez que cet ID correspond bien à votre ID utilisateur Firebase.

---

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez dans Firebase Console → Storage → Règles** :
   - Les règles sont-elles exactement comme ci-dessus ?
   - Y a-t-il un message "Règles publiées" avec une date récente ?

2. **Vérifiez l'authentification** :
   - Êtes-vous bien connecté dans l'application ?
   - L'ID utilisateur dans l'URL correspond-il à votre ID Firebase ?

3. **Essayez en mode privé/incognito** :
   - Ouvrez une fenêtre de navigation privée
   - Connectez-vous à l'application
   - Essayez d'uploader une photo

4. **Vérifiez les règles par défaut** :
   - Si vous avez des règles par défaut qui bloquent tout, elles doivent être en dernier
   - La règle `match /{allPaths=**} { allow read, write: if false; }` doit être la dernière

---

## 📝 Règles complètes à copier

Voici les règles complètes à copier-coller dans Firebase Console → Storage → Règles :

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

**N'oubliez pas de cliquer sur "Publier" après avoir collé les règles !**

