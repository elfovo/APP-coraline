# Stratégie d'Internationalisation (i18n) - Recova

## 🎯 Objectif
Traduire entièrement l'application en français et anglais avec un système robuste et maintenable.

## 📋 Stratégie Recommandée : Système Modulaire avec Namespaces

### Avantages
- ✅ Organisation claire par domaine fonctionnel
- ✅ Maintenance facilitée (un fichier par namespace)
- ✅ Type-safe avec TypeScript
- ✅ Extensible pour d'autres langues
- ✅ Performance optimale (chargement à la demande possible)

---

## 📁 Structure des Fichiers

```
src/lib/i18n/
├── index.ts                    # Point d'entrée, configuration
├── types.ts                     # Types TypeScript
├── locales/
│   ├── fr/
│   │   ├── common.ts           # Textes communs (boutons, labels)
│   │   ├── navigation.ts       # Menu, navigation
│   │   ├── auth.ts             # Login, register, reset password
│   │   ├── journal.ts          # Journal quotidien, formulaire
│   │   ├── symptoms.ts         # Liste des 22 symptômes
│   │   ├── medications.ts     # Médicaments
│   │   ├── activities.ts       # Activités
│   │   ├── statistics.ts       # Statistiques, graphiques
│   │   ├── onboarding.ts       # Onboarding
│   │   ├── profile.ts          # Profil utilisateur
│   │   ├── caregiver.ts        # Accompagnant
│   │   ├── health-access.ts    # Accès santé
│   │   └── errors.ts           # Messages d'erreur
│   └── en/
│       └── [même structure]
```

---

## 🔧 Implémentation Technique

### 1. Système de Context Amélioré

**Fichier : `src/contexts/LanguageContext.tsx`**
- Persister la langue dans localStorage
- Détecter la langue du navigateur au premier chargement
- Synchroniser avec Firestore (préférence utilisateur)

### 2. Helper Functions

**Fichier : `src/lib/i18n/utils.ts`**
- `t(key, params?)` - Traduction avec interpolation
- `formatDate(date, format?)` - Formatage de dates
- `formatNumber(num)` - Formatage de nombres
- `pluralize(key, count)` - Gestion du pluriel

### 3. Types TypeScript

**Fichier : `src/lib/i18n/types.ts`**
- Types générés automatiquement depuis les fichiers de traduction
- Autocomplétion complète dans l'IDE
- Vérification à la compilation

---

## 📝 Exemple de Structure de Traduction

### `locales/fr/journal.ts`
```typescript
export default {
  title: "Journal du",
  subtitle: "Sélectionne les éléments qui te concernent aujourd'hui...",
  sections: {
    symptoms: {
      title: "Symptômes (1-6)",
      description: "Indique l'intensité ressentie pour chaque symptôme (0 = non ressenti).",
      total: "Total du jour : {total}/132"
    },
    medications: {
      title: "Médicaments (1-10)",
      description: "Valide ce que tu as pris et ajuste (0 = aucune prise)."
    },
    // ...
  },
  buttons: {
    save: "Enregistrer la journée",
    saving: "Enregistrement...",
    previous: "Jour précédent",
    next: "Jour suivant"
  }
}
```

### `locales/en/journal.ts`
```typescript
export default {
  title: "Daily Journal",
  subtitle: "Select the items that concern you today...",
  sections: {
    symptoms: {
      title: "Symptoms (1-6)",
      description: "Indicate the intensity felt for each symptom (0 = not felt).",
      total: "Daily total: {total}/132"
    },
    // ...
  }
}
```

---

## 🚀 Plan d'Implémentation Progressif

### Phase 1 : Infrastructure (1-2 jours)
1. ✅ Restructurer `LanguageContext` avec persistance
2. ✅ Créer la structure de dossiers
3. ✅ Mettre en place le système de namespaces
4. ✅ Créer les helpers (formatDate, formatNumber, etc.)

### Phase 2 : Traductions Core (2-3 jours)
1. ✅ Navigation et menu
2. ✅ Authentification (login, register, reset)
3. ✅ Textes communs (boutons, labels, erreurs)
4. ✅ Messages système

### Phase 3 : Journal (3-4 jours)
1. ✅ Formulaire journalier (DailyEntryForm)
2. ✅ 22 symptômes (déjà renommés, maintenant traduire)
3. ✅ Médicaments
4. ✅ Activités et perturbateurs
5. ✅ Messages de succès/erreur

### Phase 4 : Fonctionnalités Avancées (2-3 jours)
1. ✅ Statistiques et graphiques
2. ✅ Onboarding
3. ✅ Profil utilisateur
4. ✅ Accompagnant
5. ✅ Accès santé

