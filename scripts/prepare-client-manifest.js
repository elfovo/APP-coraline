const fs = require('fs');
const path = require('path');

// Créer le fichier manifest AVANT le build Next.js
// Ce fichier sera nécessaire pendant "Collecting build traces"
const manifestPath = path.join(process.cwd(), '.next/server/app/(auth)/page_client-reference-manifest.js');

// Créer le répertoire complet s'il n'existe pas
const dir = path.dirname(manifestPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`✅ Created directory: ${dir}`);
}

// Créer un fichier manifest vide si il n'existe pas
if (!fs.existsSync(manifestPath)) {
  fs.writeFileSync(manifestPath, '{}', 'utf8');
  console.log(`✅ Created missing client-reference-manifest.js at ${manifestPath}`);
} else {
  console.log(`ℹ️  client-reference-manifest.js already exists at ${manifestPath}`);
}
