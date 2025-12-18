'use client';

import { motion } from 'motion/react';
import { ReactNode, useEffect, useState } from 'react';

interface OptionCardProps {
  title: string;
  description: string;
  onClick: () => void;
  delay?: number;
  icon?: ReactNode;
  className?: string;
}

export default function OptionCard({
  title,
  description,
  onClick,
  delay = 0,
  icon,
  className = ''
}: OptionCardProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const ms = Math.round((delay + 0.5) * 1000) + 50;
    const t = setTimeout(() => setEntered(true), ms);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        entered
          ? { duration: 0.12, ease: 'easeOut' }
          : {
              duration: 0.5,
              delay,
              ease: [0.16, 1, 0.3, 1] // easeOutExpo
            }
      }
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.08, ease: 'easeOut' }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full flex-1 min-h-[140px] p-6 
        bg-gradient-to-br from-white/10 via-white/5 to-white/0
        backdrop-blur-xl
        border border-white/20 
        rounded-3xl
        hover:border-white/40
        hover:bg-gradient-to-br hover:from-white/15 hover:via-white/10 hover:to-white/5
        transition-[background-color,border-color,box-shadow] duration-300 
        text-left
        group
        shadow-lg hover:shadow-2xl
        relative overflow-hidden
        flex flex-col
        ${className}
      `}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Contenu */}
      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-2">
          {icon && (
            <div className="text-white/90 group-hover:text-white transition-colors flex-shrink-0">
              {icon}
            </div>
          )}
          <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">
            {title}
          </h3>
        </div>
        <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/80 transition-colors flex-1">
          {description}
        </p>
      </div>

      {/* Indicateur de flèche */}
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg 
          className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.button>
  );
}




