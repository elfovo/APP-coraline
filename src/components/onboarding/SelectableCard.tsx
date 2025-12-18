'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface SelectableCardProps {
  title: string;
  description?: string;
  onClick: () => void;
  isSelected: boolean;
  delay?: number;
  icon?: ReactNode;
  className?: string;
  onInfoClick?: () => void;
  showInfoButton?: boolean;
}

export default function SelectableCard({
  title,
  description,
  onClick,
  isSelected,
  delay = 0,
  icon,
  className = '',
  onInfoClick,
  showInfoButton = false
}: SelectableCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-[280px] min-h-[100px] p-6 
        ${isSelected 
          ? 'bg-gradient-to-br from-white/20 via-white/15 to-white/10 border-white/50' 
          : 'bg-gradient-to-br from-white/10 via-white/5 to-white/0 border-white/20'
        }
        backdrop-blur-xl
        border-2
        rounded-3xl
        hover:border-white/40
        transition-all duration-300 
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
      
      {/* Indicateur de sélection */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white flex items-center justify-center">
          <svg 
            className="w-4 h-4 text-black" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      
      {/* Contenu */}
      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-2">
          {icon && (
            <div className={`${isSelected ? 'text-white' : 'text-white/90'} group-hover:text-white transition-colors flex-shrink-0`}>
              {icon}
            </div>
          )}
          <h3 className={`text-lg font-bold flex-1 ${isSelected ? 'text-white' : 'text-white/90'} group-hover:text-white transition-colors`}>
            {title}
          </h3>
          {showInfoButton && onInfoClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick();
              }}
              className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 flex items-center justify-center text-white/70 hover:text-white transition-all duration-200 text-[10px] font-semibold"
              title="Information"
            >
              i
            </button>
          )}
        </div>
        {description && (
          <p className={`text-sm leading-relaxed ${isSelected ? 'text-white/90' : 'text-white/70'} group-hover:text-white/80 transition-colors`}>
            {description}
          </p>
        )}
      </div>
    </motion.button>
  );
}

