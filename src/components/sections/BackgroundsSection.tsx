'use client';

import { Aurora, DotGrid, Galaxy, Orb, Squares, Threads } from '@/components/backgrounds';
import SectionWrapper from '@/components/SectionWrapper';

export default function BackgroundsSection() {
  const backgroundDemos = [
    {
      id: 'threads',
      name: 'Threads',
      description: 'Effet de fils animés avec WebGL',
      component: (
        <Threads
          color={[1.0, 1.0, 1.0]}
          amplitude={1}
          distance={1.2}
          enableMouseInteraction={false}
          style={{ width: '100%', height: '100%' }}
        />
      )
    },
    {
      id: 'orb',
      name: 'Orb',
      description: 'Sphère énergétique interactive avec WebGL',
      component: (
        <Orb
          hue={0}
          hoverIntensity={0.3}
          rotateOnHover={true}
          forceHoverState={false}
        />
      )
    },
    {
      id: 'dotgrid',
      name: 'DotGrid',
      description: 'Grille de points interactive avec animations',
      component: (
        <DotGrid
          dotSize={2}
          gap={16}
          baseColor="#374151"
          activeColor="#ffffff"
          proximity={120}
          speedTrigger={80}
          shockRadius={250}
          shockStrength={16}
          maxSpeed={3000}
          resistance={750}
          returnDuration={1.5}
          style={{ width: '100%', height: '100%' }}
        />
      )
    },
    {
      id: 'squares',
      name: 'Squares',
      description: 'Grille de carrés animée avec interaction souris',
      component: (
        <Squares
          direction="diagonal"
          speed={0.1}
          borderColor="#0e041f"
          squareSize={22}
          hoverFillColor="#0e041f"
        />
      )
    },
    {
      id: 'aurora',
      name: 'Aurora',
      description: 'Effet d\'aurore boréale avec WebGL',
      component: (
        <Aurora
          color={[0.5, 0.5, 1.0]}
          speed={0.1}
          intensity={1.0}
          style={{ width: '100%', height: '100%' }}
        />
      )
    },
    {
      id: 'galaxy',
      name: 'Galaxy',
      description: 'Effet de galaxie avec particules animées',
      component: (
        <Galaxy
          particleCount={1000}
          particleSize={1}
          particleSpeed={0.5}
          particleColor="#ffffff"
          style={{ width: '100%', height: '100%' }}
        />
      )
    },
  ];

  return (
    <SectionWrapper
      id="backgrounds"
      title="Arrière-plans"
      subtitle="Collection d'arrière-plans animés et interactifs"
      demos={backgroundDemos}
      initialActiveDemo="threads"
    />
  );
}