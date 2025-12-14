'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiHome,
  HiCalendar,
  HiChartBar,
  HiUser,
  HiClipboardList,
  HiBookOpen,
} from 'react-icons/hi';

export default function SimpleNav() {
  const pathname = usePathname();

  const isRouteActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navItems = [
    {
      href: '/',
      icon: HiHome,
      label: 'Accueil',
    },
    {
      href: '/statistique',
      icon: HiChartBar,
      label: 'Statistique',
    },
    {
      href: '/journal',
      icon: HiClipboardList,
      label: 'Journal',
    },
    {
      href: '/contenu',
      icon: HiBookOpen,
      label: 'Contenu',
    },
    {
      href: '/profil',
      icon: HiUser,
      label: 'Profil',
    },
  ];

  return (
    <>
      {/* Dégradé pour transition douce - mobile (en bas) */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-20 pointer-events-none z-40 md:hidden"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.4) 82%, rgba(0,0,0,0.25) 88%, rgba(0,0,0,0.15) 93%, rgba(0,0,0,0.08) 96%, rgba(0,0,0,0.04) 98%, rgba(0,0,0,0) 100%)'
        }}
      ></div>
      {/* Dégradé pour transition douce - desktop (en haut) */}
      <div 
        className="fixed top-0 left-0 right-0 h-20 pointer-events-none z-40 hidden md:block"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.4) 82%, rgba(0,0,0,0.25) 88%, rgba(0,0,0,0.15) 93%, rgba(0,0,0,0.08) 96%, rgba(0,0,0,0.04) 98%, rgba(0,0,0,0) 100%)'
        }}
      ></div>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto">
        <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-16 md:justify-center md:gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex flex-col items-center justify-center 
                  w-16 h-16 md:w-auto md:h-auto md:flex-row md:gap-2 md:px-4 md:py-2
                  transition-all duration-200
                  ${isActive 
                    ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]' 
                    : 'text-white/60 hover:text-white'
                  }
                `}
                aria-label={item.label}
              >
                <Icon
                  className={`
                    flex-shrink-0 w-6 h-6 md:w-5 md:h-5 transition-transform duration-200
                    ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]' : ''}
                    group-hover:scale-110 group-hover:-rotate-3
                  `}
                />
                <span
                  className={`
                    inline-flex text-xs mt-1 md:mt-0 md:text-sm font-medium
                    transition-all duration-200
                    group-hover:translate-x-1 group-hover:scale-110
                  `}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
    </>
  );
}

