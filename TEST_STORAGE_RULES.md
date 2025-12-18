# Test des règles Firebase Storage

## Problème actuel

L'authentification fonctionne mais les règles Storage rejettent toujours la requête. Cela peut être dû à :

1. **Les règles ne sont pas vraiment actives** (même si elles semblent publiées)
2. **Un problème de format ou d'ordre des règles**
3. **Un délai de propagation plus long que prévu**

## Solution 1 : Vérifier dans Firebase Console

1. Allez dans **Firebase Console → Storage → Règles**
2. Vérifiez que vous voyez exactement ceci :

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

3. **Important** : Vérifiez qu'il n'y a **AUCUNE autre règle** avant ou après
4. Cliquez sur **"Publier"** même si ça dit déjà publié
5. Attendez 5 minutes (parfois ça prend plus de temps)

## Solution 2 : Test avec règles temporaires plus permissives

Pour tester si le problème vient vraiment des règles, essayez temporairement ces règles (à remettre sécurisées après) :

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId} {
      // Règles temporaires très permissives pour tester
      allow read, write, delete: if request.auth != null;
    }
    
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**⚠️ ATTENTION** : Ces règles permettent à n'importe quel utilisateur authentifié de modifier n'importe quelle photo. Utilisez-les UNIQUEMENT pour tester, puis remettez les règles sécurisées.

Si ça fonctionne avec ces règles, le problème vient de la condition `request.auth.uid == userId`.

## Solution 3 : Vérifier l'ID utilisateur

Dans les logs, vous voyez :
- `Tentative d'upload pour l'utilisateur: hnDOiIWGcaPWPHLyZzohdVz0xoS2`
- `Utilisateur authentifié Firebase: hnDOiIWGcaPWPHLyZzohdVz0xoS2`

Vérifiez dans Firebase Console → Authentication → Users que cet ID existe bien et correspond à votre compte.

## Solution 4 : Vérifier que Storage est bien configuré

1. Allez dans **Firebase Console → Storage**
2. Vérifiez que vous voyez l'onglet "Fichiers" et "Règles"
3. Si vous voyez un message d'erreur ou un avertissement, résolvez-le d'abord

## Solution 5 : Réinitialiser les règles

1. Dans Firebase Console → Storage → Règles
2. Supprimez TOUT le contenu
3. Copiez-collez exactement les règles sécurisées
4. Cliquez sur "Publier"
5. Attendez 5 minutes
6. Testez à nouveau

## Debug supplémentaire

Dans la console du navigateur, après avoir cliqué sur "Publier" dans Firebase Console, vérifiez s'il y a des erreurs réseau supplémentaires ou des messages d'avertissement.