### Phase 5 : Finalisation (1 jour)
1. ✅ Vérification complète
2. ✅ Formatage des dates/nombres
3. ✅ Tests de traduction
4. ✅ Documentation

**Total estimé : 9-13 jours**

---

## 💡 Bonnes Pratiques

### 1. Clés de Traduction
- Utiliser des noms descriptifs : `journal.sections.symptoms.title`
- Éviter les abréviations : `sympt` ❌ → `symptoms` ✅
- Grouper par contexte : `journal.*`, `auth.*`, etc.

### 2. Interpolation
```typescript
// ✅ Bon
t('journal.sections.symptoms.total', { total: 45 })

// ❌ Éviter
t('journal.sections.symptoms.total') + ' ' + total
```

### 3. Pluriels
```typescript
// Gérer les pluriels explicitement
t('common.items', { count: 1 }) // "1 élément"
t('common.items', { count: 5 }) // "5 éléments"
```

### 4. Dates et Nombres
```typescript
// Utiliser Intl API avec la langue courante
formatDate(new Date(), 'long') // "15 janvier 2024" ou "January 15, 2024"
formatNumber(1234.56) // "1 234,56" ou "1,234.56"
```

---

## 🔄 Migration Progressive

### Option A : Big Bang (Recommandé pour petite équipe)
- Traduire tout d'un coup
- Plus rapide à implémenter
- Risque de bugs mais plus simple

### Option B : Progressive (Recommandé pour grande équipe)
- Traduire page par page
- Moins de risques
- Plus long mais plus sûr

**Recommandation : Option A** car l'application est déjà bien structurée.

---

## 🛠️ Outils et Helpers

### 1. Script de Vérification
Créer un script pour vérifier que toutes les clés existent dans les deux langues :
```bash
npm run i18n:check
```

### 2. Script d'Extraction
Extraire automatiquement les textes à traduire depuis le code :
```bash
npm run i18n:extract
```

### 3. Composant de Sélection de Langue
Créer un composant `LanguageSwitcher` pour changer la langue facilement.

---

## 📊 Gestion des Données Dynamiques

### Symptômes, Médicaments, Activités
Ces données doivent être traduites mais stockées avec des IDs :
```typescript
// Dans Firestore : toujours stocker l'ID
{ id: 'cephalee', intensity: 3 }

// À l'affichage : traduire le label
t(`symptoms.${symptom.id}`) // "Céphalées" ou "Headaches"
```

### Notes Utilisateur
- Les notes saisies par l'utilisateur restent dans la langue d'origine
- Pas de traduction automatique (trop risqué médicalement)

---

## 🎨 Intégration dans les Composants

### Avant
```tsx
<h1>Journal du {dateLabel}</h1>
<p>Sélectionne les éléments...</p>
```

### Après
```tsx
const { t } = useLanguage();

<h1>{t('journal.title')} {dateLabel}</h1>
<p>{t('journal.subtitle')}</p>
```

---

## 🔐 Persistance de la Langue

### 1. localStorage (Anonyme)
```typescript
localStorage.setItem('app-language', 'fr');
```

### 2. Firestore (Utilisateur connecté)
```typescript
// Dans le profil utilisateur
await updateDoc(doc(db, 'users', userId), {
  language: 'en'
});
```

### 3. Détection Automatique
```typescript
// Au premier chargement
const browserLang = navigator.language.startsWith('en') ? 'en' : 'fr';
```

---

## ✅ Checklist de Validation

- [ ] Tous les textes UI sont traduits
- [ ] Les dates sont formatées selon la langue
- [ ] Les nombres sont formatés selon la locale
- [ ] Les symptômes/médicaments/activités sont traduits
- [ ] Les messages d'erreur sont traduits
- [ ] La langue est persistée (localStorage + Firestore)
- [ ] Le sélecteur de langue fonctionne
- [ ] Les tests passent dans les deux langues
- [ ] Pas de texte en dur restant

---

## 🚨 Points d'Attention

1. **Contenu médical** : Vérifier que les traductions médicales sont correctes
2. **Dates** : Utiliser `Intl.DateTimeFormat` avec la locale
3. **Nombres** : Utiliser `Intl.NumberFormat` avec la locale
4. **Pluriels** : Gérer les règles de pluriel différentes (FR vs EN)
5. **Longueur des textes** : L'anglais peut être plus court, prévoir l'espace UI

---

## 📚 Ressources

- [MDN - Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [Next.js i18n Routing](https://nextjs.org/docs/advanced-features/i18n-routing) (optionnel)
- [react-i18next](https://react.i18next.com/) (alternative si besoin de plus de features)

---

## 🎯 Prochaines Étapes

1. Valider cette stratégie
2. Créer la structure de fichiers
3. Commencer par Phase 1 (Infrastructure)
4. Migrer progressivement les composants
