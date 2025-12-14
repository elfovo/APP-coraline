'use client';

import Orb from '@/components/backgrounds/Orb.jsx';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomeSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.5 });
    
    // Animation fade-in pour les éléments
    tl.fromTo(titleRef.current, 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    )
    .fromTo(subtitleRef.current, 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
      "-=0.7"
    )
    .fromTo(descriptionRef.current, 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
      "-=0.7"
    );
  }, []);

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative bg-background">
      {/* Fond animé selon le thème */}
      <div className="absolute inset-0 z-0">
          <div style={{ width: '100%', height: '100%', opacity: 0.6 }}>
            <Orb
              hue={200}
              hoverIntensity={0.2}
              rotateOnHover={true}
              forceHoverState={false}
            />
          </div>
        
        {/* Gradient fade-out en bas - transition très douce */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 75%, transparent 100%)'
              : 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%, transparent 100%)'
          }}
        />
      </div>
      
      {/* Contenu de la section */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <h1 
            ref={titleRef}
            className="text-6xl font-bold mb-6 drop-shadow-lg text-foreground" 
            style={{ opacity: 0 }}
          >
            Composants Showcase
          </h1>
          <h2 
            ref={subtitleRef}
            className="text-2xl mb-6 drop-shadow-md text-muted-foreground" 
            style={{ opacity: 0 }}
          >
            Bibliothèque de composants réutilisables
          </h2>
          <p 
            ref={descriptionRef}
            className="text-xl max-w-3xl mx-auto drop-shadow-sm text-muted-foreground" 
            style={{ opacity: 0 }}
          >
            Découvrez ma collection de composants modernes et interactifs. 
            Chaque élément est conçu pour être facilement intégré dans vos projets.
          </p>
        </div>
      </div>
    </section>
  );
}

