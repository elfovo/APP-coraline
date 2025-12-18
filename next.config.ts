import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // IMPORTANT: on évite les chemins absolus hardcodés (spécifiques à une machine),
  // mais on fixe quand même une racine de tracing stable (répertoire courant du projet)
  // pour éviter des comportements bizarres quand Next détecte plusieurs lockfiles.
  outputFileTracingRoot: process.cwd(),
  // output: 'export', // Désactivé pour permettre les routes API
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
