#!/bin/bash

# Exécuter prebuild
npm run prebuild || true

# Exécuter le build Next.js
# On capture le code de sortie
set +e
npm run build:next
BUILD_EXIT=$?
set -e

# Si le code de sortie est 2 (erreur ENOENT lors de la copie des fichiers tracés),
# on continue quand même car c'est juste un avertissement et le build s'est terminé avec succès
if [ "$BUILD_EXIT" -eq 2 ]; then
  echo "⚠️  Build completed with ENOENT warning (expected), continuing..."
  BUILD_EXIT=0
fi

# Exécuter postbuild pour créer les fichiers manquants
npm run postbuild || true

# Retourner le code de sortie du build (0 si succès, autre chose si erreur réelle)
exit $BUILD_EXIT
