const fs = require('fs');
const path = require('path');

// Chemin vers le fichier manquant
const manifestPath = path.join(process.cwd(), '.next/server/app/(auth)/page_client-reference-manifest.js');

// Créer le répertoire s'il n'existe pas
const dir = path.dirname(manifestPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Créer un fichier manifest vide si il n'existe pas
if (!fs.existsSync(manifestPath)) {
  fs.writeFileSync(manifestPath, '{}', 'utf8');
  console.log('✅ Created missing client-reference-manifest.js for (auth)/page');
}
